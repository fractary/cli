/**
 * SDK Integration Layer
 *
 * Provides unified access to @fractary/faber SDK with lazy loading and error handling.
 */
export { getWorkManager, getRepoManager, getSpecManager, getLogManager, getStateManager, getWorkflow, clearInstances, isFaberAvailable, SDKNotAvailableError, loadWorkConfig, loadRepoConfig, loadSpecConfig, loadLogConfig, loadStateConfig, loadFaberConfig, getDefaultWorkflowConfig, mergeWithDefaults, } from './factory';
export type { WorkConfig, RepoConfig, SpecConfig, LogConfig, StateConfig, WorkflowConfig, FaberConfig, } from './factory';
export type { Issue, IssueCreateOptions, IssueUpdateOptions, IssueFilters, WorkType, Comment, Label, Milestone, MilestoneCreateOptions, FaberContext, Branch, BranchCreateOptions, BranchDeleteOptions, BranchListOptions, Commit, CommitOptions, CommitListOptions, GitStatus, PullRequest, PRCreateOptions, PRUpdateOptions, PRListOptions, PRMergeOptions, PRReviewOptions, Tag, TagCreateOptions, TagListOptions, Worktree, WorktreeCreateOptions, WorktreeCleanupOptions, PushOptions, PullOptions, Specification, SpecMetadata, SpecCreateOptions, SpecListOptions, SpecValidateResult, SpecRefineResult, PhaseUpdateOptions, LogEntry, LogStatus, LogWriteOptions, LogListOptions, LogSearchOptions, LogSearchResult, CaptureStartOptions, CaptureResult, CaptureSession, LogAppendOptions, ArchiveResult, FaberPhase, WorkflowState, PhaseState, RunManifest, PhaseManifest, ArtifactManifest, Checkpoint, StateUpdateOptions, StateQueryOptions, RecoveryOptions, WorkflowOptions, WorkflowResult, UserInputCallback, EventListener, } from '@fractary/faber';
export { WorkManager, RepoManager, SpecManager, LogManager, StateManager, FaberWorkflow, } from '@fractary/faber';
//# sourceMappingURL=index.d.ts.map