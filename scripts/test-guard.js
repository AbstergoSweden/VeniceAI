#!/usr/bin/env node
/**
 * test-guard.js — Quick manual test of content guard
 */

import { assess } from '../src/utils/contentGuard.ts';

console.log('🧪 Testing Content Guard\n');

const testCases = [
    { prompt: '25 year old woman', expected: true },
    { prompt: '17 year old', expected: false },
    { prompt: 'loli character', expected: false },
    { prompt: 'high school girl', expected: false },
    { prompt: 'teen romance', expected: false },
    { prompt: 'boobiies', expected: true },
    { prompt: 'mature adult content', expected: true },
    { prompt: 'l0li anime', expected: false },
];

let passed = 0;
let failed = 0;

for (const { prompt, expected } of testCases) {
    const decision = assess(prompt);
    const success = decision.allow === expected;

    if (success) {
        passed++;
        console.log(`✅ "${prompt}"`);
        console.log(`   → ${decision.action}: ${decision.reason}\n`);
    } else {
        failed++;
        console.log(`❌ "${prompt}"`);
        console.log(`   → Expected: ${expected ? 'ALLOW' : 'BLOCK'}, Got: ${decision.action}`);
        console.log(`   → Reason: ${decision.reason}\n`);
    }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
