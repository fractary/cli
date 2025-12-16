"use strict";
/**
 * Forge Merge Command
 *
 * Merge components from different sources with conflict resolution.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMergeCommand = createMergeCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const formatters_1 = require("../../utils/formatters");
/**
 * Create merge command
 */
function createMergeCommand() {
    const cmd = new commander_1.Command('merge');
    cmd
        .description('Merge components from different sources')
        .argument('<base>', 'Base component to merge into')
        .argument('<source>', 'Source component to merge from')
        .option('-s, --strategy <type>', 'Merge strategy: auto, local, upstream, manual (default: auto)', 'auto')
        .option('-b, --backup', 'Create backup before merging')
        .option('--dry-run', 'Show what would be merged without applying')
        .option('-f, --force', 'Skip validation')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (base, source, options) => {
        try {
            await mergeCommand(base, source, options);
        }
        catch (error) {
            handleMergeError(error);
        }
    });
    return cmd;
}
/**
 * Merge command implementation
 */
async function mergeCommand(base, source, options) {
    // Validate strategy
    const validStrategies = ['auto', 'local', 'upstream', 'manual'];
    if (!validStrategies.includes(options.strategy || 'auto')) {
        console.error(chalk_1.default.red('✗ Invalid merge strategy'));
        console.error();
        console.error(chalk_1.default.yellow('Valid strategies:'));
        console.error(chalk_1.default.yellow('  • auto: Most recent version wins'));
        console.error(chalk_1.default.yellow('  • local: Keep local component unchanged'));
        console.error(chalk_1.default.yellow('  • upstream: Use upstream version completely'));
        console.error(chalk_1.default.yellow('  • manual: Interactive conflict resolution'));
        process.exit(1);
    }
    const strategy = (options.strategy || 'auto');
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Base Component: ${base}`));
        console.log(chalk_1.default.dim(`Source Component: ${source}`));
        console.log(chalk_1.default.dim(`Strategy: ${strategy}`));
        console.log(chalk_1.default.dim(`Backup: ${options.backup ? 'enabled' : 'disabled'}`));
        if (options.dryRun) {
            console.log(chalk_1.default.dim('Mode: DRY RUN'));
        }
        console.log();
    }
    // Display strategy information
    console.log();
    console.log(chalk_1.default.bold('Merge Configuration:'));
    console.log();
    console.log(`  Base:     ${chalk_1.default.cyan(base)}`);
    console.log(`  Source:   ${chalk_1.default.cyan(source)}`);
    console.log(`  Strategy: ${chalk_1.default.cyan(strategy)}`);
    console.log();
    // Display strategy explanation
    console.log(chalk_1.default.bold('Merge Strategy Details:'));
    console.log();
    switch (strategy) {
        case 'auto':
            console.log(chalk_1.default.dim('  Auto merge: Most recently updated version will be used'));
            console.log(chalk_1.default.dim('  Decision based on component timestamps'));
            break;
        case 'local':
            console.log(chalk_1.default.dim('  Local merge: Current component will be preserved'));
            console.log(chalk_1.default.dim('  No changes will be applied to the base component'));
            break;
        case 'upstream':
            console.log(chalk_1.default.dim('  Upstream merge: Source component will replace base'));
            console.log(chalk_1.default.dim('  All local modifications will be overwritten'));
            break;
        case 'manual':
            console.log(chalk_1.default.dim('  Manual merge: Interactive conflict resolution'));
            console.log(chalk_1.default.dim('  You will be prompted for each conflict'));
            break;
    }
    console.log();
    if (options.dryRun) {
        console.log(chalk_1.default.cyan('(DRY RUN - no changes will be made)'));
        console.log();
    }
    // For now, show planned merge behavior
    console.log(chalk_1.default.bold('Planned Changes:'));
    console.log();
    const table = new cli_table3_1.default({
        head: ['Aspect', 'Action'],
        colWidths: [20, 50],
        style: { head: [], border: ['grey'] },
    });
    table.push(['Metadata', 'Will be compared and merged']);
    table.push(['Files', 'Will be compared for differences']);
    table.push(['Conflicts', 'Handled by ' + strategy + ' strategy']);
    table.push(['Backup', options.backup ? chalk_1.default.green('Created') : chalk_1.default.yellow('Not created')]);
    console.log(table.toString());
    console.log();
    // Display what would happen
    (0, formatters_1.formatSuccess)(`Merge ready for execution`);
    console.log();
    if (!options.dryRun) {
        console.log(chalk_1.default.dim('Use --dry-run to preview changes without applying'));
    }
    console.log(chalk_1.default.dim('Full merge functionality will be available in a future release'));
    console.log();
    process.exit(0);
}
/**
 * Handle merge command errors
 */
function handleMergeError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('not found')) {
        hints.push('Component not found');
        hints.push('Check component names and locations');
    }
    else if (err.message.includes('conflict')) {
        hints.push('Merge conflicts detected');
        hints.push('Use --strategy manual for interactive resolution');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied');
        hints.push('Check file/directory permissions');
    }
    (0, formatters_1.formatError)(err, 'Merge failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createMergeCommand;
//# sourceMappingURL=merge.js.map