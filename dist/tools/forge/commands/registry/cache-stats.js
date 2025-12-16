"use strict";
/**
 * Forge Cache Stats Command
 *
 * Display cache statistics and detailed information.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheStatsCommand = createCacheStatsCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const cache_manager_1 = require("../../utils/cache-manager");
const formatters_1 = require("../../utils/formatters");
/**
 * Create cache stats command
 */
function createCacheStatsCommand() {
    const cmd = new commander_1.Command('stats');
    cmd
        .description('Show cache statistics and information')
        .option('--json', 'Output as JSON for scripting')
        .option('-v, --verbose', 'Show detailed breakdown')
        .option('--registries', 'Show only registry-specific stats')
        .action(async (options) => {
        try {
            await cacheStatsCommand(options);
        }
        catch (error) {
            handleStatsError(error);
        }
    });
    return cmd;
}
/**
 * Cache stats command implementation
 */
async function cacheStatsCommand(options) {
    const stats = await (0, cache_manager_1.getCacheStats)();
    const entries = await (0, cache_manager_1.getAllCacheEntries)();
    const metadata = await (0, cache_manager_1.loadCacheMetadata)();
    const cacheDir = (0, cache_manager_1.getCacheDirectory)();
    if (options.json) {
        // JSON output
        const jsonOutput = {
            cache_directory: cacheDir,
            total_entries: stats.entry_count,
            total_size_bytes: stats.size_bytes,
            total_size_mb: Number((stats.size_bytes / (1024 * 1024)).toFixed(2)),
            statistics: {
                total_hits: stats.total_cache_hits,
                total_misses: stats.total_cache_misses,
                hit_ratio: Number(stats.hit_ratio.toFixed(4)),
                avg_entry_age_seconds: stats.avg_entry_age_seconds,
            },
            registries: Object.entries(entries).map(([name, entry]) => ({
                name,
                file: entry.file,
                size_bytes: entry.size_bytes,
                size_kb: Number((entry.size_bytes / 1024).toFixed(2)),
                cached_at: entry.cached_at,
                expires_at: entry.expires_at,
                ttl_seconds: entry.ttl,
                hits: entry.hits,
                misses: entry.misses,
                hit_ratio: entry.hits + entry.misses > 0
                    ? Number((entry.hits / (entry.hits + entry.misses)).toFixed(4))
                    : 0,
            })),
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
        process.exit(0);
    }
    // Text output
    console.log();
    console.log(chalk_1.default.bold('Cache Statistics'));
    console.log();
    console.log(`  Location: ${chalk_1.default.cyan(cacheDir)}`);
    console.log(`  Total Entries: ${chalk_1.default.cyan(stats.entry_count.toString())}`);
    console.log(`  Total Size: ${chalk_1.default.cyan(`${(stats.size_bytes / 1024).toFixed(2)} KB`)} (${chalk_1.default.dim(`${(stats.size_bytes / (1024 * 1024)).toFixed(2)} MB`)})`);
    console.log();
    // Performance statistics
    console.log(chalk_1.default.bold('Performance'));
    console.log();
    const totalRequests = stats.total_cache_hits + stats.total_cache_misses;
    const hitRatioPercent = (stats.hit_ratio * 100).toFixed(1);
    console.log(`  Cache Hits: ${chalk_1.default.green(stats.total_cache_hits.toString())}`);
    console.log(`  Cache Misses: ${chalk_1.default.yellow(stats.total_cache_misses.toString())}`);
    console.log(`  Hit Ratio: ${chalk_1.default.cyan(`${hitRatioPercent}%`)} ${chalk_1.default.dim(`(${totalRequests} total requests)`)}`);
    console.log(`  Avg Entry Age: ${chalk_1.default.cyan(`${stats.avg_entry_age_seconds}s`)}`);
    console.log();
    // Registry-specific stats if requested or verbose
    if (!options.registries && (options.verbose || Object.keys(entries).length > 0)) {
        console.log(chalk_1.default.bold('Registry Cache Entries'));
        console.log();
        if (Object.keys(entries).length === 0) {
            console.log(chalk_1.default.dim('  No cached entries'));
        }
        else {
            const table = new cli_table3_1.default({
                head: [
                    'Registry',
                    'Size (KB)',
                    'Cached',
                    'Expires',
                    'Hits',
                    'Misses',
                    'Hit %',
                ],
                colWidths: [20, 12, 20, 20, 8, 8, 8],
                style: { head: [], border: ['grey'] },
            });
            // Sort by size (largest first)
            const sortedEntries = Object.entries(entries).sort(([, a], [, b]) => b.size_bytes - a.size_bytes);
            for (const [registryName, entry] of sortedEntries) {
                const cachedDate = new Date(entry.cached_at);
                const expiresDate = new Date(entry.expires_at);
                const now = new Date();
                const isExpired = expiresDate < now;
                const cachedStr = cachedDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const expiresStr = isExpired
                    ? chalk_1.default.red(`${expiresDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (exp)`)
                    : expiresDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                const totalHitsMisses = entry.hits + entry.misses;
                const hitPercent = totalHitsMisses > 0
                    ? ((entry.hits / totalHitsMisses) * 100).toFixed(0)
                    : '0';
                table.push([
                    registryName,
                    (entry.size_bytes / 1024).toFixed(1),
                    cachedStr,
                    expiresStr,
                    entry.hits.toString(),
                    entry.misses.toString(),
                    `${hitPercent}%`,
                ]);
            }
            console.log(table.toString());
        }
        console.log();
    }
    // Additional details in verbose mode
    if (options.verbose) {
        console.log(chalk_1.default.bold('Cache Metadata'));
        console.log();
        console.log(`  Metadata Version: ${chalk_1.default.cyan(metadata.version)}`);
        console.log(`  Created: ${chalk_1.default.dim(new Date(metadata.created_at).toLocaleString())}`);
        console.log(`  Last Updated: ${chalk_1.default.dim(new Date(metadata.last_updated).toLocaleString())}`);
        console.log();
    }
    process.exit(0);
}
/**
 * Handle stats command errors
 */
function handleStatsError(error) {
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
    (0, formatters_1.formatError)(err, 'Cache stats failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createCacheStatsCommand;
//# sourceMappingURL=cache-stats.js.map