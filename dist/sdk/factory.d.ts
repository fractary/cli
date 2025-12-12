/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to SDK managers with proper error handling.
 *
 * Currently uses stub implementations until @fractary/faber v0.2.0 is available
 * with the new manager classes (WorkManager, RepoManager, etc.).
 */
import type { WorkManager, RepoManager, SpecManager, LogManager, StateManager, FaberWorkflow, WorkConfig, RepoConfig } from './types';
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
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { WorkManager, loadWorkConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadWorkConfig() ?? undefined;
 *   instances.work = new WorkManager(resolvedConfig);
 */
export declare function getWorkManager(config?: WorkConfig): Promise<WorkManager>;
/**
 * Get RepoManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { RepoManager, loadRepoConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadRepoConfig() ?? undefined;
 *   instances.repo = new RepoManager(resolvedConfig);
 */
export declare function getRepoManager(config?: RepoConfig): Promise<RepoManager>;
/**
 * Get SpecManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export declare function getSpecManager(): Promise<SpecManager>;
/**
 * Get LogManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export declare function getLogManager(): Promise<LogManager>;
/**
 * Get StateManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export declare function getStateManager(): Promise<StateManager>;
/**
 * Get FaberWorkflow instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export declare function getWorkflow(): Promise<FaberWorkflow>;
/**
 * Clear cached instances (useful for testing)
 */
export declare function clearInstances(): void;
/**
 * Check if faber SDK is available
 */
export declare function isFaberAvailable(): Promise<boolean>;
//# sourceMappingURL=factory.d.ts.map