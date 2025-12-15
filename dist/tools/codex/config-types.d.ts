/**
 * Configuration types for Codex v3.0 YAML format
 *
 * Based on the SDK's Configuration Guide:
 * https://github.com/fractary/codex/blob/main/docs/guides/configuration.md
 */
/**
 * Storage provider type
 */
export type StorageProviderType = 'local' | 'github' | 'http' | 's3';
/**
 * Local filesystem storage configuration
 */
export interface LocalStorageConfig {
    type: 'local';
    basePath: string;
    followSymlinks?: boolean;
    priority?: number;
}
/**
 * GitHub storage configuration
 */
export interface GitHubStorageConfig {
    type: 'github';
    token?: string;
    apiBaseUrl?: string;
    rawBaseUrl?: string;
    branch?: string;
    priority?: number;
}
/**
 * HTTP storage configuration
 */
export interface HttpStorageConfig {
    type: 'http';
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
    priority?: number;
}
/**
 * S3 storage configuration (future)
 */
export interface S3StorageConfig {
    type: 's3';
    bucket: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    priority?: number;
}
/**
 * Union type for all storage providers
 */
export type StorageProviderConfig = LocalStorageConfig | GitHubStorageConfig | HttpStorageConfig | S3StorageConfig;
/**
 * Cache configuration
 */
export interface CacheConfig {
    directory?: string;
    defaultTtl?: number;
    maxSize?: number;
    maxMemoryEntries?: number;
    maxMemorySize?: number;
    enablePersistence?: boolean;
}
/**
 * Custom artifact type definition
 */
export interface CustomTypeConfig {
    name: string;
    description?: string;
    patterns: string[];
    defaultTtl?: number;
    archiveAfterDays?: number | null;
    archiveStorage?: 'local' | 'cloud' | 'drive' | null;
}
/**
 * Types configuration
 */
export interface TypesConfig {
    custom?: Record<string, Omit<CustomTypeConfig, 'name'>>;
}
/**
 * Permission level
 */
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
/**
 * Permission rule
 */
export interface PermissionRule {
    pattern: string;
    permission: PermissionLevel;
    users?: string[];
}
/**
 * Permissions configuration
 */
export interface PermissionsConfig {
    default?: PermissionLevel;
    rules?: PermissionRule[];
}
/**
 * Sync configuration
 */
export interface SyncConfig {
    bidirectional?: boolean;
    conflictResolution?: 'prompt' | 'local' | 'remote' | 'newest' | 'skip';
    exclude?: string[];
    rules?: SyncRule[];
}
/**
 * Sync rule
 */
export interface SyncRule {
    pattern: string;
    direction?: 'to-codex' | 'from-codex' | 'bidirectional';
}
/**
 * MCP server configuration
 */
export interface McpConfig {
    enabled?: boolean;
    port?: number;
}
/**
 * Codex v3.0 YAML configuration
 *
 * This is the format that will be written to .fractary/codex.yaml
 */
export interface CodexYamlConfig {
    organization: string;
    cacheDir?: string;
    storage?: StorageProviderConfig[];
    types?: TypesConfig;
    permissions?: PermissionsConfig;
    sync?: SyncConfig;
    mcp?: McpConfig;
}
/**
 * Legacy JSON configuration (v2.x)
 *
 * This is the format currently used in .fractary/plugins/codex/config.json
 */
export interface LegacyCodexConfig {
    version?: string;
    organization?: string;
    organizationSlug?: string;
    cache?: {
        directory?: string;
        defaultTtl?: string | number;
        maxSize?: string | number;
        cleanupInterval?: string;
    };
    storage?: {
        providers?: Record<string, any>;
        defaultProvider?: string;
    };
    types?: {
        custom?: any[];
    };
    sync?: {
        environments?: Record<string, string>;
        defaultEnvironment?: string;
    };
    mcp?: {
        enabled?: boolean;
        port?: number;
    };
}
/**
 * Parse a duration string to seconds
 *
 * Supports formats like: "1h", "24h", "7d", "1w", "1M", "1y"
 */
export declare function parseDuration(duration: string | number): number;
/**
 * Parse a size string to bytes
 *
 * Supports formats like: "100MB", "1GB", "50MB"
 */
export declare function parseSize(size: string | number): number;
/**
 * Resolve environment variables in a string
 *
 * Supports ${VAR_NAME} syntax
 */
export declare function resolveEnvVars(value: string): string;
/**
 * Deep resolve environment variables in an object
 */
export declare function resolveEnvVarsInConfig<T>(config: T): T;
//# sourceMappingURL=config-types.d.ts.map