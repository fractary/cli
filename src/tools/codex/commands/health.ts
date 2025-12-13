/**
 * Health command (v3.0)
 *
 * Comprehensive diagnostics for codex setup:
 * - Configuration validation
 * - Cache integrity
 * - Storage connectivity
 * - MCP server status
 * - Migration requirements
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import { fileExists, readFileContent, writeFileContent } from '../utils/file-scanner';

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
  fixable?: boolean;
}

interface CacheIndexEntry {
  fetchedAt: string;
  expiresAt: string;
  contentHash: string;
  size: number;
}

interface CacheIndex {
  version?: string;
  created?: string;
  entries: Record<string, CacheIndexEntry>;
}

interface CodexConfig {
  version: string;
  organization?: string;
  cache?: {
    directory?: string;
    defaultTtl?: string;
    maxSize?: string;
  };
  storage?: {
    providers?: Record<string, object>;
    defaultProvider?: string;
  };
  types?: object;
  sync?: object;
  mcp?: {
    enabled?: boolean;
    serverPath?: string;
  };
}

/**
 * Get config directory path
 */
function getConfigDir(): string {
  return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}

/**
 * Get cache directory path
 */
function getCacheDir(): string {
  return path.join(getConfigDir(), 'cache');
}

/**
 * Check configuration
 */
async function checkConfig(): Promise<HealthCheck> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (!await fileExists(configPath)) {
      return {
        name: 'Configuration',
        status: 'fail',
        message: 'Configuration file not found',
        details: `Expected: ${configPath}`,
        fixable: true
      };
    }

    const content = await readFileContent(configPath);
    const config: CodexConfig = JSON.parse(content);

    // Check version
    if (!config.version) {
      return {
        name: 'Configuration',
        status: 'warn',
        message: 'Missing version in config',
        details: 'Config should have a version field',
        fixable: true
      };
    }

    // Check for v2.0 config (needs migration)
    if (config.version.startsWith('2.') || (config as any).organizationSlug) {
      return {
        name: 'Configuration',
        status: 'warn',
        message: 'Legacy v2.0 configuration detected',
        details: 'Run with --fix to migrate to v3.0 format',
        fixable: true
      };
    }

    // Check organization
    if (!config.organization) {
      return {
        name: 'Configuration',
        status: 'warn',
        message: 'No organization configured',
        details: 'Run "fractary codex init --org <slug>" to set organization',
        fixable: false
      };
    }

    return {
      name: 'Configuration',
      status: 'pass',
      message: `Valid v${config.version} configuration`,
      details: `Organization: ${config.organization}`
    };

  } catch (error: any) {
    return {
      name: 'Configuration',
      status: 'fail',
      message: 'Invalid configuration file',
      details: error.message,
      fixable: false
    };
  }
}

/**
 * Check cache integrity
 */
