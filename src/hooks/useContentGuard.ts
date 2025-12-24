/**
 * useContentGuard.ts — React hook for content safety guard integration
 * 
 * Provides a convenient hook interface for validating prompts in React components
 */

import { useState, useEffect } from 'react';
import { assess, Decision } from '../utils/contentGuard';

export interface UseContentGuardResult {
    decision: Decision | null;
    isValidating: boolean;
    validate: (prompt: string) => void;
    reset: () => void;
}

/**
 * React hook for content guard validation
 * 
 * @param autoValidate - Whether to auto-validate on prompt change (default: false)
 * @returns Object with decision, validation state, and control functions
 * 
 * @example
 * ```tsx
 * const { decision, isValidating, validate } = useContentGuard();
 * 
 * const handleSubmit = (prompt: string) => {
 *   validate(prompt);
 *   if (decision?.allow) {
 *     // Proceed with submission
 *   } else {
 *     // Show error message
 *   }
 * };
 * ```
 */
export function useContentGuard(autoValidate = false): UseContentGuardResult {
    const [decision, setDecision] = useState<Decision | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

    useEffect(() => {
        if (!autoValidate || !pendingPrompt) return;

        setIsValidating(true);

        // Use setTimeout to debounce and simulate async behavior
        const timeoutId = setTimeout(() => {
            const result = assess(pendingPrompt);
            setDecision(result);
            setIsValidating(false);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [pendingPrompt, autoValidate]);

    const validate = (prompt: string) => {
        if (autoValidate) {
            setPendingPrompt(prompt);
        } else {
            setIsValidating(true);
            const result = assess(prompt);
            setDecision(result);
            setIsValidating(false);
        }
    };

    const reset = () => {
        setDecision(null);
        setIsValidating(false);
        setPendingPrompt(null);
    };

    return {
        decision,
        isValidating,
        validate,
        reset,
    };
}
