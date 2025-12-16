"use strict";
/**
 * Forge Cache Clear Command
 *
 * Clear cached registry manifests by pattern or age.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheClearCommand = createCacheClearCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const cache_manager_1 = require("../../utils/cache-manager");
const formatters_1 = require("../../utils/formatters");
/**
 * Create cache clear command
 */
function createCacheClearCommand() {
    const cmd = new commander_1.Command('clear');
    cmd
        .description('Clear cached registry manifests')
        .argument('[pattern]', 'Optional registry name pattern to clear (regex)')
        .option('-o, --older-than <seconds>', 'Clear entries older than N seconds')
        .option('-f, --force', 'Skip confirmation prompt')
        .option('--dry-run', 'Show what would be cleared without deleting')
        .option('-v, --verbose', 'Show detailed clearing process')
        .action(async (pattern, options) => {
        try {
            await cacheClearCommand(pattern, options);
        }
        catch (error) {
            handleClearError(error);
        }
    });
    return cmd;
}
/**
 * Cache clear command implementation
 */
async function cacheClearCommand(pattern, options) {
    // Validate olderThan option if provided
    if (options.olderThan !== undefined) {
        const olderThan = typeof options.olderThan === 'string'
            ? parseInt(options.olderThan, 10)
            : options.olderThan;
        if (isNaN(olderThan) || olderThan < 0) {
            console.error(chalk_1.default.red('✗ Invalid --older-than value'));
            console.error(chalk_1.default.yellow('Must be a non-negative number of seconds'));
            process.exit(1);
        }
    }
    // Validate pattern if provided
    if (pattern) {
        try {
            new RegExp(pattern, 'i');
        }
        catch (error) {
            console.error(chalk_1.default.red('✗ Invalid regex pattern'));
            console.error(chalk_1.default.yellow(`Pattern: ${pattern}`));
            process.exit(1);
        }
    }
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Cache directory: ${(0, cache_manager_1.getCacheDirectory)()}`));
        if (pattern)
            console.log(chalk_1.default.dim(`Pattern: ${pattern}`));
        if (options.olderThan !== undefined)
            console.log(chalk_1.default.dim(`Older than: ${options.olderThan}s`));
        console.log();
    }
    // Get current cache entries
    const entries = await (0, cache_manager_1.getAllCacheEntries)();
    const entryNames = Object.keys(entries);
    if (entryNames.length === 0) {
        console.log(chalk_1.default.yellow('ℹ No cache entries found'));
        process.exit(0);
    }
    // Determine which entries would be cleared
    const toClear = [];
    for (const registryName of entryNames) {
        const entry = entries[registryName];
        let shouldClear = false;
        // Check pattern match
        if (pattern) {
            const regex = new RegExp(pattern, 'i');
            shouldClear = regex.test(registryName);
        }
        else if (options.olderThan !== undefined) {
            const olderThan = typeof options.olderThan === 'string'
                ? parseInt(options.olderThan, 10)
                : options.olderThan;
            const cacheTime = new Date(entry.cached_at);
            const now = new Date();
            const ageSeconds = (now.getTime() - cacheTime.getTime()) / 1000;
            shouldClear = ageSeconds > olderThan;
        }
        else {
            // Clear all entries if no pattern or age specified
            shouldClear = true;
        }
        if (shouldClear) {
            toClear.push(registryName);
        }
    }
    if (toClear.length === 0) {
        console.log(chalk_1.default.yellow('ℹ No cache entries match the criteria'));
        process.exit(0);
    }
    // Show what will be cleared
    if (options.verbose || !options.force) {
        console.log(chalk_1.default.bold(`Entries to be cleared (${toClear.length}):`));
        console.log();
        toClear.forEach((registryName) => {
            const entry = entries[registryName];
            const expired = (0, cache_manager_1.isEntryExpired)(entry);
            const status = expired ? chalk_1.default.yellow('(expired)') : chalk_1.default.green('(active)');
            const size = (entry.size_bytes / 1024).toFixed(2);
            console.log(`  ${chalk_1.default.cyan(registryName)} ${status}`);
            if (options.verbose) {
                console.log(chalk_1.default.dim(`    File: ${entry.file}`));
                console.log(chalk_1.default.dim(`    Size: ${size} KB`));
                console.log(chalk_1.default.dim(`    Cached: ${new Date(entry.cached_at).toLocaleString()}`));
                console.log(chalk_1.default.dim(`    Hits: ${entry.hits}, Misses: ${entry.misses}`));
            }
        });
        console.log();
    }
    // Show total size
    const totalSize = toClear.reduce((sum, name) => sum + entries[name].size_bytes, 0);
    console.log(chalk_1.default.dim(`Total size to clear: ${(totalSize / 1024).toFixed(2)} KB`));
    console.log();
    // Show dry-run notice
    if (options.dryRun) {
        console.log(chalk_1.default.cyan('(DRY RUN - no changes will be made)'));
        console.log();
    }
    // Confirm unless --force
    if (!options.force && !options.dryRun) {
        const answer = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Clear ${toClear.length} cache entr${toClear.length === 1 ? 'y' : 'ies'}?`,
                default: false,
            },
        ]);
        if (!answer.confirm) {
            console.log(chalk_1.default.dim('Cache clear cancelled'));
            process.exit(0);
        }
    }
    // Clear cache
    const olderThan = typeof options.olderThan === 'string'
        ? parseInt(options.olderThan, 10)
        : options.olderThan;
    const result = await (0, cache_manager_1.clearCache)({
        pattern,
        olderThan,
        dryRun: options.dryRun,
    });
    // Display result
    console.log();
    if (options.dryRun) {
        console.log(chalk_1.default.cyan(`Would clear ${result.cleared} cache entr${result.cleared === 1 ? 'y' : 'ies'}`));
    }
    else {
        if (result.cleared > 0) {
            (0, formatters_1.formatSuccess)(`Cleared ${result.cleared} cache entr${result.cleared === 1 ? 'y' : 'ies'}`);
        }
        else {
            console.log(chalk_1.default.yellow('ℹ No cache entries were cleared'));
        }
    }
    if (options.verbose && result.entries.length > 0) {
        console.log();
        console.log(chalk_1.default.dim('Cleared entries:'));
        result.entries.forEach((name) => {
            console.log(chalk_1.default.dim(`  • ${name}`));
        });
    }
    console.log();
    process.exit(0);
}
/**
 * Handle clear command errors
 */
function handleClearError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('cache')) {
        hints.push('Cache error occurred');
        hints.push('Check cache directory permissions');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied accessing cache');
        hints.push('Check file/directory permissions');
    }
    (0, formatters_1.formatError)(err, 'Cache clear failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createCacheClearCommand;
//# sourceMappingURL=cache-clear.js.map