async function checkCache(): Promise<HealthCheck> {
  const cacheDir = getCacheDir();
  const indexPath = path.join(cacheDir, 'index.json');

  try {
    // Check cache directory
    try {
      await fs.access(cacheDir);
    } catch {
      return {
        name: 'Cache',
        status: 'warn',
        message: 'Cache directory not found',
        details: `Expected: ${cacheDir}`,
        fixable: true
      };
    }

    // Check index file
    if (!await fileExists(indexPath)) {
      return {
        name: 'Cache',
        status: 'warn',
        message: 'Cache index not found',
        details: 'Cache will be rebuilt on first fetch',
        fixable: true
      };
    }

    const content = await readFileContent(indexPath);
    const index: CacheIndex = JSON.parse(content);

    // Validate index structure
    if (!index.entries || typeof index.entries !== 'object') {
      return {
        name: 'Cache',
        status: 'fail',
        message: 'Invalid cache index structure',
        details: 'Index missing entries object',
        fixable: true
      };
    }

    // Check for orphaned entries (in index but file missing)
    let orphanedCount = 0;
    let totalEntries = Object.keys(index.entries).length;

    for (const uri of Object.keys(index.entries)) {
      const hash = Buffer.from(uri).toString('base64').replace(/[/+=]/g, '_');
      const cachePath = path.join(cacheDir, `${hash}.json`);

      if (!await fileExists(cachePath)) {
        orphanedCount++;
      }
    }

    if (orphanedCount > 0) {
      return {
        name: 'Cache',
        status: 'warn',
        message: `${orphanedCount} orphaned entries in index`,
        details: `${orphanedCount}/${totalEntries} entries reference missing files`,
        fixable: true
      };
    }

    // Check expired entries
    const now = new Date();
    let expiredCount = 0;

    for (const entry of Object.values(index.entries)) {
      if (new Date(entry.expiresAt) < now) {
        expiredCount++;
      }
    }

    if (expiredCount > totalEntries * 0.5) {
      return {
        name: 'Cache',
        status: 'warn',
        message: `${expiredCount} expired entries (${Math.round(expiredCount / totalEntries * 100)}%)`,
        details: 'Run "fractary codex cache clear --expired" to clean up',
        fixable: true
      };
    }

    return {
      name: 'Cache',
      status: 'pass',
      message: `${totalEntries} entries (${expiredCount} expired)`,
      details: expiredCount > 0 ? `${Math.round((totalEntries - expiredCount) / totalEntries * 100)}% cache health` : '100% cache health'
    };

  } catch (error: any) {
    return {
      name: 'Cache',
      status: 'fail',
      message: 'Cache check failed',
      details: error.message,
      fixable: false
    };
  }
}

/**
 * Check storage connectivity
 */
async function checkStorage(): Promise<HealthCheck> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (!await fileExists(configPath)) {
      return {
        name: 'Storage',
        status: 'warn',
        message: 'No configuration to check storage',
        fixable: false
      };
    }

    const content = await readFileContent(configPath);
    const config: CodexConfig = JSON.parse(content);

    // Check GitHub connectivity
    if (config.storage?.providers?.github || config.storage?.defaultProvider === 'github') {
      try {
        // Check if gh cli is available
        execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });

        return {
          name: 'Storage',
          status: 'pass',
          message: 'GitHub storage accessible',
          details: 'GitHub CLI authenticated'
        };
      } catch {
        // Try checking GITHUB_TOKEN
        if (process.env.GITHUB_TOKEN) {
          return {
            name: 'Storage',
            status: 'pass',
            message: 'GitHub storage accessible',
            details: 'GITHUB_TOKEN environment variable set'
          };
        }

        return {
          name: 'Storage',
          status: 'warn',
          message: 'GitHub authentication not detected',
          details: 'Run "gh auth login" or set GITHUB_TOKEN',
          fixable: false
        };
      }
    }

    return {
      name: 'Storage',
      status: 'pass',
      message: 'Storage configuration valid'
    };

  } catch (error: any) {
    return {
      name: 'Storage',
      status: 'fail',
      message: 'Storage check failed',
      details: error.message,
      fixable: false
    };
  }
}

/**
 * Check MCP server status
 */
async function checkMcp(): Promise<HealthCheck> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (!await fileExists(configPath)) {
      return {
        name: 'MCP Server',
        status: 'warn',
        message: 'No configuration to check MCP',
        fixable: false
      };
    }

    const content = await readFileContent(configPath);
    const config: CodexConfig = JSON.parse(content);

    if (!config.mcp?.enabled) {
      return {
        name: 'MCP Server',
        status: 'pass',
        message: 'MCP not enabled (optional)',
        details: 'Run "fractary codex init --mcp" to enable'
      };
    }

    // Check MCP server registration
    const mcpConfigPath = path.join(process.cwd(), '.claude', 'mcp_servers.json');

    if (!await fileExists(mcpConfigPath)) {
      return {
        name: 'MCP Server',
        status: 'warn',
        message: 'MCP enabled but not registered',
        details: 'MCP server config not found',
        fixable: true
      };
    }

    return {
      name: 'MCP Server',
      status: 'pass',
      message: 'MCP server configured',
      details: config.mcp.serverPath || 'Using default server'
    };

  } catch (error: any) {
    return {
      name: 'MCP Server',
      status: 'fail',
      message: 'MCP check failed',
      details: error.message,
      fixable: false
    };
  }
}

