/**
 * Global Configuration for the Application
 */

import { maskSensitive } from './validation.js';

/**
 * Validates that API keys are properly configured
 * @param {string[]} keys - Array of API keys
 * @throws {Error} If no valid API keys are found
 */
const validateApiKeys = (keys) => {
    if (!keys || keys.length === 0) {
        throw new Error(
            'No API keys configured. Please set VITE_VENICE_API_KEYS in your .env file. ' +
            'See .env.example for configuration details.'
        );
    }

    // Check for placeholder/invalid keys
    const validKeys = keys.filter(key => {
        return key &&
            key.length > 10 &&
            !key.includes('your-') &&
            !key.includes('example');
    });

    if (validKeys.length === 0) {
        throw new Error(
            'No valid API keys found. API keys appear to be placeholder values. ' +
            'Please configure real API keys from https://venice.ai'
        );
    }

    if (import.meta.env.DEV && validKeys.length !== keys.length) {
        console.warn(
            `[Config] ${keys.length - validKeys.length} invalid API key(s) removed. ` +
            `Using ${validKeys.length} valid key(s).`
        );
    }

    return validKeys;
};

/**
 * Safely loads and validates API keys
 */
const loadApiKeys = () => {
    const rawKeys = (import.meta.env.VITE_VENICE_API_KEYS || '')
        .split(',')
        .filter(Boolean)
        .map(key => key.trim());

    return validateApiKeys(rawKeys);
};

/**
 * Logs configuration info safely (masks sensitive data)
 */
const logConfig = (config) => {
    if (!import.meta.env.DEV) return;

    console.log('[Config] Application configuration loaded:');
    console.log(`  - API Keys: ${config.API_KEYS.length} key(s) configured`);
    config.API_KEYS.forEach((key, idx) => {
        console.log(`    Key ${idx + 1}: ${maskSensitive(key)}`);
    });
    console.log(`  - Base URL: ${config.BASE_API_URL}`);
    console.log(`  - Collection: ${config.COLLECTION_NAME}`);
};

// Load and validate configuration
let API_KEYS;
try {
    API_KEYS = loadApiKeys();
} catch (error) {
    // In production, throw error immediately
    if (!import.meta.env.DEV) {
        throw error;
    }
    // In development, log warning and use empty array (will fail later when actually used)
    console.error('[Config Error]', error.message);
    API_KEYS = [];
}

export const CONFIG = {
    API_KEYS,
    BASE_API_URL: "https://api.venice.ai/api/v1",
    DEFAULT_NEGATIVE_PROMPT: "Ugly, old, overage, low-resolution, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, JPEG artifacts, signature, watermark, username, blurry.",
    COLLECTION_NAME: 'generatedImages'
};

// Log configuration in development
logConfig(CONFIG);

