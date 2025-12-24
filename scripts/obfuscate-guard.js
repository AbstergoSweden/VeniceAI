#!/usr/bin/env node
/**
 * obfuscate-guard.js — Obfuscates the content guard module for production
 * 
 * This script applies aggressive obfuscation to the compiled contentGuard module
 * to prevent tampering and reverse engineering.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist', 'assets');

console.log('🔒 Obfuscating content guard module...');

try {
    // Find the contentGuard module in dist/assets
    const files = readdirSync(distDir);
    const guardFile = files.find(f => f.includes('contentGuard') && f.endsWith('.js'));

    if (!guardFile) {
        console.log('⚠️  Content guard module not found in build output. Skipping obfuscation.');
        process.exit(0);
    }

    const guardPath = join(distDir, guardFile);
    const sourceCode = readFileSync(guardPath, 'utf-8');

    console.log(`📄 Found: ${guardFile}`);

    // Obfuscation options - aggressive settings for maximum protection
    const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
        // String encoding
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.8,

        // Control flow
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,

        // Identifiers
        identifierNamesGenerator: 'hexadecimal',
        identifiersDictionary: [],
        identifiersPrefix: '',
        renameGlobals: false,
        renameProperties: false,
        reservedNames: [],
        reservedStrings: [],

        // Code transformation
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,

        // Self defending
        selfDefending: true,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: false,

        // Output
        compact: true,
        numbersToExpressions: true,
        seed: Math.floor(Math.random() * 100000),
        sourceMap: false,
        target: 'browser',
    });

    const obfuscatedCode = obfuscationResult.getObfuscatedCode();

    // Write obfuscated code back
    writeFileSync(guardPath, obfuscatedCode, 'utf-8');

    const originalSize = (sourceCode.length / 1024).toFixed(2);
    const obfuscatedSize = (obfuscatedCode.length / 1024).toFixed(2);

    console.log(`✅ Obfuscation complete!`);
    console.log(`   Original size:   ${originalSize} KB`);
    console.log(`   Obfuscated size: ${obfuscatedSize} KB`);
    console.log(`   Size increase:   ${((obfuscatedCode.length / sourceCode.length - 1) * 100).toFixed(1)}%`);

} catch (error) {
    console.error('❌ Obfuscation failed:', error.message);
    process.exit(1);
}
