/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import { sanitizePrompt, validateEthAddress, validateImageParams, maskSensitive } from './validation';

describe('sanitizePrompt', () => {
    it('should allow valid prompts', () => {
        const prompt = 'A beautiful sunset over mountains';
        expect(sanitizePrompt(prompt)).toBe(prompt);
    });

    it('should trim whitespace', () => {
        const prompt = '  test prompt  ';
        expect(sanitizePrompt(prompt)).toBe('test prompt');
    });

    it('should remove script tags', () => {
        const prompt = 'test <script>alert("xss")</script> prompt';
        const result = sanitizePrompt(prompt);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
    });

    it('should remove iframe tags', () => {
        const prompt = 'test <iframe src="evil.com"></iframe> prompt';
        const result = sanitizePrompt(prompt);
        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('</iframe>');
    });

    it('should remove javascript: protocol', () => {
        const prompt = 'test javascript:alert(1) prompt';
        const result = sanitizePrompt(prompt);
        expect(result).not.toMatch(/javascript:/i);
    });

    it('should remove event handlers', () => {
        const prompt = 'test onclick=alert(1) onload=evil() prompt';
        const result = sanitizePrompt(prompt);
        expect(result).not.toMatch(/on\w+\s*=/);
    });

    it('should normalize excessive whitespace', () => {
        const prompt = 'test    multiple     spaces';
        expect(sanitizePrompt(prompt)).toBe('test multiple spaces');
    });

    it('should throw error for empty prompt', () => {
        expect(() => sanitizePrompt('')).toThrow('Prompt cannot be empty');
        expect(() => sanitizePrompt('   ')).toThrow('Prompt cannot be empty');
    });

    it('should throw error for non-string input', () => {
        expect(() => sanitizePrompt(null)).toThrow('Prompt must be a string');
        expect(() => sanitizePrompt(undefined)).toThrow('Prompt must be a string');
        expect(() => sanitizePrompt(123)).toThrow('Prompt must be a string');
    });

    it('should throw error for prompts exceeding max length', () => {
        const longPrompt = 'a'.repeat(10001);
        expect(() => sanitizePrompt(longPrompt)).toThrow('exceeds maximum length');
    });

    it('should allow prompts at max length boundary', () => {
        const maxPrompt = 'a'.repeat(10000);
        expect(() => sanitizePrompt(maxPrompt)).not.toThrow();
    });
});

describe('validateEthAddress', () => {
    it('should validate correct Ethereum addresses', () => {
        expect(validateEthAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
        expect(validateEthAddress('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359')).toBe(true);
    });

    it('should reject invalid addresses', () => {
        expect(validateEthAddress('not-an-address')).toBe(false);
        expect(validateEthAddress('0x123')).toBe(false);
        expect(validateEthAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false); // Missing 0x
    });

    it('should reject null/undefined', () => {
        expect(validateEthAddress(null)).toBe(false);
        expect(validateEthAddress(undefined)).toBe(false);
    });

    it('should reject non-string inputs', () => {
        expect(validateEthAddress(123)).toBe(false);
        expect(validateEthAddress({})).toBe(false);
    });

    it('should validate address length', () => {
        expect(validateEthAddress('0x' + 'a'.repeat(40))).toBe(true);
        expect(validateEthAddress('0x' + 'a'.repeat(39))).toBe(false);
        expect(validateEthAddress('0x' + 'a'.repeat(41))).toBe(false);
    });
});

describe('validateImageParams', () => {
    it('should validate and sanitize valid parameters', () => {
        const params = {
            prompt: 'test prompt',
            negative_prompt: 'bad things',
            width: 512,
            height: 512,
            steps: 30
        };
        const result = validateImageParams(params);
        expect(result.prompt).toBe('test prompt');
        expect(result.width).toBe(512);
    });

    it('should sanitize prompts in parameters', () => {
        const params = {
            prompt: 'test <script>alert(1)</script> prompt'
        };
        const result = validateImageParams(params);
        expect(result.prompt).not.toContain('<script>');
    });

    it('should validate width range', () => {
        expect(() => validateImageParams({ width: 127 })).toThrow('Width must be an integer between 128 and 2048');
        expect(() => validateImageParams({ width: 2049 })).toThrow('Width must be an integer between 128 and 2048');
        expect(() => validateImageParams({ width: 512 })).not.toThrow();
    });

    it('should validate height range', () => {
        expect(() => validateImageParams({ height: 127 })).toThrow('Height must be an integer between 128 and 2048');
        expect(() => validateImageParams({ height: 2049 })).toThrow('Height must be an integer between 128 and 2048');
        expect(() => validateImageParams({ height: 1024 })).not.toThrow();
    });

    it('should validate steps range', () => {
        expect(() => validateImageParams({ steps: 0 })).toThrow('Steps must be an integer between 1 and 150');
        expect(() => validateImageParams({ steps: 151 })).toThrow('Steps must be an integer between 1 and 150');
        expect(() => validateImageParams({ steps: 50 })).not.toThrow();
    });

    it('should validate seed as non-negative integer', () => {
        expect(() => validateImageParams({ seed: -1 })).toThrow('Seed must be a non-negative integer');
        expect(() => validateImageParams({ seed: 0 })).not.toThrow();
        expect(() => validateImageParams({ seed: 12345 })).not.toThrow();
    });

    it('should validate format enum', () => {
        expect(() => validateImageParams({ format: 'png' })).not.toThrow();
        expect(() => validateImageParams({ format: 'jpeg' })).not.toThrow();
        expect(() => validateImageParams({ format: 'webp' })).not.toThrow();
        expect(() => validateImageParams({ format: 'invalid' })).toThrow('Format must be one of');
    });

    it('should convert format to lowercase', () => {
        const result = validateImageParams({ format: 'PNG' });
        expect(result.format).toBe('png');
    });

    it('should validate boolean fields', () => {
        expect(() => validateImageParams({ hide_watermark: true })).not.toThrow();
        expect(() => validateImageParams({ safe_mode: false })).not.toThrow();
        expect(() => validateImageParams({ hide_watermark: 'yes' })).toThrow('hide_watermark must be a boolean');
    });

    it('should throw error for non-object input', () => {
        expect(() => validateImageParams(null)).toThrow('Parameters must be an object');
        expect(() => validateImageParams('string')).toThrow('Parameters must be an object');
    });
});

describe('maskSensitive', () => {
    it('should mask sensitive strings', () => {
        const result = maskSensitive('sk-1234567890abcdef');
        expect(result).toMatch(/^sk-1\*+cdef$/);
        expect(result).not.toContain('234567890abc');
    });

    it('should handle short strings', () => {
        const result = maskSensitive('abc');
        expect(result).toBe('***');
    });

    it('should use default visible chars', () => {
        const result = maskSensitive('0123456789', 4);
        expect(result).toMatch(/^0123\*+6789$/);
    });

    it('should handle custom visible chars', () => {
        const result = maskSensitive('abcdefghij', 2);
        expect(result).toMatch(/^ab\*+ij$/);
    });

    it('should handle null/undefined', () => {
        expect(maskSensitive(null)).toBe('[REDACTED]');
        expect(maskSensitive(undefined)).toBe('[REDACTED]');
        expect(maskSensitive('')).toBe('[REDACTED]');
    });

    it('should handle non-string inputs', () => {
        expect(maskSensitive(123)).toBe('[REDACTED]');
    });
});
