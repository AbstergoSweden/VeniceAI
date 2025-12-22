/**
 * Input validation and sanitization utilities for security.
 * Prevents XSS, injection attacks, and validates user inputs.
 */

import { isAddress } from 'ethers';

/**
 * Maximum allowed prompt length to prevent abuse
 */
const MAX_PROMPT_LENGTH = 10000;

/**
 * Dangerous HTML and script patterns to remove
 */
const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi // Event handlers like onclick=, onload=, etc.
];

/**
 * Sanitizes a text prompt by removing dangerous content.
 * 
 * @param {string} prompt - The user-provided prompt
 * @returns {string} The sanitized prompt
 * @throws {Error} If prompt is invalid or too long
 */
export const sanitizePrompt = (prompt) => {
    if (typeof prompt !== 'string') {
        throw new Error('Prompt must be a string');
    }

    // Trim whitespace
    let sanitized = prompt.trim();

    // Check length
    if (sanitized.length === 0) {
        throw new Error('Prompt cannot be empty');
    }

    if (sanitized.length > MAX_PROMPT_LENGTH) {
        throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    }

    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Remove control characters (except newlines, tabs, carriage returns)
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
};

/**
 * Validates an Ethereum address with checksum verification.
 * 
 * @param {string} address - The Ethereum address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateEthAddress = (address) => {
    if (typeof address !== 'string') {
        return false;
    }

    // Basic format check using ethers
    if (!isAddress(address)) {
        return false;
    }

    // Additional validation: must start with 0x and be 42 characters
    if (!address.startsWith('0x') || address.length !== 42) {
        return false;
    }

    return true;
};

/**
 * Validates image generation parameters.
 * 
 * @param {Object} params - The parameters object
 * @returns {Object} The validated and sanitized parameters
 * @throws {Error} If parameters are invalid
 */
export const validateImageParams = (params) => {
    if (!params || typeof params !== 'object') {
        throw new Error('Parameters must be an object');
    }

    const validated = { ...params };

    // Sanitize prompts
    if (validated.prompt) {
        validated.prompt = sanitizePrompt(validated.prompt);
    }

    if (validated.negative_prompt) {
        validated.negative_prompt = sanitizePrompt(validated.negative_prompt);
    }

    // Validate numeric ranges
    if (validated.width !== undefined) {
        const width = Number(validated.width);
        if (!Number.isInteger(width) || width < 128 || width > 2048) {
            throw new Error('Width must be an integer between 128 and 2048');
        }
        validated.width = width;
    }

    if (validated.height !== undefined) {
        const height = Number(validated.height);
        if (!Number.isInteger(height) || height < 128 || height > 2048) {
            throw new Error('Height must be an integer between 128 and 2048');
        }
        validated.height = height;
    }

    if (validated.steps !== undefined) {
        const steps = Number(validated.steps);
        if (!Number.isInteger(steps) || steps < 1 || steps > 150) {
            throw new Error('Steps must be an integer between 1 and 150');
        }
        validated.steps = steps;
    }

    if (validated.seed !== undefined && validated.seed !== null) {
        const seed = Number(validated.seed);
        if (!Number.isInteger(seed) || seed < 0) {
            throw new Error('Seed must be a non-negative integer');
        }
        validated.seed = seed;
    }

    // Validate format enum
    if (validated.format !== undefined) {
        const validFormats = ['png', 'jpeg', 'webp'];
        if (!validFormats.includes(validated.format.toLowerCase())) {
            throw new Error(`Format must be one of: ${validFormats.join(', ')}`);
        }
        validated.format = validated.format.toLowerCase();
    }

    // Validate style_preset
    if (validated.style_preset !== undefined && typeof validated.style_preset !== 'string') {
        throw new Error('Style preset must be a string');
    }

    // Validate boolean fields
    if (validated.hide_watermark !== undefined && typeof validated.hide_watermark !== 'boolean') {
        throw new Error('hide_watermark must be a boolean');
    }

    if (validated.safe_mode !== undefined && typeof validated.safe_mode !== 'boolean') {
        throw new Error('safe_mode must be a boolean');
    }

    return validated;
};

/**
 * Masks sensitive data for logging purposes.
 * 
 * @param {string} sensitive - The sensitive string to mask
 * @param {number} visibleChars - Number of characters to show at start/end
 * @returns {string} The masked string
 */
export const maskSensitive = (sensitive, visibleChars = 4) => {
    if (!sensitive || typeof sensitive !== 'string') {
        return '[REDACTED]';
    }

    if (sensitive.length <= visibleChars * 2) {
        return '*'.repeat(sensitive.length);
    }

    const start = sensitive.substring(0, visibleChars);
    const end = sensitive.substring(sensitive.length - visibleChars);
    const masked = '*'.repeat(Math.max(8, sensitive.length - visibleChars * 2));

    return `${start}${masked}${end}`;
};
