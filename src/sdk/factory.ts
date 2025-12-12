/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
 */

import {
  WorkManager,
  RepoManager,
  SpecManager,
  LogManager,
  StateManager,
  FaberWorkflow,
  loadWorkConfig,
  loadRepoConfig,
  loadSpecConfig,
  loadLogConfig,
  loadStateConfig,
  loadFaberConfig,
  getDefaultWorkflowConfig,
  mergeWithDefaults,
  WorkConfig,
  RepoConfig,
  SpecConfig,
  LogConfig,
  StateConfig,
  WorkflowConfig,
  FaberConfig,
} from '@fractary/faber';

/**
 * Cached SDK instances
 */
interface SDKInstances {
  work?: WorkManager;
  repo?: RepoManager;
  spec?: SpecManager;
  logs?: LogManager;
  state?: StateManager;
  workflow?: FaberWorkflow;
}

const instances: SDKInstances = {};

/**
 * Error thrown when SDK is not available
 */
export class SDKNotAvailableError extends Error {
  readonly sdk: string;
  readonly cause?: Error;

  constructor(sdk: string, cause?: Error) {
    super(`${sdk} SDK is not available. Install with: npm install @fractary/${sdk}`);
    this.name = 'SDKNotAvailableError';
    this.sdk = sdk;
    this.cause = cause;
  }
}

/**
 * Get WorkManager instance (lazy-loaded)
 */
export async function getWorkManager(config?: WorkConfig): Promise<WorkManager> {
  if (!instances.work) {
    try {
      const resolvedConfig = config ?? loadWorkConfig() ?? undefined;
      instances.work = new WorkManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.work;
}

/**
 * Get RepoManager instance (lazy-loaded)
 */
export async function getRepoManager(config?: RepoConfig): Promise<RepoManager> {
  if (!instances.repo) {
    try {
      const resolvedConfig = config ?? loadRepoConfig() ?? undefined;
      instances.repo = new RepoManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.repo;
}

/**
 * Get SpecManager instance (lazy-loaded)
 */
export async function getSpecManager(config?: SpecConfig): Promise<SpecManager> {
  if (!instances.spec) {
    try {
      const resolvedConfig = config ?? loadSpecConfig();
      instances.spec = new SpecManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.spec;
}

/**
 * Get LogManager instance (lazy-loaded)
 */
export async function getLogManager(config?: LogConfig): Promise<LogManager> {
  if (!instances.logs) {
    try {
      const resolvedConfig = config ?? loadLogConfig();
      instances.logs = new LogManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.logs;
}

/**
 * Get StateManager instance (lazy-loaded)
 */
export async function getStateManager(config?: StateConfig): Promise<StateManager> {
  if (!instances.state) {
    try {
      const resolvedConfig = config ?? loadStateConfig();
      instances.state = new StateManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.state;
}

/**
 * Get FaberWorkflow instance (lazy-loaded)
 */
export async function getWorkflow(config?: Partial<WorkflowConfig>): Promise<FaberWorkflow> {
  if (!instances.workflow) {
    try {
      const faberConfig = loadFaberConfig();
      const workflowConfig = config
        ? mergeWithDefaults(config)
        : faberConfig?.workflow ?? getDefaultWorkflowConfig();
      instances.workflow = new FaberWorkflow({ config: workflowConfig });
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.workflow;
}

/**
 * Clear cached instances (useful for testing)
 */
export function clearInstances(): void {
  instances.work = undefined;
  instances.repo = undefined;
  instances.spec = undefined;
  instances.logs = undefined;
  instances.state = undefined;
  instances.workflow = undefined;
}

/**
 * Check if faber SDK is available
 */
export async function isFaberAvailable(): Promise<boolean> {
  try {
    await import('@fractary/faber');
    return true;
  } catch {
    return false;
  }
}

// Re-export config loaders for convenience
export {
  loadWorkConfig,
  loadRepoConfig,
  loadSpecConfig,
  loadLogConfig,
  loadStateConfig,
  loadFaberConfig,
  getDefaultWorkflowConfig,
  mergeWithDefaults,
};

// Re-export types
export type {
  WorkConfig,
  RepoConfig,
  SpecConfig,
  LogConfig,
  StateConfig,
  WorkflowConfig,
  FaberConfig,
};
