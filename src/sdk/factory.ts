/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
 *
 * IMPORTANT: Uses dynamic imports to avoid loading @fractary/faber at module load time.
 * This prevents CLI hangs when running simple commands like --help.
 */

// Import types only (these don't cause module execution)
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
 * Get WorkManager instance (lazy-loaded with dynamic import)
 */
export async function getWorkManager(config?: WorkConfig): Promise<WorkManager> {
  if (!instances.work) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const resolvedConfig = config ?? faber.loadWorkConfig() ?? undefined;
      instances.work = new faber.WorkManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.work;
}

/**
 * Get RepoManager instance (lazy-loaded with dynamic import)
 */
export async function getRepoManager(config?: RepoConfig): Promise<RepoManager> {
  if (!instances.repo) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const resolvedConfig = config ?? faber.loadRepoConfig() ?? undefined;
      instances.repo = new faber.RepoManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.repo;
}

/**
 * Get SpecManager instance (lazy-loaded with dynamic import)
 */
export async function getSpecManager(config?: SpecConfig): Promise<SpecManager> {
  if (!instances.spec) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const resolvedConfig = config ?? faber.loadSpecConfig();
      instances.spec = new faber.SpecManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.spec;
}

/**
 * Get LogManager instance (lazy-loaded with dynamic import)
 */
export async function getLogManager(config?: LogConfig): Promise<LogManager> {
  if (!instances.logs) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const resolvedConfig = config ?? faber.loadLogConfig();
      instances.logs = new faber.LogManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.logs;
}

/**
 * Get StateManager instance (lazy-loaded with dynamic import)
 */
export async function getStateManager(config?: StateConfig): Promise<StateManager> {
  if (!instances.state) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const resolvedConfig = config ?? faber.loadStateConfig();
      instances.state = new faber.StateManager(resolvedConfig);
    } catch (error) {
      throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
    }
  }
  return instances.state;
}

/**
 * Get FaberWorkflow instance (lazy-loaded with dynamic import)
 */
export async function getWorkflow(config?: Partial<WorkflowConfig>): Promise<FaberWorkflow> {
  if (!instances.workflow) {
    try {
      // Dynamic import to avoid loading SDK at module load time
      const faber = await import('@fractary/faber');
      const faberConfig = faber.loadFaberConfig();
      const workflowConfig = config
        ? faber.mergeWithDefaults(config)
        : faberConfig?.workflow ?? faber.getDefaultWorkflowConfig();
      instances.workflow = new faber.FaberWorkflow({ config: workflowConfig });
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

/**
 * Load work configuration (dynamic import)
 */
export async function loadWorkConfig(): Promise<WorkConfig | null> {
  try {
    const faber = await import('@fractary/faber');
    return faber.loadWorkConfig();
  } catch {
    return null;
  }
}

/**
 * Load repo configuration (dynamic import)
 */
export async function loadRepoConfig(): Promise<RepoConfig | null> {
  try {
    const faber = await import('@fractary/faber');
    return faber.loadRepoConfig();
  } catch {
    return null;
  }
}

/**
 * Load spec configuration (dynamic import)
 */
export async function loadSpecConfig(): Promise<SpecConfig> {
  const faber = await import('@fractary/faber');
  return faber.loadSpecConfig();
}

/**
 * Load log configuration (dynamic import)
 */
export async function loadLogConfig(): Promise<LogConfig> {
  const faber = await import('@fractary/faber');
  return faber.loadLogConfig();
}

/**
 * Load state configuration (dynamic import)
 */
export async function loadStateConfig(): Promise<StateConfig> {
  const faber = await import('@fractary/faber');
  return faber.loadStateConfig();
}

/**
 * Load FABER configuration (dynamic import)
 */
export async function loadFaberConfig(): Promise<FaberConfig | null> {
  try {
    const faber = await import('@fractary/faber');
    return faber.loadFaberConfig();
  } catch {
    return null;
  }
}

/**
 * Get default workflow configuration (dynamic import)
 */
export async function getDefaultWorkflowConfig(): Promise<WorkflowConfig> {
  const faber = await import('@fractary/faber');
  return faber.getDefaultWorkflowConfig();
}

/**
 * Merge with defaults (dynamic import)
 */
export async function mergeWithDefaults(config: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
  const faber = await import('@fractary/faber');
  return faber.mergeWithDefaults(config);
}

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
