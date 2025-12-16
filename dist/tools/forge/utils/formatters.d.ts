/**
 * Output Formatting Utilities
 *
 * Consistent formatting for Forge CLI output including tables,
 * success/error messages, and component information display.
 */
import type { InstallResult } from '@fractary/forge';
/**
 * Format installation result
 */
export declare function formatInstallResult(result: InstallResult, options?: {
    verbose?: boolean;
}): void;
/**
 * Format component list as table
 */
export declare function formatComponentTable(components: Array<{
    name: string;
    type: string;
    version?: string;
    source: string;
    path?: string;
}>, options?: {
    showPath?: boolean;
}): void;
/**
 * Format component info (detailed view)
 */
export declare function formatComponentInfo(info: {
    name: string;
    type: string;
    version?: string;
    source: string;
    path?: string;
    url?: string;
    description?: string;
    dependencies?: string[];
    availableVersions?: string[];
}): void;
/**
 * Format error with contextual help
 */
export declare function formatError(error: Error, context: string, hints?: string[]): void;
/**
 * Format success message
 */
export declare function formatSuccess(message: string): void;
/**
 * Format warning message
 */
export declare function formatWarning(message: string): void;
/**
 * Format info message
 */
export declare function formatInfo(message: string): void;
/**
 * Format bytes to human-readable size
 */
export declare function formatBytes(bytes: number): string;
/**
 * Format search results table
 */
export declare function formatSearchResults(results: Array<{
    name: string;
    type: string;
    version: string;
    description: string;
    author?: string;
    downloads?: number;
}>, pagination: {
    total: number;
    page: number;
    limit: number;
}): void;
/**
 * Format cache statistics
 */
export declare function formatCacheStats(stats: {
    totalEntries: number;
    freshEntries: number;
    staleEntries: number;
    totalSize: number;
    oldestEntry?: number;
    newestEntry?: number;
}): void;
/**
 * Create a progress message (for use with ora)
 */
export declare function createProgressMessage(action: string, target: string): string;
//# sourceMappingURL=formatters.d.ts.map