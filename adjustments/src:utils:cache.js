// Image caching utility to reduce API calls
const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `venice-image-cache-${CACHE_VERSION}`;
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Class representing an image cache system using LocalStorage.
 * Handles storage, retrieval, and expiration of cached images to reduce API calls.
 */
class ImageCache {
  /**
   * Create an ImageCache instance.
   * @param {number} [ttl=DEFAULT_CACHE_TTL] - Time to live for cached items in milliseconds.
   */
  constructor(ttl = DEFAULT_CACHE_TTL) {
    this.ttl = ttl;
  }

  /**
   * Generates a unique key based on the request parameters.
   * Only cacheable parameters are used to generate the key.
   *
   * @param {object} params - The image generation parameters.
   * @param {string} params.prompt - The text prompt.
   * @param {string} [params.negative_prompt] - The negative prompt.
   * @param {string} [params.model] - The model used.
   * @param {number} [params.width] - Image width.
   * @param {number} [params.height] - Image height.
   * @param {number} [params.steps] - Number of steps.
   * @param {number} [params.seed] - Random seed.
   * @param {string} [params.style_preset] - Style preset.
   * @param {boolean} [params.hide_watermark] - Whether to hide watermark.
   * @param {boolean} [params.safe_mode] - Safe mode setting.
   * @param {string} [params.format] - Output format.
   * @returns {string} A unique string key for the cache entry.
   */
  generateKey(params) {
    // Create a string representation of the parameters (excluding non-cacheable items)
    const cacheableParams = {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt,
      model: params.model,
      width: params.width,
      height: params.height,
      steps: params.steps,
      seed: params.seed,
      style_preset: params.style_preset,
      hide_watermark: params.hide_watermark,
      safe_mode: params.safe_mode,
      format: params.format
    };

    const keyString = JSON.stringify(cacheableParams);
    return `${CACHE_PREFIX}:${this.hashString(keyString)}`;
  }

  /**
   * Creates a simple hash from a string.
   * Used to generate compact cache keys.
   *
   * @param {string} str - The input string to hash.
   * @returns {string} The resulting hash as a string.
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Stores an image in the cache with a timestamp.
   *
   * @param {string} key - The cache key.
   * @param {string} imageBase64 - The base64 encoded image data.
   * @returns {boolean} True if successfully stored, false otherwise.
   */
  set(key, imageBase64) {
    try {
      const cacheEntry = {
        data: imageBase64,
        timestamp: Date.now(),
        ttl: this.ttl
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
      return true;
    } catch (error) {
      console.warn('Failed to save to cache:', error);
      return false;
    }
  }

  /**
   * Retrieves an image from the cache if it exists and hasn't expired.
   * Removes expired entries if found.
   *
   * @param {string} key - The cache key.
   * @returns {string|null} The base64 encoded image data if found and valid, null otherwise.
   */
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check if the cache entry has expired
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to read from cache:', error);
      return null;
    }
  }

  /**
   * Checks if a cached image exists for the given parameters.
   *
   * @param {object} params - The image generation parameters.
   * @returns {boolean} True if a valid cache entry exists.
   */
  hasCached(params) {
    const key = this.generateKey(params);
    return this.get(key) !== null;
  }

  /**
   * Retrieves a cached image using parameters.
   *
   * @param {object} params - The image generation parameters.
   * @returns {string|null} The base64 encoded image data if found, null otherwise.
   */
  getCached(params) {
    const key = this.generateKey(params);
    return this.get(key);
  }

  /**
   * Cleans up cache entries.
   * Can clear all entries or only expired ones.
   *
   * @param {boolean} [all=false] - If true, removes all entries. If false, removes only expired ones.
   */
  cleanup(all = false) {
    if (!all) {
      // Clean up only expired entries
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            const cacheEntry = JSON.parse(cached);
            if (now - cacheEntry.timestamp > cacheEntry.ttl) {
              localStorage.removeItem(key);
              i--; // Adjust index after removal
            }
          } catch {
            // Remove malformed entries
            localStorage.removeItem(key);
            i--; // Adjust index after removal
          }
        }
      }
    } else {
      // Remove all cache entries
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Gets statistics about the current cache usage.
   *
   * @returns {object} Object containing count of items and total size in bytes.
   */
  getStats() {
    let count = 0;
    let size = 0;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        count++;
        const item = localStorage.getItem(key);
        size += item ? item.length : 0;

        // Also count expired items
        try {
          const cacheEntry = JSON.parse(item);
          if (now - cacheEntry.timestamp > cacheEntry.ttl) {
            count++; // Count as expired
          }
        } catch {
          // Malformed entry
        }
      }
    }

    return { count, size: size + ' bytes' };
  }
}

// Create a singleton instance
const imageCache = new ImageCache();

export default imageCache;