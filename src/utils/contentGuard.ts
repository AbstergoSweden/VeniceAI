/**
 * contentGuard.ts — Content safety guard for NSFW prompts (adult-only enforcement)
 * License: MIT
 * Purpose: HARD-BLOCK any prompt that references minors (explicitly or implicitly)
 * 
 * This module evaluates input text and blocks content that implies minors.
 * It does NOT generate sexual content, only validates prompts for safety.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Decision {
    allow: boolean;
    action: 'ALLOW' | 'BLOCK' | 'REWRITE';
    reason: string;
    normalizedPrompt: string;
    rewrittenPrompt: string | null;
    signals: Signals;
}

export interface Signals {
    hardTerms: string[];
    ambiguousYouth: string[];
    adultAssertions: string[];
    ages: number[];
    schoolContext: string[];
    normalized: string;
}

// ============================================================================
// Constants & Patterns
// ============================================================================

// Zero-width characters
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;

// Combining marks (accents)
const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;

// Whitespace normalization
const WHITESPACE_RE = /\s+/g;

// Leetspeak character mapping
const LEET_MAP: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    '$': 's',
};

// Homoglyph character mapping (lookalike characters)
const HOMOGLYPH_MAP: Record<string, string> = {
    '¡': 'i', 'Ｉ': 'i', 'і': 'i', 'Ⅰ': 'i',
    'ⓞ': 'o', '○': 'o', '◯': 'o', 'Ｏ': 'o', 'о': 'o',
    'ⓐ': 'a', 'а': 'a', 'Ａ': 'a',
    'ⓔ': 'e', 'ｅ': 'e', 'е': 'e',
    'ⓢ': 's', 'Ｓ': 's',
    'ⓣ': 't', 'Ｔ': 't',
    'ⓤ': 'u', 'Ｕ': 'u',
    'ⓡ': 'r', 'Ｒ': 'r',
    'ⓛ': 'l', 'Ｌ': 'l',
    'ⓑ': 'b', 'Ｂ': 'b',
    'ⓙ': 'j', 'Ｊ': 'j',
};

// Hard signals implying minors — absolutely block
const HARD_TERMS = [
    // slur/genre terms
    'loli', 'lolicon', 'shotacon', 'shota',
    // explicit words
    'child', 'children', 'kid', 'kids', 'minor', 'underage', 'under-aged',
    'preteen', 'preteens', 'tween',
    // roles
    'schoolgirl', 'school boy', 'schoolboy', 'school girl',
    'middle school', 'elementary', 'kindergarten', 'grade school',
    'babysitter', 'babysit', 'babysitting',
    // faces
    'baby face', 'babyface', 'childlike', 'child-like',
];

// Soft-but-dangerous descriptors — blocked regardless (strict policy)
const AMBIGUOUS_YOUTH = [
    'teen', 'teens', 'teenage', 'jailbait', 'young-looking', 'looks young',
    'youthful', 'nubile', 'barely legal', 'college freshman',
    'looks like a kid', 'girl next door', 'boyish', 'girlish', 'tiny girl',
    'innocent-looking', 'school uniform',
];

// Adult affirmations (for signal tracking, not whitelisting)
const ADULT_ASSERTIONS = [
    'adult', '18+', 'eighteen plus', 'over 18', 'over 21', '21+', 'twenty one',
    'grown woman', 'grown man', 'mature', 'of age',
];

// Age patterns: block < 18, allow >= 18
const AGE_PATTERNS = [
    /\b(\d{1,2})\s*(?:yo|y\/o|yrs? old|years? old)\b/gi,
    /\b(?:age)\s*[:=]\s*(\d{1,2})\b/gi,
    /\b(\d{1,2})\s*(?:-?\s*year\s*old)\b/gi,
];

// Grades and school years implying K-12 contexts
const SCHOOL_PATTERNS = [
    /\b(?:k|kinder(?:garten)?)\b/gi,
    /\b(?:1st|2nd|3rd|[4-9]th)\s*grade\b/gi,
    /\b(?:middle\s*school|junior\s*high|high\s*school)\b/gi,
    /\b(?:hs|jr\.?\s*high)\b/gi,
    /\b(?:elementary\s*schooler?)\b/gi,
];

// Adult term normalization (typo corrections)
const ADULT_NORMALIZATION: Record<string, string> = {
    'boobiies': 'boobies',
    'boobiiies': 'boobies',
    'boobiiees': 'boobies',
    'boobiess': 'boobies',
    'b00bies': 'boobies',
    't1tties': 'titties',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Fold homoglyph characters to their ASCII equivalents
 */
function foldHomoglyphs(s: string): string {
    return Array.from(s)
        .map(ch => HOMOGLYPH_MAP[ch] || ch)
        .join('');
}

/**
 * Convert leetspeak characters to normal letters
 */
function convertLeetspeak(s: string): string {
    return Array.from(s)
        .map(ch => LEET_MAP[ch] || ch)
        .join('');
}

/**
 * Normalize text for term matching: removes punctuation to create word boundaries
 */
function normalizeForMatching(s: string): string {
    // Remove all non-letter, non-number, non-space characters to create clean word boundaries
    return ` ${s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')} `;
}

/**
 * Normalize text: remove zero-width chars, normalize Unicode, fold homoglyphs,
 * convert leetspeak, remove combining marks, normalize whitespace
 */
