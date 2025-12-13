"use strict";
/**
 * Fetch document command (v3.0)
 *
 * Retrieves documents by codex:// URI reference with:
 * - Cache-first retrieval for fast access
 * - TTL-based cache invalidation
 * - Multiple storage provider support
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
exports.fetchCommand = fetchCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const file_scanner_1 = require("../utils/file-scanner");
// Try to import SDK functions
let parseReference;
let CacheManager;
let createCacheManager;
try {
    const codex = require('@fractary/codex');
    parseReference = codex.parseReference;
    CacheManager = codex.CacheManager;
    createCacheManager = codex.createCacheManager;
}
catch {
    // SDK functions not available, will use fallbacks
}
/**
 * Parse a codex:// URI manually (fallback)
 */
function parseCodexUri(uri) {
    // Format: codex://org/project/path/to/file.md
    const match = uri.match(/^codex:\/\/([^/]+)\/([^/]+)\/(.+)$/);
    if (!match)
        return null;
    return {
        org: match[1],
        project: match[2],
        path: match[3]
    };
}
/**
 * Get cache directory path
 */
function getCacheDir() {
    return path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache');
}
/**
 * Get cache file path for a URI
 */
function getCachePath(uri) {
    const hash = Buffer.from(uri).toString('base64').replace(/[/+=]/g, '_');
    return path.join(getCacheDir(), `${hash}.json`);
}
/**
 * Calculate content hash
 */
function hashContent(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}
/**
 * Check if cache entry is valid (not expired)
 */
function isCacheValid(entry, ttlOverride) {
    const now = new Date();
    const expiresAt = new Date(entry.expiresAt);
    if (ttlOverride !== undefined) {
        const fetchedAt = new Date(entry.fetchedAt);
        const overrideExpiry = new Date(fetchedAt.getTime() + ttlOverride * 1000);
        return now < overrideExpiry;
    }
    return now < expiresAt;
}
/**
 * Read from cache
 */
async function readCache(uri) {
    const cachePath = getCachePath(uri);
    try {
        if (await (0, file_scanner_1.fileExists)(cachePath)) {
            const content = await (0, file_scanner_1.readFileContent)(cachePath);
            return JSON.parse(content);
        }
    }
    catch {
        // Cache read failed, will fetch fresh
    }
    return null;
}
/**
 * Write to cache
 */
async function writeCache(uri, content, ttl = 86400) {
    const cachePath = getCachePath(uri);
    const now = new Date();
    const entry = {
        uri,
        content,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
        source: 'github',
        contentHash: hashContent(content)
    };
    await (0, file_scanner_1.writeFileContent)(cachePath, JSON.stringify(entry, null, 2));
    // Update cache index
    await updateCacheIndex(uri, entry);
}
/**
 * Update cache index
 */
async function updateCacheIndex(uri, entry) {
    const indexPath = path.join(getCacheDir(), 'index.json');
    try {
        let index = { entries: {} };
        if (await (0, file_scanner_1.fileExists)(indexPath)) {
            const content = await (0, file_scanner_1.readFileContent)(indexPath);
            index = JSON.parse(content);
        }
        index.entries[uri] = {
            fetchedAt: entry.fetchedAt,
            expiresAt: entry.expiresAt,
            contentHash: entry.contentHash,
            size: entry.content.length
        };
        await (0, file_scanner_1.writeFileContent)(indexPath, JSON.stringify(index, null, 2));
    }
    catch {
        // Index update failed, non-critical
    }
}
/**
 * Fetch from GitHub (storage provider)
 */
async function fetchFromGitHub(ref) {
    const { execSync } = require('child_process');
    // Build GitHub raw URL
    const url = `https://raw.githubusercontent.com/${ref.org}/${ref.project}/main/${ref.path}`;
    try {
        // Use curl to fetch
        const content = execSync(`curl -sL "${url}"`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        if (content.includes('404: Not Found')) {
            throw new Error(`Document not found: ${ref.path}`);
        }
        return content;
    }
    catch (error) {
        throw new Error(`Failed to fetch from GitHub: ${error.message}`);
    }
}
function fetchCommand() {
    const cmd = new commander_1.Command('fetch');
    cmd
        .description('Fetch a document by codex:// URI reference')
        .argument('<uri>', 'Codex URI (e.g., codex://org/project/docs/file.md)')
        .option('--bypass-cache', 'Skip cache and fetch directly from source')
        .option('--ttl <seconds>', 'Override default TTL (in seconds)', parseInt)
        .option('--json', 'Output as JSON with metadata')
        .option('--output <file>', 'Write content to file instead of stdout')
        .action(async (uri, options) => {
        try {
            // Validate URI format
            if (!uri.startsWith('codex://')) {
                console.error(chalk_1.default.red('Error: Invalid URI format'));
                console.log(chalk_1.default.dim('Expected: codex://org/project/path/to/file.md'));
                console.log(chalk_1.default.dim('Example: codex://fractary/codex/docs/api.md'));
                process.exit(1);
            }
            // Parse URI
            const parsed = parseReference ? parseReference(uri) : parseCodexUri(uri);
            if (!parsed) {
                console.error(chalk_1.default.red('Error: Could not parse URI'));
                console.log(chalk_1.default.dim(`URI: ${uri}`));
                process.exit(1);
            }
            let content;
            let fromCache = false;
            let cacheEntry = null;
            // Check cache first (unless bypassed)
            if (!options.bypassCache) {
                cacheEntry = await readCache(uri);
                if (cacheEntry && isCacheValid(cacheEntry, options.ttl)) {
                    content = cacheEntry.content;
                    fromCache = true;
                }
            }
            // Fetch from source if not in cache
            if (!fromCache) {
                if (!options.json) {
                    console.error(chalk_1.default.dim(`Fetching from ${parsed.org}/${parsed.project}...`));
                }
                content = await fetchFromGitHub(parsed);
                // Update cache
                const ttl = options.ttl || 86400; // Default 24 hours
                await writeCache(uri, content, ttl);
            }
            // Output
            if (options.json) {
                const output = {
                    uri,
                    parsed: {
                        org: parsed.org,
                        project: parsed.project,
                        path: parsed.path
                    },
                    content,
                    metadata: {
                        fromCache,
                        fetchedAt: fromCache ? cacheEntry.fetchedAt : new Date().toISOString(),
                        expiresAt: fromCache ? cacheEntry.expiresAt : new Date(Date.now() + (options.ttl || 86400) * 1000).toISOString(),
                        contentLength: content.length,
                        contentHash: hashContent(content)
                    }
                };
                console.log(JSON.stringify(output, null, 2));
            }
            else if (options.output) {
                await fs.writeFile(options.output, content, 'utf-8');
                console.log(chalk_1.default.green('✓'), `Written to ${options.output}`);
                if (fromCache) {
                    console.log(chalk_1.default.dim('  (from cache)'));
                }
            }
            else {
                // Print content directly
                if (fromCache && !options.bypassCache) {
                    console.error(chalk_1.default.dim('(from cache)\n'));
                }
                console.log(content);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=fetch.js.map