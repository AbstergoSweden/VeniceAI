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