export function normalizeText(s: string): string {
    let normalized = s.trim();

    // Replace Unicode line/paragraph separators
    normalized = normalized.replace(/\u2028/g, ' ').replace(/\u2029/g, ' ');

    // Remove zero-width characters
    normalized = normalized.replace(ZERO_WIDTH_RE, '');

    // Unicode normalization (NFKC)
    normalized = normalized.normalize('NFKC');

    // Fold homoglyphs
    normalized = foldHomoglyphs(normalized);

    // Convert leetspeak (before removing combining marks to handle accented leetspeak)
    normalized = convertLeetspeak(normalized);

    // Remove combining marks (accents)
    normalized = normalized.replace(COMBINING_MARKS_RE, '');

    // Normalize whitespace
    normalized = normalized.replace(WHITESPACE_RE, ' ');

    return normalized;
}

/**
 * Normalize adult content typos
 */
function normalizeAdultTypos(s: string): string {
    // Remove punctuation before tokenizing to handle cases like "boobiies!" or "big-boobiies"
    const tokens = s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);

    const normalized = tokens.map(token => {
        return ADULT_NORMALIZATION[token] || token;
    });
    return normalized.join(' ');
}

/**
 * Check if normalized text contains any of the given terms
 * Uses punctuation-aware boundary matching to prevent bypasses like "teen-girl" or "loli,"
 */
function hasTerms(text: string, terms: string[]): string[] {
    const hits: string[] = [];
    const normalizedText = normalizeForMatching(text);

    for (const term of terms) {
        const normalizedTerm = normalizeForMatching(term).trim();
        if (normalizedText.includes(` ${normalizedTerm} `)) {
            hits.push(term);
        }
    }

    return hits;
}

/**
 * Extract ages from text using age patterns
 * Filters to human-reasonable ages (0-120) to prevent garbage matches
 */
function findAges(text: string): number[] {
    const ages: number[] = [];

    for (const pattern of AGE_PATTERNS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const groups = match.slice(1).filter(g => g && /^\d{1,2}$/.test(g));
            for (const group of groups) {
                const age = parseInt(group, 10);
                // Only accept human-reasonable ages to prevent garbage/abuse
                if (!isNaN(age) && age >= 0 && age <= 120) {
                    ages.push(age);
                }
            }
        }
    }

    return ages;
}

/**
 * Detect K-12 school contexts
 */
function findSchoolContext(text: string): string[] {
    const hits: string[] = [];

    for (const pattern of SCHOOL_PATTERNS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            hits.push(match[0]);
        }
    }

    return hits;
}

// ============================================================================
// Main Assessment Function
// ============================================================================

/**
 * Assess a prompt for content safety
 * 
 * @param prompt - The text prompt to assess
 * @returns Decision object with allow/block action and detailed signals
 */
export function assess(prompt: string): Decision {
    const raw = prompt;
    let normalized = normalizeText(prompt);
    normalized = normalizeAdultTypos(normalized);

    // Collect signals
    const hardTerms = hasTerms(normalized, HARD_TERMS);
    const ambiguousYouth = hasTerms(normalized, AMBIGUOUS_YOUTH);
    const adultAssertions = hasTerms(normalized, ADULT_ASSERTIONS);
    const ages = findAges(normalized);
    const schoolContext = findSchoolContext(normalized);

    const signals: Signals = {
        hardTerms,
        ambiguousYouth,
        adultAssertions,
        ages,
        schoolContext,
        normalized,
    };

    // Decision logic

    // 1) Any explicit age < 18 -> BLOCK
    if (ages.some(age => age < 18)) {
        return {
            allow: false,
            action: 'BLOCK',
            reason: 'Explicit age under 18 detected',
            normalizedPrompt: normalized,
            rewrittenPrompt: null,
            signals,
        };
    }

    // 2) Any hard term -> BLOCK
    if (hardTerms.length > 0) {
        return {
            allow: false,
            action: 'BLOCK',
            reason: `Minor-implying term(s): ${hardTerms.join(', ')}`,
            normalizedPrompt: normalized,
            rewrittenPrompt: null,
            signals,
        };
    }

    // 3) K-12 contexts -> BLOCK
    if (schoolContext.length > 0) {
        return {
            allow: false,
            action: 'BLOCK',
            reason: 'K-12 school context implies minor',
            normalizedPrompt: normalized,
            rewrittenPrompt: null,
            signals,
        };
    }

    // 4) Ambiguous youth descriptors: BLOCK regardless (strict policy)
    if (ambiguousYouth.length > 0) {
        return {
            allow: false,
            action: 'BLOCK',
            reason: 'Ambiguous youth descriptor present',
            normalizedPrompt: normalized,
            rewrittenPrompt: null,
            signals,
        };
    }

    // 5) If we get here, allow. Optionally mark as rewritten if normalized.
    const rewritten = normalized !== raw ? normalized : null;

    return {
        allow: true,
        action: 'ALLOW',
        reason: 'No minor indicators detected',
        normalizedPrompt: normalized,
        rewrittenPrompt: rewritten,
        signals,
    };
}

/**
 * Assess a prompt and return JSON string (for CLI/API compatibility)
 */
export function assessJSON(prompt: string): string {
    const decision = assess(prompt);
    return JSON.stringify(decision, null, 0);
}
