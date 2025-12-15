"use strict";
/**
 * Cache clear command (v3.0)
 *
 * Clears cache entries using SDK's CacheManager
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheClearCommand = cacheClearCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../../get-client");
function cacheClearCommand() {
    const cmd = new commander_1.Command('clear');
    cmd
        .description('Clear cache entries')
        .option('--all', 'Clear entire cache')
        .option('--pattern <glob>', 'Clear entries matching URI pattern (e.g., "codex://fractary/*")')
        .option('--dry-run', 'Show what would be cleared without actually clearing')
        .action(async (options) => {
        try {
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            // Get stats before clearing (for reporting)
            const statsBefore = await client.getCacheStats();
            if (statsBefore.entryCount === 0) {
                console.log(chalk_1.default.yellow('Cache is already empty. Nothing to clear.'));
                return;
            }
            // Determine what to clear
            let pattern;
            if (options.all) {
                pattern = undefined; // Clear all
            }
            else if (options.pattern) {
                pattern = options.pattern;
            }
            else {
                console.log(chalk_1.default.yellow('Please specify what to clear:'));
                console.log(chalk_1.default.dim('  --all        Clear entire cache'));
                console.log(chalk_1.default.dim('  --pattern    Clear entries matching pattern (e.g., "codex://fractary/*")'));
                console.log('');
                console.log(chalk_1.default.dim('Examples:'));
                console.log(chalk_1.default.dim('  fractary codex cache clear --all'));
                console.log(chalk_1.default.dim('  fractary codex cache clear --pattern "codex://fractary/cli/*"'));
                return;
            }
            if (options.dryRun) {
                console.log(chalk_1.default.blue('Dry run - would clear:\n'));
                if (pattern) {
                    console.log(chalk_1.default.dim(`  Pattern: ${pattern}`));
                    console.log(chalk_1.default.dim(`  This would invalidate matching cache entries`));
                }
                else {
                    console.log(chalk_1.default.dim(`  All cache entries (${statsBefore.entryCount} entries)`));
                }
                console.log(chalk_1.default.dim(`\nTotal size: ${formatSize(statsBefore.totalSize)}`));
                return;
            }
            // Perform invalidation
            if (pattern) {
                console.log(chalk_1.default.blue(`Clearing cache entries matching pattern: ${pattern}\n`));
                await client.invalidateCache(pattern);
            }
            else {
                console.log(chalk_1.default.blue(`Clearing entire cache (${statsBefore.entryCount} entries)...\n`));
                await client.invalidateCache();
            }
            // Get stats after clearing
            const statsAfter = await client.getCacheStats();
            const entriesCleared = statsBefore.entryCount - statsAfter.entryCount;
            const sizeFreed = statsBefore.totalSize - statsAfter.totalSize;
            // Summary
            console.log(chalk_1.default.green(`✓ Cleared ${entriesCleared} entries (${formatSize(sizeFreed)} freed)`));
            if (statsAfter.entryCount > 0) {
                console.log(chalk_1.default.dim(`  Remaining: ${statsAfter.entryCount} entries (${formatSize(statsAfter.totalSize)})`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
/**
 * Format file size
 */
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=clear.js.map