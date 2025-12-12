/**
 * Top-level command aliases
 *
 * Provides shortcuts to faber subcommands:
 * - work → faber work
 * - repo → faber repo
 * - spec → faber spec
 * - logs → faber logs
 */

import { Command } from 'commander';

// Re-export the command creators from faber subcommands
import { createWorkCommand } from '../faber/commands/work';
import { createRepoCommand } from '../faber/commands/repo';
import { createSpecCommand } from '../faber/commands/spec';
import { createLogsCommand } from '../faber/commands/logs';

/**
 * Create work alias command (top-level shortcut to faber work)
 */
export function createWorkAliasCommand(): Command {
  const work = createWorkCommand();
  work.description('Work item tracking (alias for: faber work)');
  return work;
}

/**
 * Create repo alias command (top-level shortcut to faber repo)
 */
export function createRepoAliasCommand(): Command {
  const repo = createRepoCommand();
  repo.description('Repository operations (alias for: faber repo)');
  return repo;
}

/**
 * Create spec alias command (top-level shortcut to faber spec)
 */
export function createSpecAliasCommand(): Command {
  const spec = createSpecCommand();
  spec.description('Specification management (alias for: faber spec)');
  return spec;
}

/**
 * Create logs alias command (top-level shortcut to faber logs)
 */
export function createLogsAliasCommand(): Command {
  const logs = createLogsCommand();
  logs.description('Log management (alias for: faber logs)');
  return logs;
}
