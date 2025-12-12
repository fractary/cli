/**
 * SDK Stub Implementations
 *
 * Placeholder implementations for SDK managers until @fractary/faber is updated.
 * These stubs provide the interface but throw "not implemented" errors.
 *
 * TODO: Replace with actual SDK imports once @fractary/faber v0.2.0 is available.
 */

import type {
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
  WorkflowConfig,
} from './types';

/**
 * Error thrown when calling unimplemented SDK methods
 */
export class SDKNotImplementedError extends Error {
  constructor(managerName: string, methodName: string) {
    super(
      `${managerName}.${methodName}() is not yet implemented. ` +
      `The @fractary/faber SDK needs to be updated to version 0.2.0 with the new manager classes.`
    );
    this.name = 'SDKNotImplementedError';
  }
}

/**
 * Create a stub WorkManager
 */
export function createStubWorkManager(_config?: WorkConfig): WorkManager {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('WorkManager', method);
  };

  return {
    getIssue: async () => notImpl('getIssue'),
    createIssue: async () => notImpl('createIssue'),
    updateIssue: async () => notImpl('updateIssue'),
    closeIssue: async () => notImpl('closeIssue'),
    searchIssues: async () => notImpl('searchIssues'),
    createComment: async () => notImpl('createComment'),
    listComments: async () => notImpl('listComments'),
    addLabel: async () => notImpl('addLabel'),
    removeLabel: async () => notImpl('removeLabel'),
    getIssueLabels: async () => notImpl('getIssueLabels'),
    listLabels: async () => notImpl('listLabels'),
    createMilestone: async () => notImpl('createMilestone'),
    listMilestones: async () => notImpl('listMilestones'),
    assignMilestone: async () => notImpl('assignMilestone'),
  };
}

/**
 * Create a stub RepoManager
 */
export function createStubRepoManager(_config?: RepoConfig): RepoManager {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('RepoManager', method);
  };

  return {
    createBranch: async () => notImpl('createBranch'),
    deleteBranch: async () => notImpl('deleteBranch'),
    listBranches: async () => notImpl('listBranches'),
    createCommit: async () => notImpl('createCommit'),
    commitAndPush: async () => notImpl('commitAndPush'),
    createPR: async () => notImpl('createPR'),
    reviewPR: async () => notImpl('reviewPR'),
    mergePR: async () => notImpl('mergePR'),
    listPRs: async () => notImpl('listPRs'),
    createTag: async () => notImpl('createTag'),
    pushTag: async () => notImpl('pushTag'),
    listTags: async () => notImpl('listTags'),
    createWorktree: async () => notImpl('createWorktree'),
    listWorktrees: async () => notImpl('listWorktrees'),
    removeWorktree: async () => notImpl('removeWorktree'),
    cleanupWorktrees: async () => notImpl('cleanupWorktrees'),
    push: async () => notImpl('push'),
    pull: async () => notImpl('pull'),
  };
}

/**
 * Create a stub SpecManager
 */
export function createStubSpecManager(_config?: SpecConfig): SpecManager {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('SpecManager', method);
  };

  return {
    create: async () => notImpl('create'),
    refine: async () => notImpl('refine'),
    validate: async () => notImpl('validate'),
    archive: async () => notImpl('archive'),
    read: async () => notImpl('read'),
    list: async () => notImpl('list'),
    update: async () => notImpl('update'),
  };
}

/**
 * Create a stub LogManager
 */
export function createStubLogManager(_config?: LogConfig): LogManager {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('LogManager', method);
  };

  return {
    startCapture: async () => notImpl('startCapture'),
    stopCapture: async () => notImpl('stopCapture'),
    write: async () => notImpl('write'),
    search: async () => notImpl('search'),
    list: async () => notImpl('list'),
    archive: async () => notImpl('archive'),
    cleanup: async () => notImpl('cleanup'),
    audit: async () => notImpl('audit'),
  };
}

/**
 * Create a stub StateManager
 */
export function createStubStateManager(_config?: StateConfig): StateManager {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('StateManager', method);
  };

  return {
    getWorkflowStatus: async () => notImpl('getWorkflowStatus'),
    listActiveWorkflows: async () => notImpl('listActiveWorkflows'),
  };
}

/**
 * Create a stub FaberWorkflow
 */
export function createStubWorkflow(_config?: WorkflowConfig): FaberWorkflow {
  const notImpl = (method: string) => {
    throw new SDKNotImplementedError('FaberWorkflow', method);
  };

  return {
    run: async () => notImpl('run'),
    createPlan: async () => notImpl('createPlan'),
  };
}
