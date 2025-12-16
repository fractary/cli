/**
 * Forge Configuration Utilities
 *
 * Helper functions for loading and managing Forge configuration.
 * Integrates with @fractary/forge Registry SDK.
 */
import type { RegistryForgeConfig as ForgeConfig, RegistryConfig } from '@fractary/forge';
/**
 * Get project-level Forge directory (.fractary/plugins/forge/)
 */
export declare function getForgeDir(cwd?: string): Promise<string>;
/**
 * Get global Forge registry directory (~/.fractary/registry/)
 */
export declare function getGlobalRegistryDir(): string;
/**
 * Get project config path
 */
export declare function getProjectConfigPath(cwd?: string): Promise<string>;
/**
 * Get global config path
 */
export declare function getGlobalConfigPath(): string;
/**
 * Check if Forge is initialized in current project
 */
export declare function isForgeInitialized(cwd?: string): Promise<boolean>;
/**
 * Load Forge configuration from project or global config
 *
 * Returns merged configuration suitable for Registry SDK
 */
export declare function loadForgeConfig(cwd?: string): Promise<{
    config: ForgeConfig;
    projectRoot: string;
    configSource: 'project' | 'global' | 'default';
}>;
/**
 * Save Forge configuration to project config file
 */
export declare function saveForgeConfig(config: ForgeConfig, cwd?: string): Promise<void>;
/**
 * Get registry configuration from environment and config
 */
export declare function getRegistryConfig(cwd?: string): Promise<{
    local: {
        enabled: boolean;
        paths: string[];
    };
    global: {
        enabled: boolean;
        path: string;
    };
    remote: {
        enabled: boolean;
        registries: RegistryConfig[];
    };
}>;
/**
 * Get authentication token from environment
 */
export declare function getAuthToken(): string | undefined;
/**
 * Check if user is authenticated
 */
export declare function isAuthenticated(): boolean;
/**
 * Require authentication, throw if not authenticated
 */
export declare function requireAuth(): string;
//# sourceMappingURL=forge-config.d.ts.map