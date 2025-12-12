/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
 */
import { WorkManager, RepoManager, SpecManager, LogManager, StateManager, FaberWorkflow, loadWorkConfig, loadRepoConfig, loadSpecConfig, loadLogConfig, loadStateConfig, loadFaberConfig, getDefaultWorkflowConfig, mergeWithDefaults, WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig } from '@fractary/faber';
/**
 * Error thrown when SDK is not available
 */
export declare class SDKNotAvailableError extends Error {
    readonly sdk: string;
    readonly cause?: Error;
    constructor(sdk: string, cause?: Error);
}
/**
 * Get WorkManager instance (lazy-loaded)
 */
export declare function getWorkManager(config?: WorkConfig): Promise<WorkManager>;
/**
 * Get RepoManager instance (lazy-loaded)
 */
export declare function getRepoManager(config?: RepoConfig): Promise<RepoManager>;
/**
 * Get SpecManager instance (lazy-loaded)
 */
export declare function getSpecManager(config?: SpecConfig): Promise<SpecManager>;
/**
 * Get LogManager instance (lazy-loaded)
 */
export declare function getLogManager(config?: LogConfig): Promise<LogManager>;
/**
 * Get StateManager instance (lazy-loaded)
 */
export declare function getStateManager(config?: StateConfig): Promise<StateManager>;
/**
 * Get FaberWorkflow instance (lazy-loaded)
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
export { loadWorkConfig, loadRepoConfig, loadSpecConfig, loadLogConfig, loadStateConfig, loadFaberConfig, getDefaultWorkflowConfig, mergeWithDefaults, };
export type { WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig, };
//# sourceMappingURL=factory.d.ts.map