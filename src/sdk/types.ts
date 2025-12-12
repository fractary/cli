/**
 * SDK Type Definitions
 *
 * These interfaces define the expected API for the @fractary/faber SDK managers.
 * The actual implementations will come from the SDK once it's updated.
 * For now, stub implementations are provided in stubs.ts.
 */

// Work Manager Types

export interface WorkConfig {
  provider: 'github' | 'jira' | 'linear';
  // Provider-specific settings
}

export interface Issue {
  number: number;
  title: string;
  body?: string;
  state: string;
  labels?: string[];
  assignees?: string[];
  milestone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface Label {
  name: string;
  color?: string;
  description?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  state: string;
}

export interface WorkManager {
  getIssue(number: number): Promise<Issue>;
  createIssue(data: { title: string; body?: string; type?: string }): Promise<Issue>;
  updateIssue(number: number, data: { title?: string; body?: string }): Promise<Issue>;
  closeIssue(number: number, comment?: string): Promise<void>;
  searchIssues(params: { query: string; state?: string; limit?: number }): Promise<Issue[]>;

  createComment(issueNumber: number, body: string): Promise<Comment>;
  listComments(issueNumber: number, params?: { limit?: number }): Promise<Comment[]>;

  addLabel(issueNumber: number, label: string): Promise<void>;
  removeLabel(issueNumber: number, label: string): Promise<void>;
  getIssueLabels(issueNumber: number): Promise<Label[]>;
  listLabels(): Promise<Label[]>;

  createMilestone(data: { title: string; dueDate?: string; description?: string }): Promise<Milestone>;
  listMilestones(params?: { state?: string }): Promise<Milestone[]>;
  assignMilestone(issueNumber: number, milestone: string): Promise<void>;
}

// Repo Manager Types

export interface RepoConfig {
  provider: 'github' | 'gitlab' | 'bitbucket';
  defaultBranch?: string;
  branchPrefix?: string;
}

export interface Branch {
  name: string;
  current?: boolean;
  tracking?: string;
  lastCommit?: string;
}

export interface Commit {
  sha: string;
  message: string;
  author?: string;
  date?: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body?: string;
  state: string;
  url: string;
  author?: string;
  baseBranch?: string;
  headBranch?: string;
}

export interface Tag {
  name: string;
  message?: string;
  sha?: string;
}

export interface Worktree {
  path: string;
  branch: string;
  workId?: string;
}

export interface RepoManager {
  createBranch(data: { description: string; workId?: string; baseBranch?: string; createWorktree?: boolean }): Promise<{ branchName: string; worktreePath?: string }>;
  deleteBranch(name: string, params?: { location?: string; force?: boolean }): Promise<void>;
  listBranches(params?: { stale?: boolean; merged?: boolean; pattern?: string }): Promise<Branch[]>;

  createCommit(data: { message: string; type?: string; scope?: string; workId?: string }): Promise<Commit>;
  commitAndPush(data: { message: string; type?: string; setUpstream?: boolean }): Promise<Commit>;

  createPR(data: { title: string; body?: string; baseBranch?: string; draft?: boolean }): Promise<PullRequest>;
  reviewPR(number: number, params: { action: string; comment?: string }): Promise<void>;
  mergePR(number: number, params?: { strategy?: string; deleteBranch?: boolean }): Promise<void>;
  listPRs(params?: { state?: string; author?: string }): Promise<PullRequest[]>;

  createTag(name: string, params?: { message?: string; sign?: boolean }): Promise<Tag>;
  pushTag(name: string, params?: { remote?: string }): Promise<void>;
  listTags(params?: { pattern?: string; latest?: number }): Promise<Tag[]>;

  createWorktree(branch: string, params?: { workId?: string }): Promise<Worktree>;
  listWorktrees(): Promise<Worktree[]>;
  removeWorktree(branch: string, params?: { force?: boolean }): Promise<void>;
  cleanupWorktrees(params?: { merged?: boolean; stale?: boolean; dryRun?: boolean }): Promise<{ cleaned: string[] }>;

