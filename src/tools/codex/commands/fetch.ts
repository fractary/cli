/**
 * Fetch document command (v3.0)
 *
 * Retrieves documents by codex:// URI reference with:
 * - Cache-first retrieval for fast access
 * - TTL-based cache invalidation
 * - Multiple storage provider support
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileExists, readFileContent, writeFileContent } from '../utils/file-scanner';

// Try to import SDK functions
let parseReference: ((uri: string) => ParsedReference | null) | undefined;
let CacheManager: any;
let createCacheManager: (() => Promise<any>) | undefined;

interface ParsedReference {
  org: string;
  project: string;
  path: string;
  type?: string;
}

interface CacheEntry {
  uri: string;
  content: string;
  fetchedAt: string;
  expiresAt: string;
  source: string;
  contentHash: string;
}

try {
  const codex = require('@fractary/codex');
  parseReference = codex.parseReference;
  CacheManager = codex.CacheManager;
  createCacheManager = codex.createCacheManager;
} catch {
  // SDK functions not available, will use fallbacks
}

/**
 * Parse a codex:// URI manually (fallback)
 */
function parseCodexUri(uri: string): ParsedReference | null {
  // Format: codex://org/project/path/to/file.md
  const match = uri.match(/^codex:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) return null;

  return {
    org: match[1],
    project: match[2],
    path: match[3]
  };
}

/**
 * Get cache directory path
 */
function getCacheDir(): string {
  return path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache');
}

/**
 * Get cache file path for a URI
 */
function getCachePath(uri: string): string {
  const hash = Buffer.from(uri).toString('base64').replace(/[/+=]/g, '_');
  return path.join(getCacheDir(), `${hash}.json`);
}

/**
 * Calculate content hash
 */
function hashContent(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Check if cache entry is valid (not expired)
 */
function isCacheValid(entry: CacheEntry, ttlOverride?: number): boolean {
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
async function readCache(uri: string): Promise<CacheEntry | null> {
  const cachePath = getCachePath(uri);

  try {
    if (await fileExists(cachePath)) {
      const content = await readFileContent(cachePath);
      return JSON.parse(content) as CacheEntry;
    }
  } catch {
    // Cache read failed, will fetch fresh
  }

  return null;
}

/**
 * Write to cache
 */
async function writeCache(uri: string, content: string, ttl: number = 86400): Promise<void> {
  const cachePath = getCachePath(uri);
  const now = new Date();

  const entry: CacheEntry = {
    uri,
    content,
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
    source: 'github',
    contentHash: hashContent(content)
  };

  await writeFileContent(cachePath, JSON.stringify(entry, null, 2));

  // Update cache index
  await updateCacheIndex(uri, entry);
}

/**
 * Update cache index
 */
async function updateCacheIndex(uri: string, entry: CacheEntry): Promise<void> {
  const indexPath = path.join(getCacheDir(), 'index.json');

  try {
    let index: { entries: Record<string, any> } = { entries: {} };

    if (await fileExists(indexPath)) {
      const content = await readFileContent(indexPath);
      index = JSON.parse(content);
    }

    index.entries[uri] = {
      fetchedAt: entry.fetchedAt,
      expiresAt: entry.expiresAt,
      contentHash: entry.contentHash,
      size: entry.content.length
    };

    await writeFileContent(indexPath, JSON.stringify(index, null, 2));
  } catch {
    // Index update failed, non-critical
  }
}

/**
 * Fetch from GitHub (storage provider)
 */
async function fetchFromGitHub(ref: ParsedReference): Promise<string> {
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
  } catch (error: any) {
    throw new Error(`Failed to fetch from GitHub: ${error.message}`);
  }
}

export function fetchCommand(): Command {
  const cmd = new Command('fetch');

  cmd
    .description('Fetch a document by codex:// URI reference')
    .argument('<uri>', 'Codex URI (e.g., codex://org/project/docs/file.md)')
    .option('--bypass-cache', 'Skip cache and fetch directly from source')
    .option('--ttl <seconds>', 'Override default TTL (in seconds)', parseInt)
    .option('--json', 'Output as JSON with metadata')
    .option('--output <file>', 'Write content to file instead of stdout')
    .action(async (uri: string, options) => {
      try {
        // Validate URI format
        if (!uri.startsWith('codex://')) {
          console.error(chalk.red('Error: Invalid URI format'));
          console.log(chalk.dim('Expected: codex://org/project/path/to/file.md'));
          console.log(chalk.dim('Example: codex://fractary/codex/docs/api.md'));
          process.exit(1);
        }

        // Parse URI
        const parsed = parseReference ? parseReference(uri) : parseCodexUri(uri);

        if (!parsed) {
          console.error(chalk.red('Error: Could not parse URI'));
          console.log(chalk.dim(`URI: ${uri}`));
          process.exit(1);
        }

        let content: string;
        let fromCache = false;
        let cacheEntry: CacheEntry | null = null;

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
            console.error(chalk.dim(`Fetching from ${parsed.org}/${parsed.project}...`));
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
              fetchedAt: fromCache ? cacheEntry!.fetchedAt : new Date().toISOString(),
              expiresAt: fromCache ? cacheEntry!.expiresAt : new Date(Date.now() + (options.ttl || 86400) * 1000).toISOString(),
              contentLength: content.length,
              contentHash: hashContent(content)
            }
          };
          console.log(JSON.stringify(output, null, 2));
        } else if (options.output) {
          await fs.writeFile(options.output, content, 'utf-8');
          console.log(chalk.green('✓'), `Written to ${options.output}`);
          if (fromCache) {
            console.log(chalk.dim('  (from cache)'));
          }
        } else {
          // Print content directly
          if (fromCache && !options.bypassCache) {
            console.error(chalk.dim('(from cache)\n'));
          }
          console.log(content);
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
