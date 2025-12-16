"use strict";
/**
 * Forge Fork Command
 *
 * Create a local fork of a component with optional rename.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForkCommand = createForkCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fork_manager_1 = require("../../utils/fork-manager");
const formatters_1 = require("../../utils/formatters");
/**
 * Create fork command
 */
function createForkCommand() {
    const cmd = new commander_1.Command('fork');
    cmd
        .description('Create a local fork of a component')
        .argument('<source>', 'Component to fork (e.g., "registry/name" or just "name")')
        .argument('[name]', 'Optional new name for fork (auto-generated if not provided)')
        .option('-s, --source <type>', 'Source type: installed or registry (default: registry)', 'registry')
        .option('-r, --registry <name>', 'Specific registry to search')
        .option('-p, --path <dir>', 'Destination path for fork')
        .option('-d, --description <text>', 'Update component description')
        .option('-m, --update-metadata', 'Prompt to update component metadata')
        .option('--with-git', 'Initialize git tracking for fork')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (source, name, options) => {
        try {
            await forkCommand(source, name, options);
        }
        catch (error) {
            handleForkError(error);
        }
    });
    return cmd;
}
/**
 * Fork command implementation
 */
async function forkCommand(source, name, options) {
    // Validate name if provided
    if (name && !(0, fork_manager_1.isValidForkName)(name)) {
        console.error(chalk_1.default.red('✗ Invalid fork name'));
        console.error();
        console.error(chalk_1.default.yellow('Fork name must:'));
        console.error(chalk_1.default.yellow('  • Be alphanumeric with hyphens/underscores'));
        console.error(chalk_1.default.yellow('  • Not contain spaces or special characters'));
        process.exit(1);
    }
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Source: ${source}`));
        console.log(chalk_1.default.dim(`Source Type: ${options.source || 'registry'}`));
        if (name)
            console.log(chalk_1.default.dim(`New Name: ${name}`));
        if (options.path)
            console.log(chalk_1.default.dim(`Destination: ${options.path}`));
        console.log();
    }
    // For now, provide basic fork functionality
    // In a real implementation, this would:
    // 1. Locate the source component (from registry or installed)
    // 2. Load its metadata
    // 3. Generate fork name if not provided
    // 4. Create the fork using fork-manager
    // 5. Update metadata
    // 6. Optional: Initialize git tracking
    console.log();
    console.log(chalk_1.default.yellow('Fork operation requires component location'));
    console.log(chalk_1.default.dim('This feature will be fully implemented in a future release'));
    console.log();
    // Display what would happen
    console.log(chalk_1.default.bold('Fork Summary:'));
    console.log();
    console.log(`  Original Component: ${chalk_1.default.cyan(source)}`);
    console.log(`  Fork Name: ${chalk_1.default.cyan(name || '(auto-generated)')}`);
    if (options.path) {
        console.log(`  Destination: ${chalk_1.default.cyan(options.path)}`);
    }
    console.log(`  Description: ${options.description ? chalk_1.default.cyan(options.description) : chalk_1.default.dim('(unchanged)')}`);
    console.log();
    // Show fork tracking
    console.log(chalk_1.default.bold('Fork Metadata:'));
    console.log();
    console.log(chalk_1.default.dim('  • Fork creation date will be recorded'));
    console.log(chalk_1.default.dim('  • Original component reference will be preserved'));
    console.log(chalk_1.default.dim('  • Modifications will be tracked separately'));
    console.log();
    (0, formatters_1.formatSuccess)('Fork command available');
    console.log(chalk_1.default.dim('Use "fractary forge fork --help" for more information'));
    console.log();
    process.exit(0);
}
/**
 * Handle fork command errors
 */
function handleForkError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('not found')) {
        hints.push('Component not found');
        hints.push('Check component name and registry');
    }
    else if (err.message.includes('exists')) {
        hints.push('Fork name already exists');
        hints.push('Use a different name or specify --path');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied');
        hints.push('Check file/directory permissions');
    }
    (0, formatters_1.formatError)(err, 'Fork failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createForkCommand;
//# sourceMappingURL=fork.js.map