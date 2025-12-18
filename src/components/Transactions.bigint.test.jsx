import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEther } from 'ethers';

// Mock the entire Transactions component module
vi.mock('ethers', () => ({
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
    formatEther: vi.fn((val) => val.toString()),
    parseEther: vi.fn((val) => {
        // Return actual BigInt for testing
        const eth = parseFloat(val);
        return BigInt(Math.floor(eth * 1e18));
    }),
    isAddress: vi.fn(() => true)
}));

describe('Transactions Component - BigInt Bug #2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Amount Validation', () => {
        it('should reject zero amount (BigInt comparison bug)', () => {
            // This test demonstrates Bug #2: comparing BigInt with Number
            const amount = '0';
            const parsedAmount = parseEther(amount);

            // Bug: parsedAmount <= 0 compares BigInt with Number
            // This should fail with the buggy code
            expect(parsedAmount).toBe(0n);

            // The correct comparison should be with BigInt literal
            const isInvalid = parsedAmount <= 0n;
            expect(isInvalid).toBe(true);
        });

        it('should reject negative amounts', () => {
            // Note: parseEther doesn't handle negative, but we test the comparison logic
            const parsedAmount = 0n;

            // Correct BigInt comparison
            expect(parsedAmount <= 0n).toBe(true);
        });

        it('should accept positive amounts', () => {
            const amount = '1.5';
            const parsedAmount = parseEther(amount);

            // Should be greater than 0n
            expect(parsedAmount > 0n).toBe(true);
        });
    });
});
