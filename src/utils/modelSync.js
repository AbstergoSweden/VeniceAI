/**
 * Venice.ai Model Sync Utility
 * 
 * Automatically fetches and caches chat models from Venice.ai API.
 * Implements client-side model syncing with localStorage caching.
 * 
 * @module modelSync
 */

const CACHE_KEY = 'venice-chat-models';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * @typedef {Object} ModelCapabilities
 * @property {boolean} supportsVision - Vision support
 * @property {boolean} supportsReasoning - Reasoning support
 * @property {boolean} supportsFunctionCalling - Function calling support
 * @property {boolean} supportsWebSearch - Web search support
 * @property {boolean} supportsResponseSchema - Structured output support
 */

/**
 * @typedef {Object} VeniceModel
 * @property {string} id - Model ID
 * @property {string} name - Human-readable model name
 * @property {boolean} vision - Vision capability
 * @property {boolean} reasoning - Reasoning capability
 * @property {number} [context] - Context window size
 * @property {boolean} [functionCalling] - Function calling capability
 * @property {boolean} [webSearch] - Web search capability
 */

/**
 * @typedef {Object} CachedModels
 * @property {VeniceModel[]} data - Array of models
 * @property {number} timestamp - Cache timestamp
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Default fallback models in case API fails
 */
const DEFAULT_CHAT_MODELS = [
    { id: 'mistral-31-24b', name: 'Venice Medium', vision: true, reasoning: false },
    { id: 'grok-41-fast', name: 'Grok 4.1 Fast', vision: true, reasoning: true },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', vision: true, reasoning: true },
    { id: 'claude-opus-45', name: 'Claude Opus 4.5', vision: true, reasoning: true },
    { id: 'google-gemma-3-27b-it', name: 'Google Gemma 3 27B', vision: true, reasoning: false },
    { id: 'qwen3-235b-a22b-instruct-2507', name: 'Qwen 3 235B Instruct', vision: false, reasoning: false },
    { id: 'qwen3-235b-a22b-thinking-2507', name: 'Qwen 3 235B Thinking', vision: false, reasoning: true },
    { id: 'openai-gpt-52', name: 'GPT-5.2', vision: false, reasoning: true },
];

/**
 * Transform API model response to app format.
 * 
 * @param {Object} apiModel - Raw model from Venice.ai API
 * @returns {VeniceModel} Transformed model object
 */
export const transformModel = (apiModel) => {
    const modelSpec = apiModel.model_spec || {};
    const capabilities = modelSpec.capabilities || {};

    return {
        id: apiModel.id,
        name: modelSpec.name || apiModel.id,
        vision: capabilities.supportsVision || false,
        reasoning: capabilities.supportsReasoning || false,
        context: modelSpec.availableContextTokens || 32768,
        functionCalling: capabilities.supportsFunctionCalling || false,
        webSearch: capabilities.supportsWebSearch || false,
    };
};

/**
 * Get cached models from localStorage.
 * 
 * @returns {VeniceModel[] | null} Cached models or null if cache invalid/expired
 */
export const getCachedModels = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - parsed.timestamp > parsed.ttl) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return parsed.data;
    } catch (error) {
        console.warn('Failed to read cached models:', error);
        return null;
    }
};

/**
 * Cache models in localStorage.
 * 
 * @param {VeniceModel[]} models - Models to cache
 * @returns {boolean} True if successfully cached
 */
export const cacheModels = (models) => {
    try {
        const cacheEntry = {
            data: models,
            timestamp: Date.now(),
            ttl: CACHE_TTL
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
        return true;
    } catch (error) {
        console.warn('Failed to cache models:', error);
        return false;
    }
};

/**
 * Fetch chat models from Venice.ai API.
 * 
 * @param {string} apiKey - Venice.ai API key
 * @param {string} [baseUrl='https://api.venice.ai/api/v1'] - API base URL
 * @returns {Promise<VeniceModel[]>} Array of chat models
 * @throws {Error} If API request fails
 */
export const fetchModelsFromAPI = async (apiKey, baseUrl = 'https://api.venice.ai/api/v1') => {
    const url = `${baseUrl}/models?type=text`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || [];

    // Transform to app format
    return models.map(transformModel);
};

/**
 * Sync Venice.ai chat models with caching.
 * 
 * Strategy:
 * 1. Check localStorage cache first
 * 2. If cache fresh (< 24h), return cached models
 * 3. If cache stale or missing, fetch from API
 * 4. Cache new models and return
 * 5. On any error, return defaults
 * 
 * @param {string} apiKey - Venice.ai API key
 * @param {string} [baseUrl='https://api.venice.ai/api/v1'] - API base URL
 * @param {boolean} [forceRefresh=false] - Force refresh from API, ignore cache
 * @returns {Promise<VeniceModel[]>} Array of chat models
 */
export const syncVeniceModels = async (apiKey, baseUrl = 'https://api.venice.ai/api/v1', forceRefresh = false) => {
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
        const cached = getCachedModels();
        if (cached && cached.length > 0) {
            console.log(`[ModelSync] Using cached models (${cached.length} models)`);
            return cached;
        }
    }

    // No valid cache, fetch from API
    try {
        console.log('[ModelSync] Fetching models from Venice.ai API...');
        const models = await fetchModelsFromAPI(apiKey, baseUrl);

        if (models.length === 0) {
            console.warn('[ModelSync] No models returned from API, using defaults');
            return DEFAULT_CHAT_MODELS;
        }

        console.log(`[ModelSync] Successfully fetched ${models.length} models`);

        // Cache the results
        cacheModels(models);

        return models;
    } catch (error) {
        console.error('[ModelSync] Failed to fetch models:', error);

        // Try to use stale cache as fallback
        const staleCache = getCachedModels();
        if (staleCache && staleCache.length > 0) {
            console.warn('[ModelSync] Using stale cache as fallback');
            return staleCache;
        }

        // Last resort: return defaults
        console.warn('[ModelSync] Using default models as fallback');
        return DEFAULT_CHAT_MODELS;
    }
};

/**
 * Clear cached models from localStorage.
 */
export const clearModelCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
        return true;
    } catch (error) {
        console.warn('Failed to clear model cache:', error);
        return false;
    }
};

/**
 * Get cache info (for debugging/UI).
 * 
 * @returns {Object} Cache information
 */
export const getCacheInfo = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return { cached: false, count: 0, age: 0, fresh: false };
        }

        const parsed = JSON.parse(cached);
        const now = Date.now();
        const age = now - parsed.timestamp;
        const fresh = age < parsed.ttl;

        return {
            cached: true,
            count: parsed.data.length,
            age: Math.floor(age / 1000 / 60), // minutes
            fresh,
            timestamp: new Date(parsed.timestamp).toISOString()
        };
    } catch {
        return { cached: false, count: 0, age: 0, fresh: false, error: true };
    }
};

// Export defaults for convenience
export { DEFAULT_CHAT_MODELS };
