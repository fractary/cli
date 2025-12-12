/**
 * SDK Integration Layer
 *
 * Provides unified access to Fractary SDKs with lazy loading and error handling.
 */

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
} from './factory';

// Re-export types
export type {
  WorkManager,
  RepoManager,
  SpecManager,
  LogManager,
  StateManager,
  FaberWorkflow,
  WorkConfig,
  RepoConfig,
  SpecConfig,
  LogConfig,
  StateConfig,
  FaberConfig,
  WorkflowConfig,
  Issue,
  Comment,
  Label,
  Milestone,
  Branch,
  Commit,
  PullRequest,
  Tag,
  Worktree,
  Specification,
  LogEntry,
  WorkflowStatus,
  WorkflowResult,
  ExecutionPlan,
} from './types';