  push(params?: { remote?: string; setUpstream?: boolean; force?: boolean }): Promise<void>;
  pull(params?: { rebase?: boolean; strategy?: string }): Promise<void>;
}

// Spec Manager Types

export interface SpecConfig {
  directory?: string;
  templates?: Record<string, string>;
}

export interface Specification {
  workId: string;
  title?: string;
  content: string;
  status: 'draft' | 'complete' | 'archived';
  path: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecManager {
  create(data: { workId: string; template?: string; force?: boolean }): Promise<{ path: string }>;
  refine(data: { workId: string; prompt?: string; round?: number }): Promise<{ questions?: string[] }>;
  validate(data: { workId: string; phase?: string }): Promise<{ valid: boolean; errors?: string[]; checklist?: Array<{ task: string; complete: boolean }> }>;
  archive(data: { workId: string; force?: boolean }): Promise<{ url?: string }>;
  read(data: { workId: string; phase?: string }): Promise<Specification>;
  list(params?: { status?: string }): Promise<Specification[]>;
  update(data: { workId: string; phase: string; status?: string; checkTask?: string }): Promise<void>;
}

// Log Manager Types

export interface LogConfig {
  directory?: string;
  retention?: Record<string, number>;
}

export interface LogEntry {
  type: string;
  title: string;
  path: string;
  issueNumber?: number;
  content?: string;
  date?: string;
  snippet?: string;
}

export interface LogManager {
  startCapture(data: { issueNumber: number; model?: string }): Promise<{ sessionId: string }>;
  stopCapture(): Promise<{ path?: string }>;
  write(data: { type: string; title: string; issueNumber?: number; content?: string }): Promise<{ path: string }>;
  search(params: { query: string; type?: string; issueNumber?: number; limit?: number }): Promise<LogEntry[]>;
  list(params?: { type?: string; status?: string; issueNumber?: number; limit?: number }): Promise<LogEntry[]>;
  archive(params?: { type?: string; issueNumber?: number; dryRun?: boolean }): Promise<{ archived: string[] }>;
  cleanup(params?: { olderThanDays?: number; type?: string; dryRun?: boolean }): Promise<{ deleted: string[] }>;
  audit(params?: { execute?: boolean; verbose?: boolean }): Promise<{ total: number; issues: Array<{ type: string; description: string; path?: string }>; fixed: string[] }>;
}

// State Manager Types

export interface StateConfig {
  directory?: string;
  persistence?: 'file' | 'none';
}

export interface WorkflowStatus {
  workId: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentPhase?: string;
  startedAt?: string;
  checkpoint?: { savedAt: string };
  phases?: Array<{ name: string; complete: boolean; current: boolean; duration?: number }>;
}

export interface StateManager {
  getWorkflowStatus(workId: string): Promise<WorkflowStatus>;
  listActiveWorkflows(): Promise<WorkflowStatus[]>;
}

// Workflow Types

export interface FaberConfig {
  workflow?: WorkflowConfig;
}

export interface WorkflowConfig {
  defaultAutonomy?: string;
  phases?: string[];
  checkpoints?: boolean;
}

export interface WorkflowCallbacks {
  onPhaseStart?: (phase: string) => void;
  onPhaseComplete?: (phase: string, result: any) => void;
  onCheckpoint?: (checkpoint: any) => void;
}

export interface WorkflowResult {
  success: boolean;
  duration: number;
  phasesCompleted: string[];
}

export interface ExecutionPlan {
  workId: string;
  createdAt: string;
  phases: Array<{ name: string; description: string; tasks?: string[] }>;
  dependencies?: Array<{ name: string; status: string }>;
  estimate?: { complexity: string; risk: string };
}

export interface FaberWorkflow {
  run(params: {
    workId: string;
    autonomy?: string;
    startPhase?: string;
    resume?: boolean;
    skipFrame?: boolean;
  } & WorkflowCallbacks): Promise<WorkflowResult>;

  createPlan(workId: string): Promise<ExecutionPlan>;
}
