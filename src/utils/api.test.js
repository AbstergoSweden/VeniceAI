import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiCall } from './api';

// Mock config
const mockConfig = {
    API_KEYS: ['key1', 'key2'],
    BASE_API_URL: 'https://api.venice.ai',
};

// Mock fetch
global.fetch = vi.fn();

// Mock cache
vi.mock('../cache', () => ({
    default: {
        getCached: vi.fn(),
        set: vi.fn(),
        generateKey: vi.fn(),
    }
}));

describe('apiCall Logic', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('returns data on success', async () => {
        const mockData = { result: 'success' };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => mockData
        });

        const result = await apiCall('https://test.com', {}, mockConfig);
        expect(result).toEqual(mockData);
    });



    it('handles binary responses (arrayBuffer)', async () => {
        const mockArrayBuffer = new ArrayBuffer(8);
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: {
                get: (header) => header === 'content-type' ? 'image/png' : null
            },
            arrayBuffer: async () => mockArrayBuffer
        });

        // apiCall(url, data, config, initialKeyIndex, isBinary)
        const result = await apiCall('https://test.com', { prompt: 'test' }, mockConfig, 0, true);
        expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('retries on 429 Too Many Requests', async () => {
        // First call: 429
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: async () => ({ error: 'Too Many Requests' })
        });
        // Second call: Success
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({ success: true })
        });

        // We assume logic handles waiting or just retrying. 
        // If apiCall implements delay, this test might run slow without fake timers.
        // Assuming apiCall retries with next key immediately or after delay.
        // With rotation, it should try next key.
        const result = await apiCall('https://test.com', {}, mockConfig);
        expect(result).toEqual({ success: true });
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('wraps around to the first key if starting from a later index', async () => {
        // Mock fetch to always return 401
        global.fetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ error: { message: 'Unauthorized' } })
        });

        // Start at index 1 (key2) - expected to fail after trying all keys
        await apiCall('https://test.com', { prompt: 'test' }, mockConfig, 1).catch(() => {
            // Expected to fail
        });

        // Should call twice: key2 then key1
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer key2');
        expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer key1');
    });
});
