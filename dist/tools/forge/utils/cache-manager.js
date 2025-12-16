"use strict";
/**
 * Cache Manager Utility
 *
 * Manages registry manifest cache: reading, writing, clearing, and statistics.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheDirectory = getCacheDirectory;
exports.getManifestsDirectory = getManifestsDirectory;
exports.getMetadataPath = getMetadataPath;
exports.loadCacheMetadata = loadCacheMetadata;
exports.saveCacheMetadata = saveCacheMetadata;
exports.getCacheStats = getCacheStats;
exports.calculateCacheSize = calculateCacheSize;
exports.isEntryExpired = isEntryExpired;
exports.clearCache = clearCache;
exports.updateCacheEntry = updateCacheEntry;
exports.recordCacheHit = recordCacheHit;
exports.recordCacheMiss = recordCacheMiss;
exports.getCacheInfo = getCacheInfo;
exports.getAllCacheEntries = getAllCacheEntries;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
/**
 * Get cache directory path
 */
function getCacheDirectory() {
    const home = os_1.default.homedir();
    return path_1.default.join(home, '.fractary', 'registry', 'cache');
}
/**
 * Get manifests directory
 */
function getManifestsDirectory() {
    return path_1.default.join(getCacheDirectory(), 'manifests');
}
/**
 * Get metadata file path
 */
function getMetadataPath() {
    return path_1.default.join(getCacheDirectory(), 'metadata.json');
}
/**
 * Load cache metadata
 */
async function loadCacheMetadata() {
    const metadataPath = getMetadataPath();
    try {
        const content = await fs_1.promises.readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        // Return empty metadata if not found
        return {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            total_size_bytes: 0,
            entries: {},
            statistics: {
                total_cache_hits: 0,
                total_cache_misses: 0,
                hit_ratio: 0,
                avg_entry_age_seconds: 0,
            },
        };
    }
}
/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata) {
    const metadataPath = getMetadataPath();
    const cacheDir = getCacheDirectory();
    // Ensure cache directory exists
    await fs_1.promises.mkdir(cacheDir, { recursive: true });
    metadata.last_updated = new Date().toISOString();
    const content = JSON.stringify(metadata, null, 2);
    await fs_1.promises.writeFile(metadataPath, content, 'utf-8');
}
/**
 * Get cache statistics
 */
async function getCacheStats() {
    const metadata = await loadCacheMetadata();
    const entryCount = Object.keys(metadata.entries).length;
    return {
        ...metadata.statistics,
        size_bytes: metadata.total_size_bytes,
        entry_count: entryCount,
    };
}
/**
 * Calculate total cache size
 */
async function calculateCacheSize() {
    const manifestsDir = getManifestsDirectory();
    try {
        const files = await fs_1.promises.readdir(manifestsDir);
        let totalSize = 0;
        for (const file of files) {
            try {
                const filePath = path_1.default.join(manifestsDir, file);
                const stat = await fs_1.promises.stat(filePath);
                if (stat.isFile()) {
                    totalSize += stat.size;
                }
            }
            catch (error) {
                // Skip files that can't be accessed
            }
        }
        return totalSize;
    }
    catch (error) {
        return 0;
    }
}
/**
 * Check if cache entry is expired
 */
function isEntryExpired(entry) {
    const expiresAt = new Date(entry.expires_at);
    return expiresAt < new Date();
}
/**
 * Clear cache
 */
