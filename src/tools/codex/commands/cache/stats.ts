/**
 * Cache stats command
 *
 * Display cache statistics and metrics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
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
 * Extract type from URI path
 */
function extractType(uri: string): string {
  const match = uri.match(/codex:\/\/[^/]+\/[^/]+\/([^/]+)\//);
  return match ? match[1] : 'unknown';
}

/**
 * Extract org/project from URI
 */
function extractOrgProject(uri: string): string {
  const match = uri.match(/codex:\/\/([^/]+\/[^/]+)\//);
  return match ? match[1] : 'unknown';
}

/**
 * Get actual disk usage of cache directory
 */
async function getDiskUsage(dirPath: string): Promise<number> {
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
  } catch {
    return 0;
  }
}

export function cacheStatsCommand(): Command {
  const cmd = new Command('stats');

  cmd
    .description('Display cache statistics')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const cacheDir = getCacheDir();
        const indexPath = path.join(cacheDir, 'index.json');

        if (!await fileExists(indexPath)) {
          if (options.json) {
            console.log(JSON.stringify({
              totalEntries: 0,
              totalSize: 0,
              diskUsage: 0,
              expiredCount: 0,
              byType: {},
              byProject: {}
            }));
          } else {
            console.log(chalk.yellow('No cache found.'));
            console.log(chalk.dim('Run "fractary codex init" to initialize.'));
          }
          return;
        }

        const content = await readFileContent(indexPath);
        const index: CacheIndex = JSON.parse(content);
        const entries = Object.entries(index.entries);

        // Calculate statistics
        const totalEntries = entries.length;
        const totalSize = entries.reduce((sum, [, e]) => sum + e.size, 0);
        const expiredCount = entries.filter(([, e]) => isExpired(e)).length;
        const freshCount = totalEntries - expiredCount;

        // Group by type
        const byType: Record<string, { count: number; size: number }> = {};
        for (const [uri, entry] of entries) {
          const type = extractType(uri);
          if (!byType[type]) {
            byType[type] = { count: 0, size: 0 };
          }
          byType[type].count++;
          byType[type].size += entry.size;
        }

        // Group by project
        const byProject: Record<string, { count: number; size: number }> = {};
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
        console.log(chalk.bold('Cache Statistics\n'));

        console.log(chalk.bold('Overview'));
        console.log(`  Total entries:  ${chalk.cyan(totalEntries.toString())}`);
        console.log(`  Content size:   ${chalk.cyan(formatSize(totalSize))}`);
        console.log(`  Disk usage:     ${chalk.cyan(formatSize(diskUsage))}`);
        console.log(`  Fresh entries:  ${chalk.green(freshCount.toString())}`);
        console.log(`  Expired:        ${expiredCount > 0 ? chalk.yellow(expiredCount.toString()) : chalk.dim('0')}`);
        console.log('');

        console.log(chalk.bold('Age Statistics'));
        console.log(`  Average age:    ${formatDuration(avgAge)}`);
        console.log(`  Oldest entry:   ${formatDuration(oldestAge)}`);
        console.log(`  Newest entry:   ${formatDuration(newestAge)}`);
        console.log('');

        if (Object.keys(byType).length > 0) {
          console.log(chalk.bold('By Type'));
          for (const [type, stats] of Object.entries(byType).sort((a, b) => b[1].count - a[1].count)) {
            console.log(`  ${type.padEnd(15)} ${stats.count.toString().padStart(4)} entries  ${formatSize(stats.size).padStart(10)}`);
          }
          console.log('');
        }

        if (Object.keys(byProject).length > 0) {
          console.log(chalk.bold('By Project'));
          for (const [project, stats] of Object.entries(byProject).sort((a, b) => b[1].count - a[1].count).slice(0, 10)) {
            console.log(`  ${project.padEnd(25)} ${stats.count.toString().padStart(4)} entries  ${formatSize(stats.size).padStart(10)}`);
          }
          if (Object.keys(byProject).length > 10) {
            console.log(chalk.dim(`  ... and ${Object.keys(byProject).length - 10} more projects`));
          }
          console.log('');
        }

        // Health indicator
        const healthPercent = totalEntries > 0 ? (freshCount / totalEntries) * 100 : 100;
        const healthColor = healthPercent > 80 ? chalk.green : healthPercent > 50 ? chalk.yellow : chalk.red;
        console.log(`Cache health: ${healthColor(`${healthPercent.toFixed(0)}% fresh`)}`);

        if (expiredCount > 0) {
          console.log(chalk.dim(`\nRun "fractary codex cache clear --expired" to clean up expired entries.`));
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
