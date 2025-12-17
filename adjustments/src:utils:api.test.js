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
vi.mock('./cache', () => ({
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

    it('retries on 429 errors', async () => {
        // Fail once with 429, then succeed
        global.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 429,
                headers: { get: () => '1' }, // Retry-After: 1s
                json: async () => ({})
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: 'success' })
            });

        const result = await apiCall('https://test.com', { prompt: 'test' }, mockConfig);
        expect(result).toEqual({ data: 'success' });
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('fails fast on 402 Payment Required', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 402,
            json: async () => ({ error: { message: 'Payment Required' } })
        });

        await expect(apiCall('https://test.com', { prompt: 'test' }, mockConfig))
            .rejects.toThrow('Payment Required');

        // Should NOT retry or rotate keys
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles network timeouts (AbortError)', async () => {
        const error = new Error('The user aborted a request.');
        error.name = 'AbortError';
        global.fetch.mockRejectedValue(error);

        await expect(apiCall('https://test.com', { prompt: 'test' }, mockConfig))
            .rejects.toThrow('Request timed out');
    });
});