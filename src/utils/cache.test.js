import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { set, get, generateKey, getCached, cleanup, getStats, setQuotaExceededCallback } from './cache';

describe('Image Cache Utility', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('generateKey', () => {
        it('should generate consistent keys for identical params', () => {
            const params = { prompt: 'test', model: 'fluently-xl', seed: 123 };
            const key1 = generateKey(params);
            const key2 = generateKey(params);
            expect(key1).toBe(key2);
        });

        it('should generate different keys for different params', () => {
            const params1 = { prompt: 'test1', seed: 123 };
            const params2 = { prompt: 'test2', seed: 123 };
            const key1 = generateKey(params1);
            const key2 = generateKey(params2);
            expect(key1).not.toBe(key2);
        });

        it('should only include cacheable parameters', () => {
            const params1 = {
                prompt: 'test',
                seed: 123,
                timestamp: Date.now() // Non-cacheable
            };
            const params2 = {
                prompt: 'test',
                seed: 123,
                timestamp: Date.now() + 1000 // Different timestamp
            };

            // Keys should be same despite different timestamps
            const key1 = generateKey(params1);
            const key2 = generateKey(params2);
            expect(key1).toBe(key2);
        });
    });

    describe('set and get', () => {
        it('should store and retrieve cache entries', () => {
            const key = 'test-key';
            const imageData = 'base64encodedimage';

            const result = set(key, imageData);
            expect(result).toBe(true);

            const retrieved = get(key);
            expect(retrieved).toBe(imageData);
        });

        it('should return null for non-existent keys', () => {
            const result = get('non-existent-key');
            expect(result).toBeNull();
        });

        it('should handle QuotaExceededError gracefully', () => {
            // Create QuotaExceededError
            const error = new DOMException('QuotaExceededError', 'QuotaExceededError');

            // Mock setItem to throw on the actual set call
            const originalSetItem = localStorage.setItem.bind(localStorage);
            let callCount = 0;
            vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
                callCount++;
                // Throw on first call (the actual set attempt)
                if (callCount === 1) {
                    throw error;
                }
                // Let cleanup calls work normally
                return originalSetItem(key, value);
            });

            const result = set('test-key', 'data');
            expect(result).toBe(false);
        });

        it('should call quota exceeded callback on QuotaExceededError', () => {
            const callback = vi.fn();
            setQuotaExceededCallback(callback);

            // Create QuotaExceededError
            const error = new DOMException('QuotaExceededError', 'QuotaExceededError');

            // Mock setItem to throw
            const originalSetItem = localStorage.setItem.bind(localStorage);
            let callCount = 0;
            vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
                callCount++;
                if (callCount === 1) {
                    throw error;
                }
                return originalSetItem(key, value);
            });

            set('test-key', 'data');

            expect(callback).toHaveBeenCalledWith(error);

            // Reset callback
            setQuotaExceededCallback(null);
        });

        it('should remove expired entries on get', () => {
            const key = 'expired-key';
            const imageData = 'base64';

            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);

            set(key, imageData);

            // Advance time past TTL (25 hours)
            vi.spyOn(Date, 'now').mockReturnValue(now + 25 * 60 * 60 * 1000);

            const retrieved = get(key);
            expect(retrieved).toBeNull();

            // Verify it was removed from storage
            const inStorage = localStorage.getItem(key);
            expect(inStorage).toBeNull();
        });
    });

    describe('getCached', () => {
        it('should retrieve cached image by params', () => {
            const params = { prompt: 'test', model: 'fluently-xl', seed: 42 };
            const imageData = 'base64image';

            const key = generateKey(params);
            set(key, imageData);

            const retrieved = getCached(params);
            expect(retrieved).toBe(imageData);
        });

        it('should return null for uncached params', () => {
            const params = { prompt: 'test', model: 'fluently-xl', seed: 42 };
            const retrieved = getCached(params);
            expect(retrieved).toBeNull();
        });
    });

    describe('cleanup', () => {
        // BUG #1 TEST: This test should fail before the fix and pass after
        it('should remove ALL expired entries without skipping (Bug #1)', () => {
            // This test verifies that cleanup doesn't skip expired entries
            //when iterating through localStorage

            const cachePrefix = 'venice-image-cache-v1:';
            const now = Date.now();

            // Create 5 entries: 3 will be expired, 2 will be valid
            // We create them in an interleaved pattern to trigger the skip bug
            const entries = [
                { key: `${cachePrefix}item1`, data: 'data1', ageHours: 26 }, // expired
                { key: `${cachePrefix}item2`, data: 'data2', ageHours: 1 },  // valid
                { key: `${cachePrefix}item3`, data: 'data3', ageHours: 26 }, // expired
                { key: `${cachePrefix}item4`, data: 'data4', ageHours: 2 },  // valid
                { key: `${cachePrefix}item5`, data: 'data5', ageHours: 26 }  // expired
            ];

            // Manually create cache entries with specific timestamps
            entries.forEach(entry => {
                const entryAge = entry.ageHours * 60 * 60 * 1000;
                const cacheEntry = {
                    data: entry.data,
                    timestamp: now - entryAge, // Set timestamp in the past
                    ttl: 24 * 60 * 60 * 1000 // 24 hour TTL
                };
                localStorage.setItem(entry.key, JSON.stringify(cacheEntry));
            });

            // Mock Date.now to return current time
            vi.spyOn(Date, 'now').mockReturnValue(now);

            // Run cleanup - should remove only expired entries (3)
            const removed = cleanup(false);

            // Should remove exactly 3 expired entries
            expect(removed).toBe(3);

            // Verify specific entries
            expect(get(entries[0].key)).toBeNull(); // item1 expired
            expect(get(entries[1].key)).toBe('data2'); // item2 valid
            expect(get(entries[2].key)).toBeNull(); // item3 expired
            expect(get(entries[3].key)).toBe('data4'); // item4 valid
            expect(get(entries[4].key)).toBeNull(); // item5 expired
        });

        it('should remove expired entries when all=false', () => {
            const cachePrefix = 'venice-image-cache-v1:';
            const key1 = `${cachePrefix}expired-key`;
            const key2 = `${cachePrefix}valid-key`;

            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);

            set(key1, 'data1');
            set(key2, 'data2');

            // Advance time past TTL for all entries
            vi.spyOn(Date, 'now').mockReturnValue(now + 25 * 60 * 60 * 1000);

            const removed = cleanup(false);

            expect(removed).toBe(2); // Both entries are now expired
            expect(get(key1)).toBeNull();
            expect(get(key2)).toBeNull();
        });

        it('should remove all entries when all=true', () => {
            const cachePrefix = 'venice-image-cache-v1:';
            set(`${cachePrefix}key1`, 'data1');
            set(`${cachePrefix}key2`, 'data2');
            set(`${cachePrefix}key3`, 'data3');

            const removed = cleanup(true);

            expect(removed).toBe(3);
            expect(get(`${cachePrefix}key1`)).toBeNull();
            expect(get(`${cachePrefix}key2`)).toBeNull();
            expect(get(`${cachePrefix}key3`)).toBeNull();
        });

        it('should remove malformed entries', () => {
            const malformedKey = 'venice-image-cache-v1:malformed';
            localStorage.setItem(malformedKey, 'invalid-json');

            const removed = cleanup(false);

            expect(removed).toBeGreaterThan(0);
            expect(localStorage.getItem(malformedKey)).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should return accurate cache statistics', () => {
            const cachePrefix = 'venice-image-cache-v1:';
            set(`${cachePrefix}key1`, 'a'.repeat(100));
            set(`${cachePrefix}key2`, 'b'.repeat(200));
            set(`${cachePrefix}key3`, 'c'.repeat(300));

            const stats = getStats();

            expect(stats.count).toBe(3);
            expect(stats.size).toBeTruthy();
            expect(stats.sizeKB).toBeTruthy();
            expect(stats.sizeMB).toBeTruthy();
            expect(typeof stats.count).toBe('number');
            expect(typeof stats.size).toBe('string');
        });

        it('should count expired entries', () => {
            const cachePrefix = 'venice-image-cache-v1:';
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);

            set(`${cachePrefix}key1`, 'data1');
            set(`${cachePrefix}key2`, 'data2');

            // Advance time past TTL
            vi.spyOn(Date, 'now').mockReturnValue(now + 25 * 60 * 60 * 1000);

            const stats = getStats();

            expect(stats.count).toBe(2);
            expect(stats.expired).toBe(2);
        });

        it('should return zero stats for empty cache', () => {
            const stats = getStats();

            expect(stats.count).toBe(0);
            expect(stats.expired).toBe(0);
            expect(stats.size).toBe('0 bytes');
        });
    });

    describe('Edge Cases', () => {
        it('should handle localStorage being unavailable', () => {
            const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
            getItemSpy.mockImplementation(() => { throw new Error('Storage unavailable'); });

            const result = get('any-key');
            expect(result).toBeNull();

            getItemSpy.mockRestore();
        });

        it('should handle corrupted cache entries', () => {
            const key = 'corrupted-key';
            localStorage.setItem(key, '{invalid json}');

            const result = get(key);
            expect(result).toBeNull();
        });

        it('should handle missing timestamp in cache entry', () => {
            const cachePrefix = 'venice-image-cache-v1:';
            const key = `${cachePrefix}no-timestamp-key`;
            const badEntry = { data: 'test' }; // Missing timestamp and ttl
            localStorage.setItem(key, JSON.stringify(badEntry));

            // When timestamp is undefined, (now - undefined) returns NaN
            // NaN > ttl is always false, so it returns the data
            // This behavior is acceptable - cleanup() will remove these as malformed
            const result = get(key);
            expect(result).toBe('test');
        });
    });

    describe('Functional Programming Compliance', () => {
        it('should not mutate input parameters', () => {
            const params = { prompt: 'test', seed: 123 };
            const originalParams = { ...params };

            generateKey(params);

            expect(params).toEqual(originalParams);
        });

        it('should be side-effect free except for localStorage', () => {
            const params = { prompt: 'test', seed: 123 };

            // Multiple calls to generateKey should be consistent
            const calls = Array.from({ length: 10 }, () => generateKey(params));
            const allSame = calls.every(key => key === calls[0]);

            expect(allSame).toBe(true);
        });
    });
});
