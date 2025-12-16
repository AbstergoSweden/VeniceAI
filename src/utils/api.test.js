
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiCall, CONFIG } from './api';

// Mock fetch
global.fetch = vi.fn();

describe('apiCall Utility', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Reset CONFIG.API_KEYS if needed, but we can just override for tests via arguments or mocking if CONFIG was exported mutable, 
        // but CONFIG is a const object. We might need to mock successful responses.
    });

    const mockConfig = {
        API_KEYS: ['key1', 'key2', 'key3'],
        BASE_API_URL: 'https://api.example.com',
        COLLECTION_NAME: 'test_collection'
    };

    it('should return JSON data on success', async () => {
        const mockResponse = { data: 'test' };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await apiCall('https://api.example.com', {}, mockConfig);
        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 errors', async () => {
        // First call fails with 429
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: async () => ({ error: { message: "Too Many Requests" } }),
        });

        // Second call succeeds
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        // We can mock setTimeout to speed up test? 
        // But apiCall uses: await new Promise(r => setTimeout(r, Math.random() * 1000 + 1000));
        // We should use fake timers.
        vi.useFakeTimers();

        const promise = apiCall('https://api.example.com', {}, mockConfig);

        // Advance timers to skip backoff
        await vi.runAllTimersAsync();

        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(fetch).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
    });

    it('should rotate keys on 401 errors', async () => {
        // We need to ensure multiple keys exist in CONFIG. 
        // Since CONFIG is imported, we can't easily change it physically without proper mocking mechanism if it's not exported for modification.
        // However, the apiCall logic uses `keyIndex`.
        // If we force `fetch` to fail with 401, it should call itself with keyIndex + 1.

        fetch.mockResolvedValueOnce({ // Key 0 fails
            ok: false,
            status: 401,
            json: async () => ({ error: { message: "Unauthorized" } }),
        });

        fetch.mockResolvedValueOnce({ // Key 1 succeeds
            ok: true,
            json: async () => ({ success: true }),
        });

        const result = await apiCall('https://api.example.com', {}, mockConfig);
        expect(result).toEqual({ success: true });

        // Should have called fetch twice
        expect(fetch).toHaveBeenCalledTimes(2);

        // Check Authorization headers passed
        const firstCallHeaders = fetch.mock.calls[0][1].headers;
        const secondCallHeaders = fetch.mock.calls[1][1].headers;
        expect(firstCallHeaders['Authorization']).not.toBe(secondCallHeaders['Authorization']);
    });
});