async function clearCache(options = {}) {
    const metadata = await loadCacheMetadata();
    const now = new Date();
    const cleared = [];
    // Determine which entries to clear
    for (const [registryName, entry] of Object.entries(metadata.entries)) {
        let shouldClear = false;
        // Check pattern match
        if (options.pattern) {
            const regex = new RegExp(options.pattern, 'i');
            shouldClear = regex.test(registryName);
        }
        else {
            // If no pattern, check age and expiration
            if (options.olderThan !== undefined) {
                const cacheTime = new Date(entry.cached_at);
                const ageSeconds = (now.getTime() - cacheTime.getTime()) / 1000;
                shouldClear = ageSeconds > options.olderThan;
            }
            else if (!options.pattern) {
                // Clear all if no specific pattern or age
                shouldClear = true;
            }
        }
        if (shouldClear) {
            cleared.push(registryName);
            if (!options.dryRun) {
                // Remove from metadata
                delete metadata.entries[registryName];
                // Try to remove cache file
                try {
                    const filePath = path_1.default.join(getManifestsDirectory(), entry.file);
                    await fs_1.promises.unlink(filePath);
                }
                catch (error) {
                    // Ignore if file doesn't exist
                }
            }
        }
    }
    // Update metadata if not a dry run
    if (!options.dryRun && cleared.length > 0) {
        // Recalculate size
        metadata.total_size_bytes = await calculateCacheSize();
        // Update statistics
        metadata.statistics = calculateStatistics(metadata);
        await saveCacheMetadata(metadata);
    }
    return {
        cleared: cleared.length,
        entries: cleared,
    };
}
/**
 * Update cache entry
 */
async function updateCacheEntry(registryName, options) {
    const metadata = await loadCacheMetadata();
    const now = new Date();
    let sizeBytes = options.size_bytes || 0;
    // Calculate size if not provided
    if (sizeBytes === 0) {
        try {
            const filePath = path_1.default.join(getManifestsDirectory(), options.file);
            const stat = await fs_1.promises.stat(filePath);
            sizeBytes = stat.size;
        }
        catch (error) {
            sizeBytes = 0;
        }
    }
    // Create or update entry
    const entry = {
        file: options.file,
        size_bytes: sizeBytes,
        cached_at: now.toISOString(),
        expires_at: new Date(now.getTime() + options.ttl * 1000).toISOString(),
        hits: 0,
        misses: 0,
        ttl: options.ttl,
    };
    // Preserve hit/miss stats if updating existing entry
    if (metadata.entries[registryName]) {
        entry.hits = metadata.entries[registryName].hits;
        entry.misses = metadata.entries[registryName].misses;
    }
    metadata.entries[registryName] = entry;
    // Update total size and statistics
    metadata.total_size_bytes = await calculateCacheSize();
    metadata.statistics = calculateStatistics(metadata);
    await saveCacheMetadata(metadata);
}
/**
 * Record cache hit
 */
async function recordCacheHit(registryName) {
    const metadata = await loadCacheMetadata();
    if (metadata.entries[registryName]) {
        metadata.entries[registryName].hits++;
        metadata.statistics = calculateStatistics(metadata);
        await saveCacheMetadata(metadata);
    }
}
/**
 * Record cache miss
 */
async function recordCacheMiss(registryName) {
    const metadata = await loadCacheMetadata();
    if (metadata.entries[registryName]) {
        metadata.entries[registryName].misses++;
        metadata.statistics = calculateStatistics(metadata);
        await saveCacheMetadata(metadata);
    }
}
/**
 * Calculate statistics from metadata
 */
function calculateStatistics(metadata) {
    let totalHits = 0;
    let totalMisses = 0;
    let totalAge = 0;
    let entryCount = 0;
    const now = new Date();
    for (const entry of Object.values(metadata.entries)) {
        totalHits += entry.hits;
        totalMisses += entry.misses;
        const cacheTime = new Date(entry.cached_at);
        const ageSeconds = (now.getTime() - cacheTime.getTime()) / 1000;
        totalAge += ageSeconds;
        entryCount++;
    }
    const totalRequests = totalHits + totalMisses;
    const hitRatio = totalRequests > 0 ? totalHits / totalRequests : 0;
    const avgAge = entryCount > 0 ? totalAge / entryCount : 0;
    return {
        total_cache_hits: totalHits,
        total_cache_misses: totalMisses,
        hit_ratio: Number.isFinite(hitRatio) ? hitRatio : 0,
        avg_entry_age_seconds: Math.round(avgAge),
    };
}
/**
 * Get cache info for a specific registry
 */
async function getCacheInfo(registryName) {
    const metadata = await loadCacheMetadata();
    return metadata.entries[registryName] || null;
}
/**
 * Get all cache entries
 */
async function getAllCacheEntries() {
    const metadata = await loadCacheMetadata();
    return metadata.entries;
}
//# sourceMappingURL=cache-manager.js.map