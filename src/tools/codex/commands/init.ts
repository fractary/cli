/**
 * Initialize Codex project command (v3.0)
 *
 * Sets up codex configuration with:
 * - Organization detection from git remote
 * - Cache directory initialization
 * - Type registry configuration
 * - Optional MCP server registration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { ensureDirectory, writeFileContent, fileExists } from '../utils/file-scanner';

// Try to import SDK functions, but handle gracefully if not available
let resolveOrganization: ((opts: { repoName?: string }) => string | null) | undefined;
let extractOrgFromRepoName: ((name: string) => string | null) | undefined;

try {
  const codex = require('@fractary/codex');
  resolveOrganization = codex.resolveOrganization;
  extractOrgFromRepoName = codex.extractOrgFromRepoName;
} catch {
  // SDK functions not available, will use fallbacks
}

/**
 * Get default v3.0 configuration
 */
function getDefaultV3Config(org: string): object {
  return {
    version: '3.0',
    organization: org,
    cache: {
      directory: '.fractary/plugins/codex/cache',
      defaultTtl: '24h',
      maxSize: '100MB',
      cleanupInterval: '1h'
    },
    storage: {
      providers: {
        github: {
          token: '${GITHUB_TOKEN}',
          baseUrl: 'https://api.github.com'
        }
      },
      defaultProvider: 'github'
    },
    types: {
      custom: []
    },
    sync: {
      environments: {
        dev: 'develop',
        staging: 'staging',
        prod: 'main'
      },
      defaultEnvironment: 'dev'
    },
    mcp: {
      enabled: false,
      port: 3000
    }
  };
}

/**
 * Extract org from git remote URL
 */
async function getOrgFromGitRemote(): Promise<string | null> {
  try {
    const { execSync } = require('child_process');
    const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf-8' }).trim();

    // Parse GitHub URL: git@github.com:org/repo.git or https://github.com/org/repo.git
    const sshMatch = remote.match(/git@github\.com:([^/]+)\//);
    const httpsMatch = remote.match(/github\.com\/([^/]+)\//);

    return sshMatch?.[1] || httpsMatch?.[1] || null;
  } catch {
    return null;
  }
}

export function initCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize Codex configuration with cache, storage, and type registry')
    .option('--org <slug>', 'Organization slug (e.g., "fractary")')
    .option('--mcp', 'Enable MCP server registration')
    .option('--force', 'Overwrite existing configuration')
    .action(async (options) => {
      try {
        console.log(chalk.blue('Initializing Codex v3.0...\n'));

        // Resolve organization
        let org = options.org;

        if (!org) {
          // Try git remote first
          org = await getOrgFromGitRemote();
        }

        if (!org && resolveOrganization) {
          org = resolveOrganization({
            repoName: path.basename(process.cwd())
          });
        }

        if (!org && extractOrgFromRepoName) {
          org = extractOrgFromRepoName(path.basename(process.cwd()));
        }

        if (!org) {
          // Default fallback
          org = path.basename(process.cwd()).split('-')[0] || 'default';
          console.log(chalk.yellow(`⚠ Could not detect organization, using: ${org}`));
          console.log(chalk.dim('  Use --org <slug> to specify explicitly\n'));
        } else {
          console.log(chalk.dim(`Organization: ${chalk.cyan(org)}\n`));
        }

        // Config path (v3.0 location)
        const configDir = path.join(process.cwd(), '.fractary', 'plugins', 'codex');
        const configPath = path.join(configDir, 'config.json');
        const configExists = await fileExists(configPath);

        if (configExists && !options.force) {
          console.log(chalk.yellow('⚠ Configuration already exists at .fractary/plugins/codex/config.json'));
          console.log(chalk.dim('Use --force to overwrite'));
          process.exit(1);
        }

        // Create directory structure
        console.log('Creating directory structure...');

        const dirs = [
          '.fractary/plugins/codex',
          '.fractary/plugins/codex/cache',
          '.fractary/plugins/codex/types'
        ];

        for (const dir of dirs) {
          await ensureDirectory(path.join(process.cwd(), dir));
          console.log(chalk.green('✓'), chalk.dim(dir + '/'));
        }

        // Create configuration file
        console.log('\nCreating configuration file...');

        const config = getDefaultV3Config(org);

        // Enable MCP if requested
        if (options.mcp) {
          (config as any).mcp.enabled = true;
        }

        const configContent = JSON.stringify(config, null, 2);
        await writeFileContent(configPath, configContent);
        console.log(chalk.green('✓'), chalk.dim('.fractary/plugins/codex/config.json'));

        // Create cache index file
        const cacheIndexPath = path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache', 'index.json');
        const cacheIndex = {
          version: '1.0',
          created: new Date().toISOString(),
          entries: {}
        };
        await writeFileContent(cacheIndexPath, JSON.stringify(cacheIndex, null, 2));
        console.log(chalk.green('✓'), chalk.dim('.fractary/plugins/codex/cache/index.json'));

        // Success message
        console.log(chalk.green('\n✓ Codex v3.0 initialized successfully!\n'));

        console.log(chalk.bold('Configuration:'));
        console.log(chalk.dim(`  Organization: ${org}`));
        console.log(chalk.dim(`  Cache: .fractary/plugins/codex/cache/`));
        console.log(chalk.dim(`  Config: .fractary/plugins/codex/config.json`));
        if (options.mcp) {
          console.log(chalk.dim(`  MCP Server: Enabled (port 3000)`));
        }

        console.log(chalk.bold('\nNext steps:'));
        console.log(chalk.dim('  1. Set your GitHub token: export GITHUB_TOKEN="your_token"'));
        console.log(chalk.dim('  2. Fetch a document: fractary codex fetch codex://org/project/path'));
        console.log(chalk.dim('  3. Check cache: fractary codex cache list'));
        console.log(chalk.dim('  4. Run diagnostics: fractary codex health'));

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
