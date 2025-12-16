/**
 * Cache Manager Utility
 *
 * Manages registry manifest cache: reading, writing, clearing, and statistics.
 */
/**
 * Cache entry metadata
 */
export interface CacheEntry {
    file: string;
    size_bytes: number;
    cached_at: string;
    expires_at: string;
    hits: number;
    misses: number;
    ttl: number;
}
/**
 * Cache statistics
 */
export interface CacheStatistics {
    total_cache_hits: number;
    total_cache_misses: number;
    hit_ratio: number;
    avg_entry_age_seconds: number;
}
/**
 * Cache metadata structure
 */
export interface CacheMetadata {
    version: string;
    created_at: string;
    last_updated: string;
    total_size_bytes: number;
    entries: Record<string, CacheEntry>;
    statistics: CacheStatistics;
}
/**
 * Cache clear options
 */
export interface ClearCacheOptions {
    olderThan?: number;
    pattern?: string;
    force?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
}
/**
 * Get cache directory path
 */
export declare function getCacheDirectory(): string;
/**
 * Get manifests directory
 */
export declare function getManifestsDirectory(): string;
/**
 * Get metadata file path
 */
export declare function getMetadataPath(): string;
/**
 * Load cache metadata
 */
export declare function loadCacheMetadata(): Promise<CacheMetadata>;
/**
 * Save cache metadata
 */
export declare function saveCacheMetadata(metadata: CacheMetadata): Promise<void>;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): Promise<CacheStatistics & {
    size_bytes: number;
    entry_count: number;
}>;
/**
 * Calculate total cache size
 */
export declare function calculateCacheSize(): Promise<number>;
/**
 * Check if cache entry is expired
 */
export declare function isEntryExpired(entry: CacheEntry): boolean;
/**
 * Clear cache
 */
export declare function clearCache(options?: ClearCacheOptions): Promise<{
    cleared: number;
    entries: string[];
}>;
/**
 * Update cache entry
 */
export declare function updateCacheEntry(registryName: string, options: {
    file: string;
    ttl: number;
    size_bytes?: number;
}): Promise<void>;
/**
 * Record cache hit
 */
export declare function recordCacheHit(registryName: string): Promise<void>;
/**
 * Record cache miss
 */
export declare function recordCacheMiss(registryName: string): Promise<void>;
/**
 * Get cache info for a specific registry
 */
export declare function getCacheInfo(registryName: string): Promise<CacheEntry | null>;
/**
 * Get all cache entries
 */
export declare function getAllCacheEntries(): Promise<Record<string, CacheEntry>>;
//# sourceMappingURL=cache-manager.d.ts.map