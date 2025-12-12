/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to SDK managers with proper error handling.
 *
 * Currently uses stub implementations until @fractary/faber v0.2.0 is available
 * with the new manager classes (WorkManager, RepoManager, etc.).
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
} from './types';

import {
  createStubWorkManager,
  createStubRepoManager,
  createStubSpecManager,
  createStubLogManager,
  createStubStateManager,
  createStubWorkflow,
} from './stubs';

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
 * Load configuration from project .fractary directory
 */
async function loadConfig(): Promise<{ work?: WorkConfig; repo?: RepoConfig } | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const configPath = path.join(process.cwd(), '.fractary', 'faber', 'config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get WorkManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { WorkManager, loadWorkConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadWorkConfig() ?? undefined;
 *   instances.work = new WorkManager(resolvedConfig);
 */
export async function getWorkManager(config?: WorkConfig): Promise<WorkManager> {
  if (!instances.work) {
    const projectConfig = await loadConfig();
    const resolvedConfig = config ?? projectConfig?.work;
    instances.work = createStubWorkManager(resolvedConfig);
  }
  return instances.work;
}

/**
 * Get RepoManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { RepoManager, loadRepoConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadRepoConfig() ?? undefined;
 *   instances.repo = new RepoManager(resolvedConfig);
 */
export async function getRepoManager(config?: RepoConfig): Promise<RepoManager> {
  if (!instances.repo) {
    const projectConfig = await loadConfig();
    const resolvedConfig = config ?? projectConfig?.repo;
    instances.repo = createStubRepoManager(resolvedConfig);
  }
  return instances.repo;
}

/**
 * Get SpecManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export async function getSpecManager(): Promise<SpecManager> {
  if (!instances.spec) {
    instances.spec = createStubSpecManager();
  }
  return instances.spec;
}

/**
 * Get LogManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export async function getLogManager(): Promise<LogManager> {
  if (!instances.logs) {
    instances.logs = createStubLogManager();
  }
  return instances.logs;
}

/**
 * Get StateManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export async function getStateManager(): Promise<StateManager> {
  if (!instances.state) {
    instances.state = createStubStateManager();
  }
  return instances.state;
}

/**
 * Get FaberWorkflow instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
export async function getWorkflow(): Promise<FaberWorkflow> {
  if (!instances.workflow) {
    instances.workflow = createStubWorkflow();
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
