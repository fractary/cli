/**
 * Cache clear command
 *
 * Clears cache entries based on criteria
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileExists, readFileContent, writeFileContent } from '../../utils/file-scanner';

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
 * Get cache file path for a URI
 */
function getCachePath(uri: string): string {
  const hash = Buffer.from(uri).toString('base64').replace(/[/+=]/g, '_');
  return path.join(getCacheDir(), `${hash}.json`);
}

/**
 * Match URI against glob pattern
 */
function matchPattern(uri: string, pattern: string): boolean {
  // Simple glob matching: * matches anything
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(uri);
}

export function cacheClearCommand(): Command {
  const cmd = new Command('clear');

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

        if (!await fileExists(indexPath)) {
          console.log(chalk.yellow('No cache index found. Nothing to clear.'));
          return;
        }

        const content = await readFileContent(indexPath);
        const index: CacheIndex = JSON.parse(content);

        // Determine which entries to clear
        let toClear: string[] = [];

        if (options.all) {
          toClear = Object.keys(index.entries);
        } else if (options.expired) {
          toClear = Object.entries(index.entries)
            .filter(([, entry]) => isExpired(entry))
            .map(([uri]) => uri);
        } else if (options.pattern) {
          toClear = Object.keys(index.entries)
            .filter(uri => matchPattern(uri, options.pattern));
        } else {
          console.log(chalk.yellow('Please specify what to clear:'));
          console.log(chalk.dim('  --all        Clear entire cache'));
          console.log(chalk.dim('  --expired    Clear only expired entries'));
          console.log(chalk.dim('  --pattern    Clear entries matching pattern'));
          return;
        }

        if (toClear.length === 0) {
          console.log(chalk.green('No entries to clear.'));
          return;
        }

        // Calculate size to be freed
        const sizeToFree = toClear.reduce((sum, uri) => {
          const entry = index.entries[uri];
          return sum + (entry?.size || 0);
        }, 0);

        if (options.dryRun) {
          console.log(chalk.blue('Dry run - would clear:\n'));
          for (const uri of toClear) {
            console.log(chalk.dim(`  ${uri}`));
          }
          console.log(chalk.dim(`\nTotal: ${toClear.length} entries, ${formatSize(sizeToFree)}`));
          return;
        }

        console.log(chalk.blue(`Clearing ${toClear.length} cache entries...\n`));

        let cleared = 0;
        let errors = 0;

        for (const uri of toClear) {
          const cachePath = getCachePath(uri);

          try {
            // Remove cache file
            if (await fileExists(cachePath)) {
              await fs.unlink(cachePath);
            }

            // Remove from index
            delete index.entries[uri];

            cleared++;
            console.log(chalk.green('✓'), chalk.dim(uri));
          } catch (err: any) {
            errors++;
            console.log(chalk.red('✗'), chalk.dim(uri), chalk.red(`(${err.message})`));
          }
        }

        // Update index
        await writeFileContent(indexPath, JSON.stringify(index, null, 2));

        // Summary
        console.log('');
        console.log(chalk.green(`✓ Cleared ${cleared} entries (${formatSize(sizeToFree)})`));
        if (errors > 0) {
          console.log(chalk.red(`✗ ${errors} errors`));
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
