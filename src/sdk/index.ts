/**
 * SDK Integration Layer
 *
 * Provides unified access to @fractary/faber SDK with lazy loading and error handling.
 */

// Factory functions
export {
  getWorkManager,
  getRepoManager,
  getSpecManager,
  getLogManager,
  getStateManager,
  getWorkflow,
  clearInstances,
  isFaberAvailable,
  SDKNotAvailableError,
  // Config loaders
  loadWorkConfig,
  loadRepoConfig,
  loadSpecConfig,
  loadLogConfig,
  loadStateConfig,
  loadFaberConfig,
  getDefaultWorkflowConfig,
  mergeWithDefaults,
} from './factory';

// Re-export types from factory
export type {
  WorkConfig,
  RepoConfig,
  SpecConfig,
  LogConfig,
  StateConfig,
  WorkflowConfig,
  FaberConfig,
} from './factory';

// Note: Type re-exports are removed to prevent loading @fractary/faber at module load time.
// If you need SDK types, import them directly from '@fractary/faber' where needed.
