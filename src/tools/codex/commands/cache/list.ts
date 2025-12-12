/**
 * Cache list command
 *
 * Lists all cached documents with metadata
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { fileExists, readFileContent } from '../../utils/file-scanner';

interface CacheIndexEntry {
  fetchedAt: string;
  expiresAt: string;
  contentHash: string;
  size: number;
}

interface CacheIndex {
  version: string;
  created: string;
  entries: Record<string, CacheIndexEntry>;
}

/**
 * Get cache directory path
 */
function getCacheDir(): string {
  return path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache');
}

/**
 * Check if entry is expired
 */
function isExpired(entry: CacheIndexEntry): boolean {
  return new Date() > new Date(entry.expiresAt);
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Extract type from URI path
 */
function extractType(uri: string): string {
  // codex://org/project/docs/file.md -> docs
  const match = uri.match(/codex:\/\/[^/]+\/[^/]+\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}

export function cacheListCommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List cached documents')
    .option('--type <type>', 'Filter by artifact type (docs, specs, logs, etc.)')
    .option('--expired', 'Show only expired entries')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const indexPath = path.join(getCacheDir(), 'index.json');

        if (!await fileExists(indexPath)) {
          if (options.json) {
            console.log(JSON.stringify({ entries: [], count: 0 }));
          } else {
            console.log(chalk.yellow('No cache index found.'));
            console.log(chalk.dim('Run "fractary codex init" to initialize, or fetch a document first.'));
          }
          return;
        }

        const content = await readFileContent(indexPath);
        const index: CacheIndex = JSON.parse(content);

        // Filter entries
        let entries = Object.entries(index.entries);

        if (options.type) {
          entries = entries.filter(([uri]) => extractType(uri) === options.type);
        }

        if (options.expired) {
          entries = entries.filter(([, entry]) => isExpired(entry));
        }

        // Sort by fetchedAt (most recent first)
        entries.sort(([, a], [, b]) =>
          new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
        );

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
          console.log(chalk.yellow('No cached entries found.'));
          if (options.type) {
            console.log(chalk.dim(`(filtered by type: ${options.type})`));
          }
          if (options.expired) {
            console.log(chalk.dim('(filtered by expired only)'));
          }
          return;
        }

        console.log(chalk.bold(`Cached Documents (${entries.length})\n`));

        for (const [uri, entry] of entries) {
          const expired = isExpired(entry);
          const type = extractType(uri);

          // URI with status
          if (expired) {
            console.log(chalk.red('●'), chalk.dim(uri), chalk.red('[EXPIRED]'));
          } else {
            console.log(chalk.green('●'), uri);
          }

          // Details
          console.log(chalk.dim(`    Type: ${type}  Size: ${formatSize(entry.size)}  Fetched: ${formatRelativeTime(entry.fetchedAt)}`));

          if (!expired) {
            const expiresIn = new Date(entry.expiresAt).getTime() - Date.now();
            const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));
            console.log(chalk.dim(`    Expires in: ${hoursLeft}h`));
          }

          console.log('');
        }

        // Summary
        const expiredCount = entries.filter(([, e]) => isExpired(e)).length;
        const totalSize = entries.reduce((sum, [, e]) => sum + e.size, 0);

        console.log(chalk.dim('─'.repeat(50)));
        console.log(chalk.dim(`Total: ${entries.length} entries, ${formatSize(totalSize)}`));
        if (expiredCount > 0) {
          console.log(chalk.yellow(`Expired: ${expiredCount} entries (run "fractary codex cache clear --expired" to clean)`));
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
