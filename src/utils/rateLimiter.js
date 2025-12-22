/**
 * Client-side rate limiter using token bucket algorithm.
 * Prevents API abuse by limiting request frequency.
 */

/**
 * Rate limiter configuration for different endpoints
 */
const RATE_LIMITS = {
    'image/generate': {
        tokensPerInterval: 10, // 10 requests
        interval: 60000, // per minute
        maxTokens: 10
    },
    'chat': {
        tokensPerInterval: 30,
        interval: 60000,
        maxTokens: 30
    },
    'upscale': {
        tokensPerInterval: 5,
        interval: 60000,
        maxTokens: 5
    },
    'default': {
        tokensPerInterval: 20,
        interval: 60000,
        maxTokens: 20
    }
};

/**
 * @typedef {Object} BucketState
 * @property {number} tokens - Current number of tokens
 * @property {number} lastRefill - Timestamp of last refill
 */

// Store bucket states per endpoint
const buckets = new Map();

/**
 * Gets the endpoint key from a URL.
 * 
 * @param {string} url - The API URL
 * @returns {string} The endpoint key
 */
const getEndpointKey = (url) => {
    if (url.includes('/image/generate')) return 'image/generate';
    if (url.includes('/chat')) return 'chat';
    if (url.includes('/upscale')) return 'upscale';
    return 'default';
};

/**
 * Refills tokens in the bucket based on elapsed time.
 * 
 * @param {BucketState} bucket - The bucket state
 * @param {Object} config - The rate limit configuration
 * @returns {BucketState} Updated bucket state
 */
const refillTokens = (bucket, config) => {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const intervalsElapsed = timePassed / config.interval;
    const tokensToAdd = intervalsElapsed * config.tokensPerInterval;

    return {
        tokens: Math.min(config.maxTokens, bucket.tokens + tokensToAdd),
        lastRefill: now
    };
};

/**
 * Checks if a request can proceed based on rate limits.
 * 
 * @param {string} url - The API URL to check
 * @returns {{ allowed: boolean, retryAfter?: number, remaining: number }} Rate limit status
 */
export const checkRateLimit = (url) => {
    const endpointKey = getEndpointKey(url);
    const config = RATE_LIMITS[endpointKey];

    // Initialize bucket if it doesn't exist
    if (!buckets.has(endpointKey)) {
        buckets.set(endpointKey, {
            tokens: config.maxTokens,
            lastRefill: Date.now()
        });
    }

    let bucket = buckets.get(endpointKey);

    // Refill tokens based on time elapsed
    bucket = refillTokens(bucket, config);

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
        // Consume one token
        bucket.tokens -= 1;
        buckets.set(endpointKey, bucket);

        return {
            allowed: true,
            remaining: Math.floor(bucket.tokens)
        };
    }

    // Calculate retry after time
    const tokensNeeded = 1 - bucket.tokens;
    const timeToWait = (tokensNeeded / config.tokensPerInterval) * config.interval;

    return {
        allowed: false,
        retryAfter: Math.ceil(timeToWait / 1000), // Convert to seconds
        remaining: 0
    };
};

/**
 * Resets rate limit for an endpoint (for testing or admin purposes).
 * 
 * @param {string} url - The API URL
 */
export const resetRateLimit = (url) => {
    const endpointKey = getEndpointKey(url);
    buckets.delete(endpointKey);
};

/**
 * Gets the current rate limit status for an endpoint.
 * 
 * @param {string} url - The API URL
 * @returns {{ tokens: number, maxTokens: number, tokensPerInterval: number, interval: number }}
 */
export const getRateLimitStatus = (url) => {
    const endpointKey = getEndpointKey(url);
    const config = RATE_LIMITS[endpointKey];

    if (!buckets.has(endpointKey)) {
        return {
            tokens: config.maxTokens,
            maxTokens: config.maxTokens,
            tokensPerInterval: config.tokensPerInterval,
            interval: config.interval
        };
    }

    let bucket = buckets.get(endpointKey);
    bucket = refillTokens(bucket, config);
    buckets.set(endpointKey, bucket);

    return {
        tokens: Math.floor(bucket.tokens),
        maxTokens: config.maxTokens,
        tokensPerInterval: config.tokensPerInterval,
        interval: config.interval
    };
};

/**
 * Creates a custom error for rate limit exceeded.
 */
export class RateLimitError extends Error {
    constructor(retryAfter, remaining) {
        super(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
        this.remaining = remaining;
        this.status = 429;
    }
}
