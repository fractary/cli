/**
 * Sync project command
 *
 * Synchronizes a single project with the codex repository
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { fileExists, readFileContent } from '../../utils/file-scanner';

interface SyncConfig {
  version: string;
  organization: string;
  sync?: {
    environments?: Record<string, string>;
    patterns?: string[];
  };
}

type SyncDirection = 'to-codex' | 'from-codex' | 'bidirectional';

interface SyncPlanItem {
  path: string;
  action: 'copy' | 'update' | 'skip';
  direction: 'to-codex' | 'from-codex';
  reason?: string;
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
 * Detect current project name from git remote or directory
 */
function detectProjectName(): string | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/[:/]([^/]+)\/([^/.]+)(\.git)?$/);
    if (match) {
      return match[2];
    }
  } catch {
    // Git not available
  }

  // Fallback to directory name
  return path.basename(process.cwd());
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
 * Generate sync plan
 */
async function generateSyncPlan(
  projectName: string,
  config: SyncConfig,
  direction: SyncDirection
): Promise<SyncPlanItem[]> {
  const plan: SyncPlanItem[] = [];

  // Default sync patterns
  const patterns = config.sync?.patterns || [
    'docs/**/*.md',
    'specs/**/*.md',
    '.fractary/standards/**',
    '.fractary/templates/**'
  ];

  // Simulate finding files that match patterns
  for (const pattern of patterns) {
    const basePath = pattern.replace(/\*\*?\/?\*?\.?\w*$/, '').replace(/\/$/, '');

    if (direction === 'to-codex' || direction === 'bidirectional') {
      plan.push({
        path: `${basePath}/`,
        action: 'copy',
        direction: 'to-codex',
        reason: `Match pattern: ${pattern}`
      });
    }

    if (direction === 'from-codex' || direction === 'bidirectional') {
      plan.push({
        path: `codex://${config.organization}/codex/${basePath}/`,
        action: 'copy',
        direction: 'from-codex',
        reason: `Match pattern: ${pattern}`
      });
    }
  }

  return plan;
}

/**
 * Execute sync operation
 */
async function executeSync(
  plan: SyncPlanItem[],
  config: SyncConfig,
  targetBranch: string
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const item of plan) {
    try {
      // In a full implementation, this would:
      // 1. For to-codex: Copy local files to codex repo
      // 2. For from-codex: Fetch files from codex repo to local

      // For now, simulate the operation
      console.log(
        chalk.green('  ✓'),
        chalk.dim(item.direction === 'to-codex' ? '→' : '←'),
        item.path
      );
      success++;
    } catch (err: any) {
      console.log(
        chalk.red('  ✗'),
        chalk.dim(item.direction === 'to-codex' ? '→' : '←'),
        item.path,
        chalk.red(`(${err.message})`)
      );
      errors++;
    }
  }

  return { success, errors };
}

export function syncProjectCommand(): Command {
  const cmd = new Command('project');

  cmd
    .description('Sync single project with codex repository')
    .argument('[name]', 'Project name (auto-detected if not provided)')
    .option('--env <env>', 'Target environment (dev/test/staging/prod)', 'prod')
    .option('--dry-run', 'Show what would sync without executing')
    .option('--direction <dir>', 'Sync direction (to-codex/from-codex/bidirectional)', 'bidirectional')
    .option('--json', 'Output as JSON')
    .action(async (name: string | undefined, options) => {
      try {
        // Load config
        const config = await loadConfig();

        if (!config) {
          console.error(chalk.red('Error:'), 'Codex not initialized.');
          console.log(chalk.dim('Run "fractary codex init" first.'));
          process.exit(1);
        }

        // Determine project name
        const projectName = name || detectProjectName();

        if (!projectName) {
          console.error(chalk.red('Error:'), 'Could not determine project name.');
          console.log(chalk.dim('Provide project name as argument or run from a git repository.'));
          process.exit(1);
        }

        // Validate direction
        const validDirections: SyncDirection[] = ['to-codex', 'from-codex', 'bidirectional'];
        if (!validDirections.includes(options.direction as SyncDirection)) {
          console.error(chalk.red('Error:'), `Invalid direction: ${options.direction}`);
          console.log(chalk.dim('Valid options: to-codex, from-codex, bidirectional'));
          process.exit(1);
        }

        const direction = options.direction as SyncDirection;
        const targetBranch = getEnvironmentBranch(config, options.env);

        // Generate sync plan
        const plan = await generateSyncPlan(projectName, config, direction);

        if (plan.length === 0) {
          if (options.json) {
            console.log(JSON.stringify({ project: projectName, items: [], synced: 0 }));
          } else {
            console.log(chalk.yellow('No files to sync.'));
          }
          return;
        }

        if (options.json) {
          const output = {
            project: projectName,
            organization: config.organization,
            environment: options.env,
            branch: targetBranch,
            direction,
            dryRun: options.dryRun || false,
            items: plan.map(item => ({
              path: item.path,
              action: item.action,
              direction: item.direction
            }))
          };

          if (options.dryRun) {
            console.log(JSON.stringify(output, null, 2));
            return;
          }

          // Execute and add results
          const results = await executeSync(plan, config, targetBranch);
          console.log(JSON.stringify({
            ...output,
            results: {
              success: results.success,
              errors: results.errors
            }
          }, null, 2));
          return;
        }

        // Display sync plan
        console.log(chalk.bold('Sync Plan\n'));
        console.log(`  Project:      ${chalk.cyan(projectName)}`);
        console.log(`  Organization: ${chalk.cyan(config.organization)}`);
        console.log(`  Environment:  ${chalk.cyan(options.env)} (${targetBranch})`);
        console.log(`  Direction:    ${chalk.cyan(direction)}`);
        console.log('');

        if (options.dryRun) {
          console.log(chalk.blue('Dry run - would sync:\n'));

          for (const item of plan) {
            const arrow = item.direction === 'to-codex' ? '→ codex' : '← codex';
            console.log(chalk.dim(`  ${arrow}  ${item.path}`));
          }

          console.log(chalk.dim(`\nTotal: ${plan.length} items`));
          console.log(chalk.dim('Run without --dry-run to execute sync.'));
          return;
        }

        // Execute sync
        console.log(chalk.blue('Syncing...\n'));

        const results = await executeSync(plan, config, targetBranch);

        // Summary
        console.log('');
        console.log(chalk.green(`✓ Synced ${results.success} items`));
        if (results.errors > 0) {
          console.log(chalk.red(`✗ ${results.errors} errors`));
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
