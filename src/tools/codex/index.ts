/**
 * Codex tool - Centralized knowledge management and distribution (v3.0)
 *
 * Pull-based document retrieval with codex:// URI scheme and intelligent caching.
 * Exports the codex command for the unified Fractary CLI.
 *
 * @see SPEC-00024 - Codex SDK v3.0 Architecture
 * @see SPEC-00025 - Codex MCP Server Integration
 * @see SPEC-00026 - CLI Alignment with SDK v3.0
 */

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { fetchCommand } from './commands/fetch';
import { cacheCommand } from './commands/cache';
import { syncCommand } from './commands/sync';
import { typesCommand } from './commands/types';
import { healthCommand } from './commands/health';

/**
 * Create and configure the codex command
 */
export function createCodexCommand(): Command {
  const codex = new Command('codex');

  codex
    .description('Centralized knowledge management and distribution')
    .version('3.0.0');

  // Core commands (v3.0)
  codex.addCommand(initCommand());      // Initialize codex configuration
  codex.addCommand(fetchCommand());     // Fetch documents by codex:// URI
  codex.addCommand(cacheCommand());     // Cache management (list, clear, stats)
  codex.addCommand(syncCommand());      // Bidirectional sync (project, org)
  codex.addCommand(typesCommand());     // Type registry (list, show, add, remove)
  codex.addCommand(healthCommand());    // Diagnostics and auto-repair

  return codex;
}
