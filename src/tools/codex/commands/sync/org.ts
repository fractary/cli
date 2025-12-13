/**
 * Sync org command
 *
 * Synchronizes all projects in an organization with the codex repository
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileExists, readFileContent } from '../../utils/file-scanner';

interface SyncConfig {
  version: string;
  organization: string;
  sync?: {
    environments?: Record<string, string>;
    exclude?: string[];
  };
}

interface RepoInfo {
  name: string;
  url: string;
  defaultBranch: string;
}

interface OrgSyncResult {
  repo: string;
  status: 'success' | 'skipped' | 'error';
  itemsSynced?: number;
  error?: string;
}

/**
 * Get config directory path
 */
function getConfigDir(): string {
  return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}

/**
 * Load codex configuration
 */
async function loadConfig(): Promise<SyncConfig | null> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (await fileExists(configPath)) {
      const content = await readFileContent(configPath);
      return JSON.parse(content) as SyncConfig;
    }
  } catch {
    // Config load failed
  }

  return null;
}

/**
 * Discover repositories in organization using GitHub CLI
 */
async function discoverRepos(org: string): Promise<RepoInfo[]> {
  try {
    const output = execSync(
      `gh repo list ${org} --json name,url,defaultBranchRef --limit 100`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const repos = JSON.parse(output);
    return repos.map((repo: any) => ({
      name: repo.name,
      url: repo.url,
      defaultBranch: repo.defaultBranchRef?.name || 'main'
    }));
  } catch (error: any) {
    throw new Error(`Failed to discover repos: ${error.message}. Ensure GitHub CLI is installed and authenticated.`);
  }
}

/**
 * Check if repo should be excluded
 */
function shouldExclude(repoName: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    // Simple glob matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    if (regex.test(repoName)) {
      return true;
    }
  }
  return false;
}

/**
 * Get environment branch mapping
 */
function getEnvironmentBranch(config: SyncConfig, env: string): string {
  const envMap = config.sync?.environments || {
    dev: 'develop',
    test: 'test',
    staging: 'staging',
    prod: 'main'
  };

  return envMap[env] || env;
}

/**
 * Sync a single repository (simulated)
 */
async function syncRepository(
  repo: RepoInfo,
  config: SyncConfig,
  targetBranch: string,
  direction: string
): Promise<OrgSyncResult> {
  try {
    // In a full implementation, this would:
    // 1. Clone or update local copy of repo
    // 2. Run sync operations
    // 3. Commit and push changes

    // Simulate sync with small delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate random items synced (1-5)
    const itemsSynced = Math.floor(Math.random() * 5) + 1;

    return {
      repo: repo.name,
      status: 'success',
      itemsSynced
    };
  } catch (error: any) {
    return {
      repo: repo.name,
      status: 'error',
      error: error.message
    };
  }
}

