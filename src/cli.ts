#!/usr/bin/env node

/**
 * Fractary CLI - Unified command-line interface for all Fractary tools
 *
 * Command pattern: fractary <tool> <command> [options]
 *
 * Available tools:
 * - faber: Universal AI agent orchestration
 * - codex: Centralized knowledge management
 * - forge: Asset management and project scaffolding
 * - helm: [Coming soon]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createFaberCommand } from './tools/faber';
import { createCodexCommand } from './tools/codex';
import { createForgeCommand } from './tools/forge';

// Package information
const packageJson = require('../package.json');

// Create main program
const program = new Command();

program
  .name('fractary')
  .description('Unified CLI for all Fractary tools')
  .version(packageJson.version);

// Add tool commands
program.addCommand(createFaberCommand());
program.addCommand(createCodexCommand());
program.addCommand(createForgeCommand());

// Future tools (commented out until available)
// program.addCommand(createHelmCommand());

// Show help if no tool specified
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
      console.log(chalk.gray('\nAvailable tools:'));
      console.log(chalk.gray('  faber  - Universal AI agent orchestration'));
      console.log(chalk.gray('  codex  - Centralized knowledge management'));
      console.log(chalk.gray('  forge  - Asset management and project scaffolding'));
      console.log(chalk.gray('  helm   - [Coming soon]'));
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
