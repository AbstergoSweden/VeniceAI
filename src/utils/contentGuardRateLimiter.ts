/**
 * contentGuardRateLimiter.ts — Simple rate limiter for client-side protection
 * License: MIT
 * 
 * Implements a time-window based rate limiter to prevent abuse
 */

interface RateLimitEntry {
    timestamps: number[];
}

export class ContentGuardRateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private maxRequests: number;
    private windowMs: number;

    /**
     * Create a rate limiter
     * @param maxRequests - Maximum requests allowed in the time window
     * @param windowSeconds - Time window in seconds
     */
    constructor(maxRequests: number = 100, windowSeconds: number = 60) {
        this.maxRequests = maxRequests;
        this.windowMs = windowSeconds * 1000;
    }

    /**
     * Check if a request should be allowed
     * @param userId - User/session identifier
     * @returns true if allowed, false if rate limit exceeded
     */
    check(userId: string): boolean {
        const now = Date.now();
        const entry = this.requests.get(userId) || { timestamps: [] };

        // Remove timestamps outside the current window
        entry.timestamps = entry.timestamps.filter(ts => now - ts < this.windowMs);

        // Check if limit exceeded
        if (entry.timestamps.length >= this.maxRequests) {
            return false;
        }

        // Add current timestamp
        entry.timestamps.push(now);
        this.requests.set(userId, entry);

        return true;
    }

    /**
     * Get remaining requests for a user
     */
    remaining(userId: string): number {
        const now = Date.now();
        const entry = this.requests.get(userId);

        if (!entry) {
            return this.maxRequests;
        }

        const validTimestamps = entry.timestamps.filter(ts => now - ts < this.windowMs);
        return Math.max(0, this.maxRequests - validTimestamps.length);
    }

    /**
     * Reset rate limit for a user
     */
    reset(userId: string): void {
        this.requests.delete(userId);
    }

    /**
     * Clear all rate limit data
     */
    clear(): void {
        this.requests.clear();
    }
}
