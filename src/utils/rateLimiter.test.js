/**
 * Tests for rate limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimit, getRateLimitStatus, RateLimitError } from './rateLimiter';

describe('RateLimiter', () => {
    beforeEach(() => {
        // Reset all rate limits before each test
        resetRateLimit('https://api.venice.ai/api/v1/image/generate');
        resetRateLimit('https://api.venice.ai/api/v1/chat');
        resetRateLimit('https://api.venice.ai/api/v1/upscale');
        resetRateLimit('https://api.venice.ai/api/v1/other');
    });

    describe('checkRateLimit', () => {
        it('should allow requests within limit', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';
            const result = checkRateLimit(url);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeGreaterThanOrEqual(0);
        });

        it('should consume tokens on each request', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            const first = checkRateLimit(url);
            const second = checkRateLimit(url);

            expect(first.remaining).toBeGreaterThan(second.remaining);
        });

        it('should block requests when limit exceeded', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            // Exhaust all tokens (10 for image/generate endpoint)
            for (let i = 0; i < 10; i++) {
                checkRateLimit(url);
            }

            // Next request should be blocked
            const result = checkRateLimit(url);
            expect(result.allowed).toBe(false);
            expect(result.retryAfter).toBeGreaterThan(0);
            expect(result.remaining).toBe(0);
        });

        it('should provide retryAfter time when blocked', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            // Exhaust tokens
            for (let i = 0; i < 10; i++) {
                checkRateLimit(url);
            }

            const result = checkRateLimit(url);
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeGreaterThan(0);
        });

        it('should handle different endpoints independently', () => {
            const imageUrl = 'https://api.venice.ai/api/v1/image/generate';
            const chatUrl = 'https://api.venice.ai/api/v1/chat';

            checkRateLimit(imageUrl);
            checkRateLimit(imageUrl);

            const chatResult = checkRateLimit(chatUrl);

            // Chat endpoint should have full tokens despite image requests
            expect(chatResult.allowed).toBe(true);
            expect(chatResult.remaining).toBeGreaterThan(25); // Chat has 30 tokens
        });

        it('should refill tokens over time', async () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            // Mock timer
            vi.useFakeTimers();

            // Exhaust tokens
            for (let i = 0; i < 10; i++) {
                checkRateLimit(url);
            }

            // Should be blocked
            expect(checkRateLimit(url).allowed).toBe(false);

            // Advance time by 7 seconds (should refill ~1.17 tokens)
            vi.advanceTimersByTime(7000);

            // Should still be allowed (tokens refilled)
            const result = checkRateLimit(url);
            expect(result.allowed).toBe(true);

            vi.useRealTimers();
        });
    });

    describe('resetRateLimit', () => {
        it('should reset rate limit for endpoint', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            // Exhaust tokens
            for (let i = 0; i < 10; i++) {
                checkRateLimit(url);
            }

            // Should be blocked
            expect(checkRateLimit(url).allowed).toBe(false);

            // Reset
            resetRateLimit(url);

            // Should be allowed again
            expect(checkRateLimit(url).allowed).toBe(true);
        });
    });

    describe('getRateLimitStatus', () => {
        it('should return current status', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            const status = getRateLimitStatus(url);

            expect(status.tokens).toBeDefined();
            expect(status.maxTokens).toBe(10); // Image generate has 10 max tokens
            expect(status.tokensPerInterval).toBe(10);
            expect(status.interval).toBe(60000); // 1 minute
        });

        it('should reflect consumed tokens', () => {
            const url = 'https://api.venice.ai/api/v1/image/generate';

            checkRateLimit(url);
            checkRateLimit(url);

            const status = getRateLimitStatus(url);
            expect(status.tokens).toBeLessThan(status.maxTokens);
        });

        it('should return default config for new endpoints', () => {
            const url = 'https://api.venice.ai/api/v1/unknown';

            const status = getRateLimitStatus(url);

            expect(status.maxTokens).toBe(20); // Default config
            expect(status.tokensPerInterval).toBe(20);
        });
    });

    describe('RateLimitError', () => {
        it('should create error with correct properties', () => {
            const error = new RateLimitError(30, 0);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('RateLimitError');
            expect(error.retryAfter).toBe(30);
            expect(error.remaining).toBe(0);
            expect(error.status).toBe(429);
            expect(error.message).toContain('30 seconds');
        });
    });

    describe('Endpoint classification', () => {
        it('should classify image/generate endpoint', () => {
            const status = getRateLimitStatus('https://api.venice.ai/api/v1/image/generate');
            expect(status.maxTokens).toBe(10);
        });

        it('should classify chat endpoint', () => {
            const status = getRateLimitStatus('https://api.venice.ai/api/v1/chat/completions');
            expect(status.maxTokens).toBe(30);
        });

        it('should classify upscale endpoint', () => {
            const status = getRateLimitStatus('https://api.venice.ai/api/v1/upscale');
            expect(status.maxTokens).toBe(5);
        });

        it('should use default for unknown endpoints', () => {
            const status = getRateLimitStatus('https://api.venice.ai/api/v1/unknown');
            expect(status.maxTokens).toBe(20);
        });
    });
});
