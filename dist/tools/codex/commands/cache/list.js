"use strict";
/**
 * Cache list command (v3.0)
 *
 * Lists cache information using SDK's CacheManager
 *
 * Note: The SDK's CacheManager doesn't expose individual cache entries.
 * Use 'cache stats' for detailed cache statistics.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheListCommand = cacheListCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../../get-client");
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
function cacheListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List cache information')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            // Get cache stats from SDK
            const stats = await client.getCacheStats();
            if (stats.entryCount === 0) {
                if (options.json) {
                    console.log(JSON.stringify({ entries: 0, message: 'Cache is empty' }));
                }
                else {
                    console.log(chalk_1.default.yellow('Cache is empty.'));
                    console.log(chalk_1.default.dim('Fetch some documents to populate the cache.'));
                }
                return;
            }
            if (options.json) {
                console.log(JSON.stringify({
                    entryCount: stats.entryCount,
                    totalSize: stats.totalSize,
                    freshCount: stats.freshCount,
                    staleCount: stats.staleCount,
                    expiredCount: stats.expiredCount
                }, null, 2));
                return;
            }
            // Display cache overview
            console.log(chalk_1.default.bold('Cache Overview\n'));
            console.log(chalk_1.default.bold('Entries:'));
            console.log(`  Total:    ${chalk_1.default.cyan(stats.entryCount.toString())} entries`);
            console.log(`  Fresh:    ${chalk_1.default.green(stats.freshCount.toString())} entries`);
            console.log(`  Stale:    ${stats.staleCount > 0 ? chalk_1.default.yellow(stats.staleCount.toString()) : chalk_1.default.dim('0')} entries`);
            console.log(`  Expired:  ${stats.expiredCount > 0 ? chalk_1.default.red(stats.expiredCount.toString()) : chalk_1.default.dim('0')} entries`);
            console.log('');
            console.log(chalk_1.default.bold('Storage:'));
            console.log(`  Total size: ${chalk_1.default.cyan(formatSize(stats.totalSize))}`);
            console.log('');
            // Health indicator
            const healthPercent = stats.entryCount > 0 ? (stats.freshCount / stats.entryCount) * 100 : 100;
            const healthColor = healthPercent > 80 ? chalk_1.default.green : healthPercent > 50 ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`Cache health: ${healthColor(`${healthPercent.toFixed(0)}% fresh`)}`);
            console.log('');
            console.log(chalk_1.default.dim('Note: Individual cache entries are managed by the SDK.'));
            console.log(chalk_1.default.dim('Use "fractary codex cache stats" for detailed statistics.'));
            console.log(chalk_1.default.dim('Use "fractary codex cache clear" to clear cache entries.'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=list.js.map