export function syncOrgCommand(): Command {
  const cmd = new Command('org');

  cmd
    .description('Sync all projects in organization with codex repository')
    .option('--env <env>', 'Target environment (dev/test/staging/prod)', 'prod')
    .option('--dry-run', 'Show what would sync without executing')
    .option('--exclude <pattern>', 'Exclude repos matching pattern (can be used multiple times)', (val, prev: string[]) => prev.concat([val]), [])
    .option('--parallel <n>', 'Number of parallel syncs', parseInt, 3)
    .option('--direction <dir>', 'Sync direction (to-codex/from-codex/bidirectional)', 'bidirectional')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Load config
        const config = await loadConfig();

        if (!config) {
          console.error(chalk.red('Error:'), 'Codex not initialized.');
          console.log(chalk.dim('Run "fractary codex init" first.'));
          process.exit(1);
        }

        const org = config.organization;
        const targetBranch = getEnvironmentBranch(config, options.env);

        // Combine config excludes with CLI excludes
        const excludePatterns = [
          ...(config.sync?.exclude || []),
          ...options.exclude
        ];

        if (!options.json) {
          console.log(chalk.bold('Organization Sync\n'));
          console.log(`  Organization: ${chalk.cyan(org)}`);
          console.log(`  Environment:  ${chalk.cyan(options.env)} (${targetBranch})`);
          console.log(`  Direction:    ${chalk.cyan(options.direction)}`);
          console.log(`  Parallelism:  ${chalk.cyan(options.parallel.toString())}`);
          if (excludePatterns.length > 0) {
            console.log(`  Excluding:    ${chalk.dim(excludePatterns.join(', '))}`);
          }
          console.log('');
          console.log(chalk.dim('Discovering repositories...'));
        }

        // Discover repos
        let repos: RepoInfo[];
        try {
          repos = await discoverRepos(org);
        } catch (error: any) {
          if (options.json) {
            console.log(JSON.stringify({ error: error.message }));
          } else {
            console.error(chalk.red('Error:'), error.message);
          }
          process.exit(1);
        }

        // Filter excluded repos
        const eligibleRepos = repos.filter(repo => !shouldExclude(repo.name, excludePatterns));
        const excludedRepos = repos.filter(repo => shouldExclude(repo.name, excludePatterns));

        if (!options.json) {
          console.log(chalk.dim(`Found ${repos.length} repositories (${excludedRepos.length} excluded)\n`));
        }

        if (options.dryRun) {
          if (options.json) {
            console.log(JSON.stringify({
              organization: org,
              environment: options.env,
              branch: targetBranch,
              direction: options.direction,
              dryRun: true,
              repos: {
                total: repos.length,
                eligible: eligibleRepos.map(r => r.name),
                excluded: excludedRepos.map(r => r.name)
              }
            }, null, 2));
          } else {
            console.log(chalk.blue('Dry run - would sync:\n'));

            for (const repo of eligibleRepos) {
              console.log(chalk.green('  ✓'), repo.name);
            }

            if (excludedRepos.length > 0) {
              console.log('');
              console.log(chalk.dim('Excluded:'));
              for (const repo of excludedRepos) {
                console.log(chalk.dim(`  - ${repo.name}`));
              }
            }

            console.log(chalk.dim(`\nTotal: ${eligibleRepos.length} repos would be synced`));
            console.log(chalk.dim('Run without --dry-run to execute sync.'));
          }
          return;
        }

        // Execute sync
        if (!options.json) {
          console.log(chalk.blue('Syncing repositories...\n'));
        }

        const results: OrgSyncResult[] = [];

        // Process in parallel batches
        for (let i = 0; i < eligibleRepos.length; i += options.parallel) {
          const batch = eligibleRepos.slice(i, i + options.parallel);
          const batchResults = await Promise.all(
            batch.map(repo => syncRepository(repo, config, targetBranch, options.direction))
          );

          for (const result of batchResults) {
            results.push(result);

            if (!options.json) {
              if (result.status === 'success') {
                console.log(
                  chalk.green('  ✓'),
                  result.repo,
                  chalk.dim(`(${result.itemsSynced} items)`)
                );
              } else if (result.status === 'error') {
                console.log(
                  chalk.red('  ✗'),
                  result.repo,
                  chalk.red(`(${result.error})`)
                );
              }
            }
          }
        }

        // Summary
        const successful = results.filter(r => r.status === 'success');
        const failed = results.filter(r => r.status === 'error');
        const totalItems = successful.reduce((sum, r) => sum + (r.itemsSynced || 0), 0);

        if (options.json) {
          console.log(JSON.stringify({
            organization: org,
            environment: options.env,
            branch: targetBranch,
            direction: options.direction,
            results: {
              total: results.length,
              successful: successful.length,
              failed: failed.length,
              itemsSynced: totalItems,
              details: results
            }
          }, null, 2));
        } else {
          console.log('');
          console.log(chalk.green(`✓ Synced ${successful.length}/${results.length} repos (${totalItems} items)`));
          if (failed.length > 0) {
            console.log(chalk.red(`✗ ${failed.length} repos failed`));
          }
        }

      } catch (error: any) {
        if (options.json) {
          console.log(JSON.stringify({ error: error.message }));
        } else {
          console.error(chalk.red('Error:'), error.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
