/**
 * contentGuardMetrics.ts — Metrics collection for content guard decisions
 * License: MIT
 * 
 * Tracks content guard decision statistics including blocks, allows,
 * block reasons, and severity distributions.
 */

export interface MetricsSummary {
    total: number;
    blocks: number;
    allows: number;
    blockRate: number;
    topReasons: Record<string, number>;
    severity: Record<string, number>;
}

export class ContentGuardMetrics {
    private totalRequests: number = 0;
    private blocks: number = 0;
    private allows: number = 0;
    private blockReasons: Map<string, number> = new Map();
    private severityCounts: Map<string, number> = new Map();

    /**
     * Record a decision
     */
    record(decision: { allow: boolean; reason: string; signals: { severity?: string } }): void {
        this.totalRequests++;

        if (decision.allow) {
            this.allows++;
        } else {
            this.blocks++;

            // Track block reason
            const currentCount = this.blockReasons.get(decision.reason) || 0;
            this.blockReasons.set(decision.reason, currentCount + 1);

            // Track severity
            const severity = decision.signals.severity || 'UNKNOWN';
            const currentSeverity = this.severityCounts.get(severity) || 0;
            this.severityCounts.set(severity, currentSeverity + 1);
        }
    }

    /**
     * Get metrics summary
     */
    summary(): MetricsSummary {
        // Get top 5 block reasons
        const topReasons: Record<string, number> = {};
        const sortedReasons = Array.from(this.blockReasons.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [reason, count] of sortedReasons) {
            topReasons[reason] = count;
        }

        // Convert severity map to object
        const severity: Record<string, number> = {};
        for (const [level, count] of this.severityCounts.entries()) {
            severity[level] = count;
        }

        return {
            total: this.totalRequests,
            blocks: this.blocks,
            allows: this.allows,
            blockRate: this.totalRequests > 0 ? this.blocks / this.totalRequests : 0,
            topReasons,
            severity,
        };
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.totalRequests = 0;
        this.blocks = 0;
        this.allows = 0;
        this.blockReasons.clear();
        this.severityCounts.clear();
    }

    /**
     * Export metrics as JSON
     */
    toJSON(): string {
        return JSON.stringify(this.summary(), null, 2);
    }
}
