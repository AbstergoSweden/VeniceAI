import imageCache from './cache.js';

/**
 * Makes an API call with automatic key rotation, retries, and caching.
 *
 * @param {string} url - The URL to make the request to.
 * @param {object} data - The data to send in the body of the request.
 * @param {object} config - Configuration object containing API keys.
 * @param {number} [initialKeyIndex=0] - The index of the API key to start with.
 * @param {boolean} [isBinary=false] - Whether the expected response is binary data.
 * @returns {Promise<any>} A promise that resolves with the response data (JSON or ArrayBuffer).
 * @throws {Error} If all API keys fail or a non-retriable error occurs.
 */
export const apiCall = async (url, data, config, initialKeyIndex = 0, isBinary = false) => {
    // Check if this is an image generation request and if we have it cached
    if (url.includes('/image/generate') && data) {
        const cachedImage = imageCache.getCached(data);
        if (cachedImage) {
            console.log('Returning cached image for prompt:', data.prompt.substring(0, 30) + '...');
            return { images: [cachedImage] }; // Return in same format as API
        }
    }

    let lastError = null;
    const totalKeys = config.API_KEYS.length;

    // Loop through all keys, starting from initialKeyIndex and wrapping around
    for (let i = 0; i < totalKeys; i++) {
        const keyIndex = (initialKeyIndex + i) % totalKeys;
        const apiKey = config.API_KEYS[keyIndex];
        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = isBinary ? await response.arrayBuffer() : await response.json();

                    // If this was an image generation request, cache the result
                    if (url.includes('/image/generate') && result.images && result.images[0]) {
                        imageCache.set(imageCache.generateKey(data), result.images[0]);
                    }

                    return result;
                }

                // Handle specific status codes
                if (response.status === 401) {
                    // Unauthorized: Try next key immediately
                    const err = new Error("Unauthorized");
                    err.status = 401;
                    throw err;
                }

                if (response.status === 429) {
                    // Rate Limit: Retry with exponential backoff
                    if (retries < maxRetries) {
                        const delay = Math.pow(2, retries) * 1000 + Math.random() * 500;
                        await new Promise(r => setTimeout(r, delay));
                        retries++;
                        continue;
                    }
                    // Retries exhausted, try next key
                    const err = new Error("Rate limit exceeded");
                    err.status = 429;
                    throw err;
                }

                // Handle payment required (premium models) - don't rotate keys
                if (response.status === 402) {
                    const errorData = await response.json().catch(() => ({}));
                    const error = new Error(errorData.error?.message || 'Payment required for this model');
                    error.status = 402;
                    error.doNotRetry = true;
                    throw error;
                }

                // Handle other client/server errors
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                // Don't retry client errors (4xx), but allow retry for server errors (5xx)
                error.doNotRetry = response.status < 500;
                throw error;

            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;

                if (error.name === 'AbortError') {
                    lastError = new Error("Request timed out");
                }

                // If explicitly marked doNotRetry, fail immediately
                if (error.doNotRetry) {
                    throw error;
                }

                // For network errors, timeouts, 401s, or exhausted 429s, break inner loop to try next key
                break;
            }
        }
    }

    throw lastError || new Error("All API keys failed.");
};
