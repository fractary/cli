"use strict";
/**
 * Cache clear command
 *
 * Clears cache entries based on criteria
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
exports.cacheClearCommand = cacheClearCommand;
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
 * Get cache file path for a URI
 */
function getCachePath(uri) {
    const hash = Buffer.from(uri).toString('base64').replace(/[/+=]/g, '_');
    return path.join(getCacheDir(), `${hash}.json`);
}
/**
 * Match URI against glob pattern
 */
function matchPattern(uri, pattern) {
    // Simple glob matching: * matches anything
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(uri);
}
function cacheClearCommand() {
    const cmd = new commander_1.Command('clear');
    cmd
        .description('Clear cache entries')
        .option('--all', 'Clear entire cache')
        .option('--expired', 'Clear only expired entries')
        .option('--pattern <glob>', 'Clear entries matching URI pattern (e.g., "codex://fractary/*")')
        .option('--dry-run', 'Show what would be cleared without actually clearing')
        .action(async (options) => {
        try {
            const cacheDir = getCacheDir();
            const indexPath = path.join(cacheDir, 'index.json');
            if (!await (0, file_scanner_1.fileExists)(indexPath)) {
                console.log(chalk_1.default.yellow('No cache index found. Nothing to clear.'));
                return;
            }
            const content = await (0, file_scanner_1.readFileContent)(indexPath);
            const index = JSON.parse(content);
            // Determine which entries to clear
            let toClear = [];
            if (options.all) {
                toClear = Object.keys(index.entries);
            }
            else if (options.expired) {
                toClear = Object.entries(index.entries)
                    .filter(([, entry]) => isExpired(entry))
                    .map(([uri]) => uri);
            }
            else if (options.pattern) {
                toClear = Object.keys(index.entries)
                    .filter(uri => matchPattern(uri, options.pattern));
            }
            else {
                console.log(chalk_1.default.yellow('Please specify what to clear:'));
                console.log(chalk_1.default.dim('  --all        Clear entire cache'));
                console.log(chalk_1.default.dim('  --expired    Clear only expired entries'));
                console.log(chalk_1.default.dim('  --pattern    Clear entries matching pattern'));
                return;
            }
            if (toClear.length === 0) {
                console.log(chalk_1.default.green('No entries to clear.'));
                return;
            }
            // Calculate size to be freed
            const sizeToFree = toClear.reduce((sum, uri) => {
                const entry = index.entries[uri];
                return sum + (entry?.size || 0);
            }, 0);
            if (options.dryRun) {
                console.log(chalk_1.default.blue('Dry run - would clear:\n'));
                for (const uri of toClear) {
                    console.log(chalk_1.default.dim(`  ${uri}`));
                }
                console.log(chalk_1.default.dim(`\nTotal: ${toClear.length} entries, ${formatSize(sizeToFree)}`));
                return;
            }
            console.log(chalk_1.default.blue(`Clearing ${toClear.length} cache entries...\n`));
            let cleared = 0;
            let errors = 0;
            for (const uri of toClear) {
                const cachePath = getCachePath(uri);
                try {
                    // Remove cache file
                    if (await (0, file_scanner_1.fileExists)(cachePath)) {
                        await fs.unlink(cachePath);
                    }
                    // Remove from index
                    delete index.entries[uri];
                    cleared++;
                    console.log(chalk_1.default.green('✓'), chalk_1.default.dim(uri));
                }
                catch (err) {
                    errors++;
                    console.log(chalk_1.default.red('✗'), chalk_1.default.dim(uri), chalk_1.default.red(`(${err.message})`));
                }
            }
            // Update index
            await (0, file_scanner_1.writeFileContent)(indexPath, JSON.stringify(index, null, 2));
            // Summary
            console.log('');
            console.log(chalk_1.default.green(`✓ Cleared ${cleared} entries (${formatSize(sizeToFree)})`));
            if (errors > 0) {
                console.log(chalk_1.default.red(`✗ ${errors} errors`));
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