"use strict";
/**
 * Cache stats command
 *
 * Display cache statistics and metrics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStatsCommand = cacheStatsCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const file_scanner_1 = require("../../utils/file-scanner");
/**
 * Get cache directory path
 */
function getCacheDir() {
    return path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache');
}
/**
 * Check if entry is expired
 */
function isExpired(entry) {
    return new Date() > new Date(entry.expiresAt);
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
/**
 * Extract type from URI path
 */
function extractType(uri) {
    const match = uri.match(/codex:\/\/[^/]+\/[^/]+\/([^/]+)\//);
    return match ? match[1] : 'unknown';
}
/**
 * Extract org/project from URI
 */
function extractOrgProject(uri) {
    const match = uri.match(/codex:\/\/([^/]+\/[^/]+)\//);
    return match ? match[1] : 'unknown';
}
/**
 * Get actual disk usage of cache directory
 */
async function getDiskUsage(dirPath) {
    try {
        const files = await fs.readdir(dirPath);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
                totalSize += stat.size;
            }
        }
        return totalSize;
    }
    catch {
        return 0;
    }
}
function cacheStatsCommand() {
    const cmd = new commander_1.Command('stats');
    cmd
        .description('Display cache statistics')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const cacheDir = getCacheDir();
            const indexPath = path.join(cacheDir, 'index.json');
            if (!await (0, file_scanner_1.fileExists)(indexPath)) {
                if (options.json) {
                    console.log(JSON.stringify({
                        totalEntries: 0,
                        totalSize: 0,
                        diskUsage: 0,
                        expiredCount: 0,
                        byType: {},
                        byProject: {}
                    }));
                }
                else {
                    console.log(chalk_1.default.yellow('No cache found.'));
                    console.log(chalk_1.default.dim('Run "fractary codex init" to initialize.'));
                }
                return;
            }
            const content = await (0, file_scanner_1.readFileContent)(indexPath);
            const index = JSON.parse(content);
            const entries = Object.entries(index.entries);
            // Calculate statistics
            const totalEntries = entries.length;
            const totalSize = entries.reduce((sum, [, e]) => sum + e.size, 0);
            const expiredCount = entries.filter(([, e]) => isExpired(e)).length;
            const freshCount = totalEntries - expiredCount;
            // Group by type
            const byType = {};
            for (const [uri, entry] of entries) {
                const type = extractType(uri);
                if (!byType[type]) {
                    byType[type] = { count: 0, size: 0 };
                }
                byType[type].count++;
                byType[type].size += entry.size;
            }
            // Group by project
            const byProject = {};
            for (const [uri, entry] of entries) {
                const project = extractOrgProject(uri);
                if (!byProject[project]) {
                    byProject[project] = { count: 0, size: 0 };
                }
                byProject[project].count++;
                byProject[project].size += entry.size;
            }
            // Get actual disk usage
            const diskUsage = await getDiskUsage(cacheDir);
            // Age statistics
            const ages = entries.map(([, e]) => Date.now() - new Date(e.fetchedAt).getTime());
            const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
            const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;
            const newestAge = ages.length > 0 ? Math.min(...ages) : 0;
            if (options.json) {
                console.log(JSON.stringify({
                    totalEntries,
                    totalSize,
                    diskUsage,
                    expiredCount,
                    freshCount,
                    averageAgeMs: avgAge,
                    oldestAgeMs: oldestAge,
                    newestAgeMs: newestAge,
                    byType,
                    byProject,
                    cacheCreated: index.created
                }, null, 2));
                return;
            }
            // Display formatted output
            console.log(chalk_1.default.bold('Cache Statistics\n'));
            console.log(chalk_1.default.bold('Overview'));
            console.log(`  Total entries:  ${chalk_1.default.cyan(totalEntries.toString())}`);
            console.log(`  Content size:   ${chalk_1.default.cyan(formatSize(totalSize))}`);
            console.log(`  Disk usage:     ${chalk_1.default.cyan(formatSize(diskUsage))}`);
            console.log(`  Fresh entries:  ${chalk_1.default.green(freshCount.toString())}`);
            console.log(`  Expired:        ${expiredCount > 0 ? chalk_1.default.yellow(expiredCount.toString()) : chalk_1.default.dim('0')}`);
            console.log('');
            console.log(chalk_1.default.bold('Age Statistics'));
            console.log(`  Average age:    ${formatDuration(avgAge)}`);
            console.log(`  Oldest entry:   ${formatDuration(oldestAge)}`);
            console.log(`  Newest entry:   ${formatDuration(newestAge)}`);
            console.log('');
            if (Object.keys(byType).length > 0) {
                console.log(chalk_1.default.bold('By Type'));
                for (const [type, stats] of Object.entries(byType).sort((a, b) => b[1].count - a[1].count)) {
                    console.log(`  ${type.padEnd(15)} ${stats.count.toString().padStart(4)} entries  ${formatSize(stats.size).padStart(10)}`);
                }
                console.log('');
            }
            if (Object.keys(byProject).length > 0) {
                console.log(chalk_1.default.bold('By Project'));
                for (const [project, stats] of Object.entries(byProject).sort((a, b) => b[1].count - a[1].count).slice(0, 10)) {
                    console.log(`  ${project.padEnd(25)} ${stats.count.toString().padStart(4)} entries  ${formatSize(stats.size).padStart(10)}`);
                }
                if (Object.keys(byProject).length > 10) {
                    console.log(chalk_1.default.dim(`  ... and ${Object.keys(byProject).length - 10} more projects`));
                }
                console.log('');
            }
            // Health indicator
            const healthPercent = totalEntries > 0 ? (freshCount / totalEntries) * 100 : 100;
            const healthColor = healthPercent > 80 ? chalk_1.default.green : healthPercent > 50 ? chalk_1.default.yellow : chalk_1.default.red;
            console.log(`Cache health: ${healthColor(`${healthPercent.toFixed(0)}% fresh`)}`);
            if (expiredCount > 0) {
                console.log(chalk_1.default.dim(`\nRun "fractary codex cache clear --expired" to clean up expired entries.`));
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
 * Format duration in human-readable form
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ${hours % 24}h`;
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m`;
    return `${seconds}s`;
}
//# sourceMappingURL=stats.js.map