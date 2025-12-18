import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    transformModel,
    getCachedModels,
    cacheModels,
    fetchModelsFromAPI,
    syncVeniceModels,
    clearModelCache,
    getCacheInfo,
    DEFAULT_CHAT_MODELS
} from './modelSync';

describe('Venice Model Sync Utility', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('transformModel', () => {
        it('should transform API model to app format', () => {
            const apiModel = {
                id: 'test-model',
                model_spec: {
                    name: 'Test Model',
                    availableContextTokens: 16384,
                    capabilities: {
                        supportsVision: true,
                        supportsReasoning: false,
                        supportsFunctionCalling: true
                    }
                }
            };

            const result = transformModel(apiModel);

            expect(result).toEqual({
                id: 'test-model',
                name: 'Test Model',
                vision: true,
                reasoning: false,
                context: 16384,
                functionCalling: true,
                webSearch: false
            });
        });

        it('should handle missing capabilities gracefully', () => {
            const apiModel = {
                id: 'minimal-model',
                model_spec: {
                    name: 'Minimal Model'
                }
            };

            const result = transformModel(apiModel);

            expect(result.vision).toBe(false);
            expect(result.reasoning).toBe(false);
            expect(result.context).toBe(32768); // default
        });

        it('should use id as name if name missing', () => {
            const apiModel = {
                id: 'unnamed-model',
                model_spec: {}
            };

            const result = transformModel(apiModel);
            expect(result.name).toBe('unnamed-model');
        });
    });

    describe('cacheModels and getCachedModels', () => {
        it('should cache and retrieve models', () => {
            const models = [
                { id: 'model1', name: 'Model 1', vision: true, reasoning: false },
                { id: 'model2', name: 'Model 2', vision: false, reasoning: true }
            ];

            const cached = cacheModels(models);
            expect(cached).toBe(true);

            const retrieved = getCachedModels();
            expect(retrieved).toEqual(models);
        });

        it('should return null for empty cache', () => {
            const result = getCachedModels();
            expect(result).toBeNull();
        });

        it('should return null for expired cache', () => {
            const models = [{ id: 'old-model', name: 'Old Model', vision: false, reasoning: false }];

            // Mock old timestamp (25 hours ago)
            const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
            const cacheEntry = {
                data: models,
                timestamp: oldTimestamp,
                ttl: 24 * 60 * 60 * 1000
            };

            localStorage.setItem('venice-chat-models', JSON.stringify(cacheEntry));

            const result = getCachedModels();
            expect(result).toBeNull();

            // Cache should be cleared
            expect(localStorage.getItem('venice-chat-models')).toBeNull();
        });

        it('should handle corrupted cache gracefully', () => {
            localStorage.setItem('venice-chat-models', 'invalid-json');

            const result = getCachedModels();
            expect(result).toBeNull();
        });
    });

    describe('fetchModelsFromAPI', () => {
        it('should fetch and transform models from API', async () => {
            const mockResponse = {
                data: [
                    {
                        id: 'api-model',
                        model_spec: {
                            name: 'API Model',
                            capabilities: {
                                supportsVision: true,
                                supportsReasoning: true
                            }
                        }
                    }
                ]
            };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const models = await fetchModelsFromAPI('test-api-key');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.venice.ai/api/v1/models?type=text',
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json'
                    }
                })
            );

            expect(models).toHaveLength(1);
            expect(models[0].id).toBe('api-model');
            expect(models[0].vision).toBe(true);
            expect(models[0].reasoning).toBe(true);
        });

        it('should throw error on API failure', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            await expect(fetchModelsFromAPI('bad-key')).rejects.toThrow('API request failed: 401 Unauthorized');
        });

        it('should handle empty API response', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const models = await fetchModelsFromAPI('test-key');
            expect(models).toEqual([]);
        });
    });

    describe('syncVeniceModels', () => {
        it('should return cached models if cache is fresh', async () => {
            const cachedModels = [{ id: 'cached-model', name: 'Cached', vision: true, reasoning: false }];
            cacheModels(cachedModels);

            const models = await syncVeniceModels('test-key');

            expect(models).toEqual(cachedModels);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should fetch from API if cache is missing', async () => {
            const apiModels = {
                data: [
                    {
                        id: 'new-model',
                        model_spec: {
                            name: 'New Model',
                            capabilities: { supportsVision: false, supportsReasoning: true }
                        }
                    }
                ]
            };

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => apiModels
            });

            const models = await syncVeniceModels('test-key');

            expect(global.fetch).toHaveBeenCalled();
            expect(models).toHaveLength(1);
            expect(models[0].id).toBe('new-model');

            // Should cache the result
            const cached = getCachedModels();
            expect(cached).toEqual(models);
        });

        it('should force refresh when requested', async () => {
            const cachedModels = [{ id: 'old', name: 'Old', vision: false, reasoning: false }];
            cacheModels(cachedModels);

            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 'fresh',
                            model_spec: { name: 'Fresh', capabilities: {} }
                        }
                    ]
                })
            });

            const models = await syncVeniceModels('test-key', 'https://api.venice.ai/api/v1', true);

            expect(global.fetch).toHaveBeenCalled();
            expect(models[0].id).toBe('fresh');
        });

        it('should return defaults on API failure with no cache', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const models = await syncVeniceModels('test-key');

            expect(models).toEqual(DEFAULT_CHAT_MODELS);
        });

        it('should return defaults if API returns empty array', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] })
            });

            const models = await syncVeniceModels('test-key');

            expect(models).toEqual(DEFAULT_CHAT_MODELS);
        });
    });

    describe('clearModelCache', () => {
        it('should clear cached models', () => {
            const models = [{ id: 'test', name: 'Test', vision: false, reasoning: false }];
            cacheModels(models);

            expect(getCachedModels()).toEqual(models);

            const cleared = clearModelCache();
            expect(cleared).toBe(true);
            expect(getCachedModels()).toBeNull();
        });
    });

    describe('getCacheInfo', () => {
        it('should return cache info for cached models', () => {
            const models = [{ id: 'info-test', name: 'Info Test', vision: false, reasoning: false }];
            cacheModels(models);

            const info = getCacheInfo();

            expect(info.cached).toBe(true);
            expect(info.count).toBe(1);
            expect(info.fresh).toBe(true);
            expect(info.age).toBeGreaterThanOrEqual(0);
            expect(info.timestamp).toBeTruthy();
        });

        it('should return empty info for no cache', () => {
            const info = getCacheInfo();

            expect(info.cached).toBe(false);
            expect(info.count).toBe(0);
            expect(info.age).toBe(0);
            expect(info.fresh).toBe(false);
        });

        it('should handle corrupted cache', () => {
            localStorage.setItem('venice-chat-models', 'bad-data');

            const info = getCacheInfo();
            expect(info.error).toBe(true);
        });
    });

    describe('DEFAULT_CHAT_MODELS', () => {
        it('should export default models', () => {
            expect(DEFAULT_CHAT_MODELS).toBeInstanceOf(Array);
            expect(DEFAULT_CHAT_MODELS.length).toBeGreaterThan(0);
            expect(DEFAULT_CHAT_MODELS[0]).toHaveProperty('id');
            expect(DEFAULT_CHAT_MODELS[0]).toHaveProperty('name');
        });
    });
});
