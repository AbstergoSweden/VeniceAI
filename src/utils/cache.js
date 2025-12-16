// Image caching utility to reduce API calls
const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `venice-image-cache-${CACHE_VERSION}`;
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class ImageCache {
  constructor(ttl = DEFAULT_CACHE_TTL) {
    this.ttl = ttl;
  }

  // Generate a unique key based on the request parameters
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

  // Simple hash function to create a short key from the parameter string
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Store an image in cache with timestamp
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

  // Retrieve an image from cache if it exists and hasn't expired
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

  // Check if we have a cached image for these parameters
  hasCached(params) {
    const key = this.generateKey(params);
    return this.get(key) !== null;
  }

  // Get cached image if available
  getCached(params) {
    const key = this.generateKey(params);
    return this.get(key);
  }

  // Clear expired entries and optionally all entries
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

  // Get cache statistics
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