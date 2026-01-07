/**
 * contentGuardConfig.ts — Configuration system for content guard
 * License: MIT
 * 
 * Centralized configuration with runtime overrides support
 */

export interface ContentGuardConfig {
    // Threshold values
    contextScoreThreshold: number;
    clusterMatchThreshold: number;
    hammingDistanceThreshold: number;
    soundexMinLength: number;
    jaccardThreshold: number;

    // Rate limiting
    rateLimitMaxRequests: number;
    rateLimitWindowSeconds: number;

    // Feature flags
    enableFuzzyMatching: boolean;
    enableClustering: boolean;
    enableCrossSentence: boolean;
    enableInjectionDetection: boolean;
}

// Default configuration
export const DEFAULT_CONFIG: ContentGuardConfig = {
    // Thresholds
    contextScoreThreshold: 10,
    clusterMatchThreshold: 2,
    hammingDistanceThreshold: 5,
    soundexMinLength: 4,
    jaccardThreshold: 0.75,

    // Rate limiting
    rateLimitMaxRequests: 100,
    rateLimitWindowSeconds: 60,

    // Feature flags
    enableFuzzyMatching: true,
    enableClustering: true,
    enableCrossSentence: true,
    enableInjectionDetection: true,
};

// Runtime configuration (can be updated)
let currentConfig: ContentGuardConfig = { ...DEFAULT_CONFIG };

/**
 * Get current configuration
 */
export function getConfig(): Readonly<ContentGuardConfig> {
    return { ...currentConfig };
}

/**
 * Update configuration (merge with existing)
 */
export function updateConfig(updates: Partial<ContentGuardConfig>): void {
    currentConfig = { ...currentConfig, ...updates };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
    currentConfig = { ...DEFAULT_CONFIG };
}

/**
 * Load configuration from JSON object
 */
export function loadConfig(jsonConfig: Partial<ContentGuardConfig>): void {
    updateConfig(jsonConfig);
}