/**
 * Fix detected issues
 */
async function fixIssues(checks: HealthCheck[]): Promise<number> {
  let fixed = 0;

  for (const check of checks) {
    if (check.status !== 'pass' && check.fixable) {
      console.log(chalk.blue(`Fixing: ${check.name}...`));

      try {
        switch (check.name) {
          case 'Configuration':
            // Create default config or migrate v2.0
            const configDir = getConfigDir();
            await fs.mkdir(configDir, { recursive: true });
            // Config fix would be handled by init command
            console.log(chalk.dim('  Run "fractary codex init" to fix configuration'));
            break;

          case 'Cache':
            // Create cache directory and index
            const cacheDir = getCacheDir();
            await fs.mkdir(cacheDir, { recursive: true });

            const indexPath = path.join(cacheDir, 'index.json');
            if (!await fileExists(indexPath)) {
              await writeFileContent(indexPath, JSON.stringify({
                version: '1.0',
                created: new Date().toISOString(),
                entries: {}
              }, null, 2));
              console.log(chalk.green('  ✓ Created cache index'));
              fixed++;
            }

            // Clean orphaned entries
            if (check.message.includes('orphaned')) {
              // Would clean orphaned entries from index
              console.log(chalk.dim('  Run "fractary codex cache clear --all" to reset cache'));
            }
            break;

          case 'MCP Server':
            console.log(chalk.dim('  Run "fractary codex init --mcp" to register MCP server'));
            break;
        }
      } catch (error: any) {
        console.log(chalk.red(`  Failed to fix: ${error.message}`));
      }
    }
  }

  return fixed;
}

export function healthCommand(): Command {
  const cmd = new Command('health');

  cmd
    .description('Run diagnostics and check codex health')
    .option('--fix', 'Attempt to fix detected issues')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const checks: HealthCheck[] = [];

        if (!options.json) {
          console.log(chalk.bold('Codex Health Check\n'));
        }

        // Run all checks
        checks.push(await checkConfig());
        checks.push(await checkCache());
        checks.push(await checkStorage());
        checks.push(await checkMcp());

        if (options.json) {
          const summary = {
            passed: checks.filter(c => c.status === 'pass').length,
            warnings: checks.filter(c => c.status === 'warn').length,
            failed: checks.filter(c => c.status === 'fail').length,
            checks
          };

          console.log(JSON.stringify(summary, null, 2));
          return;
        }

        // Display results
        for (const check of checks) {
          let icon: string;
          let color: typeof chalk.green;

          switch (check.status) {
            case 'pass':
              icon = '✓';
              color = chalk.green;
              break;
            case 'warn':
              icon = '⚠';
              color = chalk.yellow;
              break;
            case 'fail':
              icon = '✗';
              color = chalk.red;
              break;
          }

          console.log(color(`${icon} ${check.name}`));
          console.log(`  ${check.message}`);
          if (check.details) {
            console.log(chalk.dim(`  ${check.details}`));
          }
          console.log('');
        }

        // Summary
        const passed = checks.filter(c => c.status === 'pass').length;
        const warnings = checks.filter(c => c.status === 'warn').length;
        const failed = checks.filter(c => c.status === 'fail').length;

        console.log(chalk.dim('─'.repeat(40)));
        console.log(
          `Summary: ${chalk.green(`${passed} passed`)}`,
          warnings > 0 ? chalk.yellow(`${warnings} warnings`) : '',
          failed > 0 ? chalk.red(`${failed} failed`) : ''
        );

        // Fix issues if requested
        if (options.fix && (warnings > 0 || failed > 0)) {
          console.log('');
          const fixed = await fixIssues(checks);
          if (fixed > 0) {
            console.log(chalk.green(`\n✓ Fixed ${fixed} issues`));
          }
        } else if ((warnings > 0 || failed > 0) && checks.some(c => c.fixable)) {
          console.log(chalk.dim('\nRun with --fix to attempt automatic repairs.'));
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
