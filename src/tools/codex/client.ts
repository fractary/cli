/**
 * CodexClient - Unified client wrapper for Codex SDK
 *
 * Following the pattern from the CLI Integration Guide:
 * https://github.com/fractary/codex/blob/main/docs/guides/cli-integration.md
 *
 * This wrapper encapsulates CacheManager, StorageManager, and TypeRegistry,
 * providing a clean interface for CLI commands.
 */

import {
  CacheManager,
  StorageManager,
  TypeRegistry,
  loadConfig,
  validateUri,
  parseReference,
  resolveReference,
  createCacheManager,
  createStorageManager,
  createDefaultRegistry,
  isCacheEntryValid,
  type CodexConfig,
  type CacheStats,
  type FetchResult as SDKFetchResult,
  type ParsedReference,
  type ResolvedReference,
  type FetchOptions as SDKFetchOptions,
  CodexError,
  ConfigurationError,
  ValidationError
} from '@fractary/codex';

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
export class CodexClient {
  private cache: CacheManager;
  private storage: StorageManager;
  private types: TypeRegistry;
  private config: CodexConfig;

  /**
   * Private constructor - use CodexClient.create() instead
   */
  private constructor(
    cache: CacheManager,
    storage: StorageManager,
    types: TypeRegistry,
    config: CodexConfig
  ) {
    this.cache = cache;
    this.storage = storage;
    this.types = types;
    this.config = config;
  }

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
  static async create(options?: CodexClientOptions): Promise<CodexClient> {
    try {
      // Load configuration (v2.x format for now, will be v3.0 YAML after migration)
      const config = loadConfig({
        organizationSlug: options?.organizationSlug
      });

      // Initialize storage manager
      // For now, use GitHub as primary storage provider
      const storage = createStorageManager({
        github: {
          token: process.env.GITHUB_TOKEN,
          apiBaseUrl: 'https://api.github.com'
        }
      });

      // Initialize cache manager
      const cache = new CacheManager({
        cacheDir: options?.cacheDir || '.codex-cache',
        defaultTtl: 86400, // 24 hours
        maxMemoryEntries: 100,
        maxMemorySize: 50 * 1024 * 1024, // 50MB
        enablePersistence: true
      });

      // Connect storage to cache
      cache.setStorageManager(storage);

      // Initialize type registry
      const types = createDefaultRegistry();

      return new CodexClient(cache, storage, types, config);
    } catch (error) {
      if (error instanceof CodexError) {
        throw error;
      }
      throw new CodexError(
        `Failed to initialize CodexClient: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
  async fetch(uri: string, options?: FetchOptions): Promise<FetchResult> {
    // Validate URI early
    if (!validateUri(uri)) {
      throw new CodexError(`Invalid codex URI: ${uri}`);
    }

    // Resolve URI to reference (with cache path)
    const resolved = resolveReference(uri);
    if (!resolved) {
      throw new CodexError(`Failed to resolve URI: ${uri}`);
    }

    try {
      // If bypassing cache, fetch directly from storage
      if (options?.bypassCache) {
        const result = await this.storage.fetch(resolved);
        return {
          content: result.content,
          fromCache: false,
          metadata: {
            fetchedAt: new Date().toISOString(),
            contentLength: result.size
          }
        };
      }

      // Use CacheManager.get() which handles cache-first fetch
      const result = await this.cache.get(resolved, {
        ttl: options?.ttl
      });

      return {
        content: result.content,
        fromCache: true, // CacheManager.get handles cache logic
        metadata: {
          contentLength: result.size
        }
      };
    } catch (error) {
      throw new CodexError(
        `Failed to fetch ${uri}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

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
  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      await this.cache.invalidate(pattern);
    } else {
      await this.cache.clear();
    }
  }

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
  async getCacheStats(): Promise<CacheStats> {
    return this.cache.getStats();
  }

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
  getTypeRegistry(): TypeRegistry {
    return this.types;
  }

  /**
   * Get the cache manager (for advanced operations)
   *
   * @returns CacheManager instance
   */
  getCacheManager(): CacheManager {
    return this.cache;
  }

  /**
   * Get the storage manager (for advanced operations)
   *
   * @returns StorageManager instance
   */
  getStorageManager(): StorageManager {
    return this.storage;
  }

  /**
   * Get the loaded configuration
   *
   * @returns CodexConfig object
   */
  getConfig(): CodexConfig {
    return this.config;
  }
}

// Re-export SDK error classes for convenience
export {
  CodexError,
  ConfigurationError,
  ValidationError,
  PermissionDeniedError
} from '@fractary/codex';
