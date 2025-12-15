#!/usr/bin/env node

/**
 * Fractary CLI - Unified command-line interface for all Fractary tools
 *
 * Command pattern: fractary <tool> <command> [options]
 *
 * SDK Commands:
 * - faber: FABER development toolkit (workflow, work, repo, spec, logs)
 * - codex: Centralized knowledge management
 * - forge: Asset management and project scaffolding
 * - helm: [Coming soon]
 *
 * Shortcut Commands:
 * - work: Work item tracking (alias for faber work)
 * - repo: Repository operations (alias for faber repo)
 * - spec: Specification management (alias for faber spec)
 * - logs: Log management (alias for faber logs)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createFaberCommand } from './tools/faber';
import { createCodexCommand } from './tools/codex';
import { createForgeCommand } from './tools/forge';
import {
  createWorkAliasCommand,
  createRepoAliasCommand,
  createSpecAliasCommand,
  createLogsAliasCommand,
} from './tools/aliases';

// Package information
const packageJson = require('../package.json');

// Create main program
const program = new Command();

program
  .name('fractary')
  .description('Unified CLI for all Fractary tools')
  .version(packageJson.version);

// SDK tool commands
program.addCommand(createFaberCommand());
program.addCommand(createCodexCommand());
program.addCommand(createForgeCommand());

// Future tools (commented out until available)
// program.addCommand(createHelmCommand());

// Top-level shortcut aliases (delegate to faber subcommands)
program.addCommand(createWorkAliasCommand());
program.addCommand(createRepoAliasCommand());
program.addCommand(createSpecAliasCommand());
program.addCommand(createLogsAliasCommand());

// Custom help to show SDK vs Shortcut commands separately
program.addHelpText('after', `
${chalk.bold('SDK Commands:')}
  faber       FABER development toolkit (workflow, work, repo, spec, logs)
  codex       Codex knowledge infrastructure (fetch, sync, cache, mcp)
  forge       Asset management and project scaffolding
  helm        Runtime governance and monitoring [coming soon]

${chalk.bold('Shortcut Commands:')}
  work        Work item tracking (alias for: faber work)
  repo        Repository operations (alias for: faber repo)
  spec        Specification management (alias for: faber spec)
  logs        Log management (alias for: faber logs)

${chalk.bold('Examples:')}
  $ fractary faber run --work-id 123     # Run FABER workflow
  $ fractary work issue fetch 123        # Fetch work item (shortcut)
  $ fractary repo commit --message "Add feature"  # Create commit (shortcut)
  $ fractary codex fetch "codex://org/project/doc.md"  # Fetch from Codex

Run '${chalk.cyan('fractary <command> --help')}' for more information on a command.
`);

// Show help if no command specified
if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(0);
}

// Error handling
program.exitOverride();

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    if (error.code === 'commander.help') {
      process.exit(0);
    }

    if (error.code === 'commander.unknownCommand') {
      console.error(chalk.red('Unknown command:'), error.message);
      console.log(chalk.gray('\nAvailable SDK tools:'));
      console.log(chalk.gray('  faber  - FABER development toolkit'));
      console.log(chalk.gray('  codex  - Codex knowledge infrastructure'));
      console.log(chalk.gray('  forge  - Asset management and project scaffolding'));
      console.log(chalk.gray('  helm   - Runtime governance [coming soon]'));
      console.log(chalk.gray('\nShortcut commands:'));
      console.log(chalk.gray('  work   - Work item tracking'));
      console.log(chalk.gray('  repo   - Repository operations'));
      console.log(chalk.gray('  spec   - Specification management'));
      console.log(chalk.gray('  logs   - Log management'));
      console.log(chalk.gray('\nRun "fractary --help" for more information.'));
      process.exit(1);
    }

    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
