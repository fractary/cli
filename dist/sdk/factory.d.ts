/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
 *
 * IMPORTANT: Uses dynamic imports to avoid loading @fractary/faber at module load time.
 * This prevents CLI hangs when running simple commands like --help.
 */
import type { WorkManager, RepoManager, SpecManager, LogManager, StateManager, FaberWorkflow, WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig } from '@fractary/faber';
/**
 * Error thrown when SDK is not available
 */
export declare class SDKNotAvailableError extends Error {
    readonly sdk: string;
    readonly cause?: Error;
    constructor(sdk: string, cause?: Error);
}
/**
 * Get WorkManager instance (lazy-loaded with dynamic import)
 */
export declare function getWorkManager(config?: WorkConfig): Promise<WorkManager>;
/**
 * Get RepoManager instance (lazy-loaded with dynamic import)
 */
export declare function getRepoManager(config?: RepoConfig): Promise<RepoManager>;
/**
 * Get SpecManager instance (lazy-loaded with dynamic import)
 */
export declare function getSpecManager(config?: SpecConfig): Promise<SpecManager>;
/**
 * Get LogManager instance (lazy-loaded with dynamic import)
 */
export declare function getLogManager(config?: LogConfig): Promise<LogManager>;
/**
 * Get StateManager instance (lazy-loaded with dynamic import)
 */
export declare function getStateManager(config?: StateConfig): Promise<StateManager>;
/**
 * Get FaberWorkflow instance (lazy-loaded with dynamic import)
 */
export declare function getWorkflow(config?: Partial<WorkflowConfig>): Promise<FaberWorkflow>;
/**
 * Clear cached instances (useful for testing)
 */
export declare function clearInstances(): void;
/**
 * Check if faber SDK is available
 */
export declare function isFaberAvailable(): Promise<boolean>;
/**
 * Load work configuration (dynamic import)
 */
export declare function loadWorkConfig(): Promise<WorkConfig | null>;
/**
 * Load repo configuration (dynamic import)
 */
export declare function loadRepoConfig(): Promise<RepoConfig | null>;
/**
 * Load spec configuration (dynamic import)
 */
export declare function loadSpecConfig(): Promise<SpecConfig>;
/**
 * Load log configuration (dynamic import)
 */
export declare function loadLogConfig(): Promise<LogConfig>;
/**
 * Load state configuration (dynamic import)
 */
export declare function loadStateConfig(): Promise<StateConfig>;
/**
 * Load FABER configuration (dynamic import)
 */
export declare function loadFaberConfig(): Promise<FaberConfig | null>;
/**
 * Get default workflow configuration (dynamic import)
 */
export declare function getDefaultWorkflowConfig(): Promise<WorkflowConfig>;
/**
 * Merge with defaults (dynamic import)
 */
export declare function mergeWithDefaults(config: Partial<WorkflowConfig>): Promise<WorkflowConfig>;
export type { WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig, };
//# sourceMappingURL=factory.d.ts.map