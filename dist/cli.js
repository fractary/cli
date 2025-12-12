#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const faber_1 = require("./tools/faber");
const codex_1 = require("./tools/codex");
// import { createForgeCommand } from './tools/forge'; // TODO: Re-enable when @fractary/forge SDK is published
const aliases_1 = require("./tools/aliases");
// Package information
const packageJson = require('../package.json');
// Create main program
const program = new commander_1.Command();
program
    .name('fractary')
    .description('Unified CLI for all Fractary tools')
    .version(packageJson.version);
// SDK tool commands
program.addCommand((0, faber_1.createFaberCommand)());
program.addCommand((0, codex_1.createCodexCommand)());
// program.addCommand(createForgeCommand()); // TODO: Re-enable when @fractary/forge SDK is published
// Future tools (commented out until available)
// program.addCommand(createHelmCommand());
// Top-level shortcut aliases (delegate to faber subcommands)
program.addCommand((0, aliases_1.createWorkAliasCommand)());
program.addCommand((0, aliases_1.createRepoAliasCommand)());
program.addCommand((0, aliases_1.createSpecAliasCommand)());
program.addCommand((0, aliases_1.createLogsAliasCommand)());
// Custom help to show SDK vs Shortcut commands separately
program.addHelpText('after', `
${chalk_1.default.bold('SDK Commands:')}
  faber       FABER development toolkit (workflow, work, repo, spec, logs)
  codex       Codex knowledge infrastructure (fetch, sync, cache, mcp)
  forge       Asset management and project scaffolding
  helm        Runtime governance and monitoring [coming soon]

${chalk_1.default.bold('Shortcut Commands:')}
  work        Work item tracking (alias for: faber work)
  repo        Repository operations (alias for: faber repo)
  spec        Specification management (alias for: faber spec)
  logs        Log management (alias for: faber logs)

${chalk_1.default.bold('Examples:')}
  $ fractary faber run --work-id 123     # Run FABER workflow
  $ fractary work issue fetch 123        # Fetch work item (shortcut)
  $ fractary repo commit --message "Add feature"  # Create commit (shortcut)
  $ fractary codex fetch "codex://org/project/doc.md"  # Fetch from Codex

Run '${chalk_1.default.cyan('fractary <command> --help')}' for more information on a command.
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
    }
    catch (error) {
        if (error.code === 'commander.help') {
            process.exit(0);
        }
        if (error.code === 'commander.unknownCommand') {
            console.error(chalk_1.default.red('Unknown command:'), error.message);
            console.log(chalk_1.default.gray('\nAvailable SDK tools:'));
            console.log(chalk_1.default.gray('  faber  - FABER development toolkit'));
            console.log(chalk_1.default.gray('  codex  - Codex knowledge infrastructure'));
            console.log(chalk_1.default.gray('  forge  - Asset management and project scaffolding'));
            console.log(chalk_1.default.gray('  helm   - Runtime governance [coming soon]'));
            console.log(chalk_1.default.gray('\nShortcut commands:'));
            console.log(chalk_1.default.gray('  work   - Work item tracking'));
            console.log(chalk_1.default.gray('  repo   - Repository operations'));
            console.log(chalk_1.default.gray('  spec   - Specification management'));
            console.log(chalk_1.default.gray('  logs   - Log management'));
            console.log(chalk_1.default.gray('\nRun "fractary --help" for more information.'));
            process.exit(1);
        }
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
// Run CLI
main().catch(error => {
    console.error(chalk_1.default.red('Fatal error:'), error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map