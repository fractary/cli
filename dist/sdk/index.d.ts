/**
 * SDK Integration Layer
 *
 * Provides unified access to @fractary/faber SDK with lazy loading and error handling.
 */
export { getWorkManager, getRepoManager, getSpecManager, getLogManager, getStateManager, getWorkflow, clearInstances, isFaberAvailable, SDKNotAvailableError, loadWorkConfig, loadRepoConfig, loadSpecConfig, loadLogConfig, loadStateConfig, loadFaberConfig, getDefaultWorkflowConfig, mergeWithDefaults, } from './factory';
export type { WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig, } from './factory';
//# sourceMappingURL=index.d.ts.map