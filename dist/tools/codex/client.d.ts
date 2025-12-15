/**
 * CodexClient - Unified client wrapper for Codex SDK
 *
 * Following the pattern from the CLI Integration Guide:
 * https://github.com/fractary/codex/blob/main/docs/guides/cli-integration.md
 *
 * This wrapper encapsulates CacheManager, StorageManager, and TypeRegistry,
 * providing a clean interface for CLI commands.
 */
import { CacheManager, StorageManager, TypeRegistry, type CacheStats } from '@fractary/codex';
/**
 * Options for creating CodexClient
 */
export interface CodexClientOptions {
    cacheDir?: string;
    organizationSlug?: string;
}
/**
 * Options for fetch operations
 */
export interface FetchOptions {
    bypassCache?: boolean;
    ttl?: number;
}
/**
 * Result from fetch operation
 */
export interface FetchResult {
    content: Buffer;
    fromCache: boolean;
    metadata?: {
        fetchedAt?: string;
        expiresAt?: string;
        contentLength?: number;
    };
}
/**
 * Unified Codex client
 *
 * Provides high-level operations for:
 * - Document fetching with integrated caching
 * - Cache management and invalidation
 * - Type registry access
 */
export declare class CodexClient {
    private cache;
    private storage;
    private types;
    private organization;
    /**
     * Private constructor - use CodexClient.create() instead
     */
    private constructor();
    /**
     * Create a new CodexClient instance
     *
     * @param options - Optional configuration
     * @returns Promise resolving to CodexClient instance
     *
     * @example
     * ```typescript
     * const client = await CodexClient.create();
     * ```
     */
    static create(options?: CodexClientOptions): Promise<CodexClient>;
    /**
     * Fetch a document by codex:// URI
     *
     * This method:
     * 1. Validates the URI format
     * 2. Resolves the URI to a reference
     * 3. Uses CacheManager.get() which handles cache-first fetch
     *
     * @param uri - Codex URI (e.g., codex://org/project/path/to/file.md)
     * @param options - Fetch options
     * @returns Promise resolving to fetch result
     *
     * @throws {CodexError} If URI format is invalid or fetch fails
     *
     * @example
     * ```typescript
     * const result = await client.fetch('codex://fractary/codex/docs/README.md');
     * console.log(result.content.toString());
     * ```
     */
    fetch(uri: string, options?: FetchOptions): Promise<FetchResult>;
    /**
     * Invalidate cache entries
     *
     * @param pattern - Optional glob pattern to match entries
     *                  If not provided, clears all entries
     *
     * @example
     * ```typescript
     * // Clear all cache
     * await client.invalidateCache();
     *
     * // Clear specific URI
     * await client.invalidateCache('codex://fractary/codex/docs/README.md');
     * ```
     */
    invalidateCache(pattern?: string): Promise<void>;
    /**
     * Get cache statistics
     *
     * @returns Promise resolving to cache stats
     *
     * @example
     * ```typescript
     * const stats = await client.getCacheStats();
     * console.log(`Cache entries: ${stats.totalEntries}`);
     * console.log(`Total size: ${stats.totalSize}`);
     * ```
     */
    getCacheStats(): Promise<CacheStats>;
    /**
     * Get the type registry
     *
     * Provides access to built-in and custom artifact types
     *
     * @returns TypeRegistry instance
     *
     * @example
     * ```typescript
     * const registry = client.getTypeRegistry();
     * const types = registry.list();
     * ```
     */
    getTypeRegistry(): TypeRegistry;
    /**
     * Get the cache manager (for advanced operations)
     *
     * @returns CacheManager instance
     */
    getCacheManager(): CacheManager;
    /**
     * Get the storage manager (for advanced operations)
     *
     * @returns StorageManager instance
     */
    getStorageManager(): StorageManager;
    /**
     * Get the organization slug
     *
     * @returns Organization slug string
     */
    getOrganization(): string;
}
export { CodexError, ConfigurationError, ValidationError, PermissionDeniedError } from '@fractary/codex';
//# sourceMappingURL=client.d.ts.map