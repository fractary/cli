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

// Re-export SDK types directly for convenience
export type {
  // Work types
  Issue,
  IssueCreateOptions,
  IssueUpdateOptions,
  IssueFilters,
  WorkType,
  Comment,
  Label,
  Milestone,
  MilestoneCreateOptions,
  FaberContext,

  // Repo types
  Branch,
  BranchCreateOptions,
  BranchDeleteOptions,
  BranchListOptions,
  Commit,
  CommitOptions,
  CommitListOptions,
  GitStatus,
  PullRequest,
  PRCreateOptions,
  PRUpdateOptions,
  PRListOptions,
  PRMergeOptions,
  PRReviewOptions,
  Tag,
  TagCreateOptions,
  TagListOptions,
  Worktree,
  WorktreeCreateOptions,
  WorktreeCleanupOptions,
  PushOptions,
  PullOptions,

  // Spec types
  Specification,
  SpecMetadata,
  SpecCreateOptions,
  SpecListOptions,
  SpecValidateResult,
  SpecRefineResult,
  PhaseUpdateOptions,

  // Log types
  LogEntry,
  LogStatus,
  LogWriteOptions,
  LogListOptions,
  LogSearchOptions,
  LogSearchResult,
  CaptureStartOptions,
  CaptureResult,
  CaptureSession,
  LogAppendOptions,
  ArchiveResult,

  // State types
  FaberPhase,
  WorkflowState,
  PhaseState,
  RunManifest,
  PhaseManifest,
  ArtifactManifest,
  Checkpoint,
  StateUpdateOptions,
  StateQueryOptions,
  RecoveryOptions,

  // Workflow types
  WorkflowOptions,
  WorkflowResult,
  UserInputCallback,
  EventListener,
} from '@fractary/faber';

// Re-export manager classes for direct access if needed
export {
  WorkManager,
  RepoManager,
  SpecManager,
  LogManager,
  StateManager,
  FaberWorkflow,
} from '@fractary/faber';
