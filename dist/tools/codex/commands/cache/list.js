"use strict";
/**
 * Cache list command
 *
 * Lists all cached documents with metadata
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
exports.cacheListCommand = cacheListCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
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
 * Format relative time
 */
function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1)
        return 'just now';
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}
/**
 * Extract type from URI path
 */
function extractType(uri) {
    // codex://org/project/docs/file.md -> docs
    const match = uri.match(/codex:\/\/[^/]+\/[^/]+\/([^/]+)\//);
    return match ? match[1] : 'unknown';
}
function cacheListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List cached documents')
        .option('--type <type>', 'Filter by artifact type (docs, specs, logs, etc.)')
        .option('--expired', 'Show only expired entries')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const indexPath = path.join(getCacheDir(), 'index.json');
            if (!await (0, file_scanner_1.fileExists)(indexPath)) {
                if (options.json) {
                    console.log(JSON.stringify({ entries: [], count: 0 }));
                }
                else {
                    console.log(chalk_1.default.yellow('No cache index found.'));
                    console.log(chalk_1.default.dim('Run "fractary codex init" to initialize, or fetch a document first.'));
                }
                return;
            }
            const content = await (0, file_scanner_1.readFileContent)(indexPath);
            const index = JSON.parse(content);
            // Filter entries
            let entries = Object.entries(index.entries);
            if (options.type) {
                entries = entries.filter(([uri]) => extractType(uri) === options.type);
            }
            if (options.expired) {
                entries = entries.filter(([, entry]) => isExpired(entry));
            }
            // Sort by fetchedAt (most recent first)
            entries.sort(([, a], [, b]) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
            if (options.json) {
                const output = {
                    count: entries.length,
                    entries: entries.map(([uri, entry]) => ({
                        uri,
                        type: extractType(uri),
                        ...entry,
                        expired: isExpired(entry)
                    }))
                };
                console.log(JSON.stringify(output, null, 2));
                return;
            }
            if (entries.length === 0) {
                console.log(chalk_1.default.yellow('No cached entries found.'));
                if (options.type) {
                    console.log(chalk_1.default.dim(`(filtered by type: ${options.type})`));
                }
                if (options.expired) {
                    console.log(chalk_1.default.dim('(filtered by expired only)'));
                }
                return;
            }
            console.log(chalk_1.default.bold(`Cached Documents (${entries.length})\n`));
            for (const [uri, entry] of entries) {
                const expired = isExpired(entry);
                const type = extractType(uri);
                // URI with status
                if (expired) {
                    console.log(chalk_1.default.red('●'), chalk_1.default.dim(uri), chalk_1.default.red('[EXPIRED]'));
                }
                else {
                    console.log(chalk_1.default.green('●'), uri);
                }
                // Details
                console.log(chalk_1.default.dim(`    Type: ${type}  Size: ${formatSize(entry.size)}  Fetched: ${formatRelativeTime(entry.fetchedAt)}`));
                if (!expired) {
                    const expiresIn = new Date(entry.expiresAt).getTime() - Date.now();
                    const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));
                    console.log(chalk_1.default.dim(`    Expires in: ${hoursLeft}h`));
                }
                console.log('');
            }
            // Summary
            const expiredCount = entries.filter(([, e]) => isExpired(e)).length;
            const totalSize = entries.reduce((sum, [, e]) => sum + e.size, 0);
            console.log(chalk_1.default.dim('─'.repeat(50)));
            console.log(chalk_1.default.dim(`Total: ${entries.length} entries, ${formatSize(totalSize)}`));
            if (expiredCount > 0) {
                console.log(chalk_1.default.yellow(`Expired: ${expiredCount} entries (run "fractary codex cache clear --expired" to clean)`));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=list.js.map