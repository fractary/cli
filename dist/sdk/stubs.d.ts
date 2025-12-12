/**
 * SDK Stub Implementations
 *
 * Placeholder implementations for SDK managers until @fractary/faber is updated.
 * These stubs provide the interface but throw "not implemented" errors.
 *
 * TODO: Replace with actual SDK imports once @fractary/faber v0.2.0 is available.
 */
import type { WorkManager, RepoManager, SpecManager, LogManager, StateManager, FaberWorkflow, WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig } from './types';
/**
 * Error thrown when calling unimplemented SDK methods
 */
export declare class SDKNotImplementedError extends Error {
    constructor(managerName: string, methodName: string);
}
/**
 * Create a stub WorkManager
 */
export declare function createStubWorkManager(_config?: WorkConfig): WorkManager;
/**
 * Create a stub RepoManager
 */
export declare function createStubRepoManager(_config?: RepoConfig): RepoManager;
/**
 * Create a stub SpecManager
 */
export declare function createStubSpecManager(_config?: SpecConfig): SpecManager;
/**
 * Create a stub LogManager
 */
export declare function createStubLogManager(_config?: LogConfig): LogManager;
/**
 * Create a stub StateManager
 */
export declare function createStubStateManager(_config?: StateConfig): StateManager;
/**
 * Create a stub FaberWorkflow
 */
export declare function createStubWorkflow(_config?: WorkflowConfig): FaberWorkflow;
//# sourceMappingURL=stubs.d.ts.map