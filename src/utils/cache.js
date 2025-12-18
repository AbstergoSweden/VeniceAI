// Image caching utility to reduce API calls
// Refactored to use ES modules and plain objects instead of classes

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = `venice-image-cache-${CACHE_VERSION}`;
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * @typedef {Object} CacheEntry
 * @property {string} data - Base64 encoded image data
 * @property {number} timestamp - Creation timestamp in milliseconds
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * @typedef {Object} CacheStats
 * @property {number} count - Number of cached items
 * @property {string} size - Total size in bytes (formatted string)
 */

/**
 * @typedef {Object} ImageGenerationParams
 * @property {string} prompt - The text prompt
 * @property {string} [negative_prompt] - The negative prompt
 * @property {string} [model] - The model used
 * @property {number} [width] - Image width
 * @property {number} [height] - Image height
 * @property {number} [steps] - Number of steps
 * @property {number} [seed] - Random seed
 * @property {string} [style_preset] - Style preset
 * @property {boolean} [hide_watermark] - Whether to hide watermark
 * @property {boolean} [safe_mode] - Safe mode setting
 * @property {string} [format] - Output format
 */

// Cache configuration state (plain object)
const cacheConfig = {
  ttl: DEFAULT_CACHE_TTL,
  onQuotaExceeded: null // Callback for quota errors
};

/**
 * Creates a simple hash from a string.
 * Used to generate compact cache keys.
 *
 * @param {string} str - The input string to hash
 * @returns {string} The resulting hash as a string
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

/**
 * Generates a unique key based on the request parameters.
 * Only cacheable parameters are used to generate the key.
 *
 * @param {ImageGenerationParams} params - The image generation parameters
 * @returns {string} A unique string key for the cache entry
 */
export const generateKey = (params) => {
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
  return `${CACHE_PREFIX}:${hashString(keyString)}`;
};

/**
 * Stores an image in the cache with a timestamp.
 *
 * @param {string} key - The cache key
 * @param {string} imageBase64 - The base64 encoded image data
 * @returns {boolean} True if successfully stored, false otherwise
 */
export const set = (key, imageBase64) => {
  try {
    const cacheEntry = {
      data: imageBase64,
      timestamp: Date.now(),
      ttl: cacheConfig.ttl
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    return true;
  } catch (error) {
    console.warn('Failed to save to cache:', error);

    // Handle QuotaExceededError specifically
    if (error.name === 'QuotaExceededError') {
      // Notify via callback if provided
      if (typeof cacheConfig.onQuotaExceeded === 'function') {
        cacheConfig.onQuotaExceeded(error);
      }
      // Attempt auto-cleanup of expired entries
      cleanup(false);
    }

    return false;
  }
};

/**
 * Retrieves an image from the cache if it exists and hasn't expired.
 * Removes expired entries if found.
 *
 * @param {string} key - The cache key
 * @returns {string|null} The base64 encoded image data if found and valid, null otherwise
 */
export const get = (key) => {
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
};

/**
 * Checks if a cached image exists for the given parameters.
 *
 * @param {ImageGenerationParams} params - The image generation parameters
 * @returns {boolean} True if a valid cache entry exists
 */
export const hasCached = (params) => {
  const key = generateKey(params);
  return get(key) !== null;
};

/**
 * Retrieves a cached image using parameters.
 *
 * @param {ImageGenerationParams} params - The image generation parameters
 * @returns {string|null} The base64 encoded image data if found, null otherwise
 */
export const getCached = (params) => {
  const key = generateKey(params);
  return get(key);
};

/**
 * Cleans up cache entries.
 * Can clear all entries or only expired ones.
 *
 * @param {boolean} [all=false] - If true, removes all entries. If false, removes only expired ones
 * @returns {number} Number of entries removed
 */
export const cleanup = (all = false) => {
  let removed = 0;

  if (!all) {
    // Clean up only expired entries
    const now = Date.now();

    // Fix for Bug #1: Collect keys first to avoid iteration issues
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    // Now iterate through collected keys and remove expired ones
    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue; // Key might have been removed

        const cacheEntry = JSON.parse(cached);
        if (now - cacheEntry.timestamp > cacheEntry.ttl) {
          localStorage.removeItem(key);
          removed++;
        }
      } catch (err) {
        // Remove malformed entries
        console.warn('Removing malformed cache entry:', key, err.message);
        localStorage.removeItem(key);
        removed++;
      }
    }
  } else {
    // Remove all cache entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        removed++;
      }
    }
  }

  return removed;
};

/**
 * Gets statistics about the current cache usage.
 *
 * @returns {CacheStats} Object containing count of items and total size in bytes
 */
export const getStats = () => {
  let count = 0;
  let size = 0;
  let expired = 0;
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      count++;
      const item = localStorage.getItem(key);
      size += item ? item.length : 0;

      // Count expired items
      try {
        const cacheEntry = JSON.parse(item);
        if (now - cacheEntry.timestamp > cacheEntry.ttl) {
          expired++;
        }
      } catch {
        // Malformed entry
        expired++;
      }
    }
  }

  return {
    count,
    expired,
    size: size + ' bytes',
    sizeKB: (size / 1024).toFixed(2) + ' KB',
    sizeMB: (size / 1024 / 1024).toFixed(2) + ' MB'
  };
};

/**
 * Sets a callback to be called when localStorage quota is exceeded.
 *
 * @param {Function} callback - Function to call on quota exceeded error
 */
export const setQuotaExceededCallback = (callback) => {
  cacheConfig.onQuotaExceeded = callback;
};

/**
 * Sets the TTL for new cache entries.
 *
 * @param {number} ttl - Time to live in milliseconds
 */
export const setTTL = (ttl) => {
  cacheConfig.ttl = ttl;
};

// Default export for backward compatibility
const imageCache = {
  generateKey,
  set,
  get,
  hasCached,
  getCached,
  cleanup,
  getStats,
  setQuotaExceededCallback,
  setTTL
};

export default imageCache;
