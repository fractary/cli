"use strict";
/**
 * Cache stats command (v3.0)
 *
 * Display cache statistics using SDK's CacheManager
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStatsCommand = cacheStatsCommand;
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
function cacheStatsCommand() {
    const cmd = new commander_1.Command('stats');
    cmd
        .description('Display cache statistics')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            // Get cache stats from SDK
            const stats = await client.getCacheStats();
            if (options.json) {
                console.log(JSON.stringify(stats, null, 2));
                return;
            }
            // Display formatted output
            console.log(chalk_1.default.bold('Cache Statistics\n'));
            console.log(chalk_1.default.bold('Overview'));
            console.log(`  Total entries:     ${chalk_1.default.cyan(stats.entryCount.toString())}`);
            console.log(`  Total size:        ${chalk_1.default.cyan(formatSize(stats.totalSize))}`);
            console.log(`  Fresh entries:     ${chalk_1.default.green(stats.freshCount.toString())}`);
            console.log(`  Stale entries:     ${stats.staleCount > 0 ? chalk_1.default.yellow(stats.staleCount.toString()) : chalk_1.default.dim('0')}`);
            console.log(`  Expired entries:   ${stats.expiredCount > 0 ? chalk_1.default.red(stats.expiredCount.toString()) : chalk_1.default.dim('0')}`);
            console.log('');
            // Health indicator based on fresh vs total ratio
            const healthPercent = stats.entryCount > 0 ? (stats.freshCount / stats.entryCount) * 100 : 100;
            const healthColor = healthPercent > 80 ? chalk_1.default.green : healthPercent > 50 ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`Cache health: ${healthColor(`${healthPercent.toFixed(0)}% fresh`)}`);
            if (stats.expiredCount > 0) {
                console.log(chalk_1.default.dim('\nRun "fractary codex cache clear --pattern <pattern>" to clean up entries.'));
            }
            if (stats.entryCount === 0) {
                console.log(chalk_1.default.dim('\nNo cached entries. Fetch some documents to populate the cache.'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=stats.js.map