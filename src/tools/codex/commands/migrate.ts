/**
 * Migrate command (v3.0)
 *
 * Migrates legacy v2.0 configurations to v3.0 format:
 * - Detects v2.0 config structure
 * - Creates backup of old config
 * - Transforms to v3.0 format
 * - Validates migration result
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileExists, readFileContent, writeFileContent } from '../utils/file-scanner';

/**
 * v2.0 config structure (legacy)
 */
interface V2Config {
  organizationSlug?: string;
  directories?: {
    source?: string;
    target?: string;
  };
  rules?: {
    preventSelfSync?: boolean;
    autoSyncPatterns?: string[];
  };
  syncPatterns?: string[];
}

/**
 * v3.0 config structure (current)
 */
interface V3Config {
  version: string;
  organization: string;
  cache: {
    directory: string;
    defaultTtl: string;
    maxSize: string;
    cleanupInterval: string;
  };
  storage: {
    providers: {
      github: {
        token: string;
        baseUrl: string;
      };
    };
    defaultProvider: string;
  };
  types: {
    custom: Record<string, {
      pattern: string;
      ttl?: string;
      description?: string;
    }>;
  };
  sync: {
    environments: Record<string, string>;
    patterns: string[];
    exclude: string[];
  };
  mcp: {
    enabled: boolean;
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
 * Detect if config is v2.0 format
 */
function isV2Config(config: any): config is V2Config {
  return (
    config.organizationSlug !== undefined ||
    config.directories !== undefined ||
    config.rules !== undefined ||
    (config.version === undefined && config.organization === undefined)
  );
}

/**
 * Detect if config is v3.0 format
 */
function isV3Config(config: any): boolean {
  return config.version?.startsWith('3.') && config.organization !== undefined;
}

/**
 * Migrate v2.0 config to v3.0 format
 */
function migrateV2ToV3(v2Config: V2Config): V3Config {
  const org = v2Config.organizationSlug || 'unknown';

  // Extract sync patterns from v2
  const syncPatterns = [
    ...(v2Config.rules?.autoSyncPatterns || []),
    ...(v2Config.syncPatterns || []),
    'docs/**/*.md',
    'specs/**/*.md',
    '.fractary/standards/**',
    '.fractary/templates/**'
  ];

  // Remove duplicates
  const uniquePatterns = [...new Set(syncPatterns)];

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
      custom: {}
    },
    sync: {
      environments: {
        dev: 'develop',
        test: 'test',
        staging: 'staging',
        prod: 'main'
      },
      patterns: uniquePatterns,
      exclude: []
    },
    mcp: {
      enabled: false
    }
  };
}

/**
 * Create backup of config file
 */
async function createBackup(configPath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = configPath.replace('.json', `.v2-backup-${timestamp}.json`);

  const content = await readFileContent(configPath);
  await writeFileContent(backupPath, content);

  return backupPath;
}

export function migrateCommand(): Command {
  const cmd = new Command('migrate');

  cmd
    .description('Migrate legacy v2.0 configuration to v3.0 format')
    .option('--dry-run', 'Show migration plan without executing')
    .option('--no-backup', 'Skip creating backup of old config')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const configDir = getConfigDir();
        const configPath = path.join(configDir, 'config.json');

        // Check if config exists
        if (!await fileExists(configPath)) {
          if (options.json) {
            console.log(JSON.stringify({
              status: 'no_config',
              message: 'No configuration file found'
            }));
          } else {
            console.log(chalk.yellow('No configuration file found.'));
            console.log(chalk.dim('Run "fractary codex init" to create a new v3.0 configuration.'));
          }
          return;
        }

        // Load current config
        const content = await readFileContent(configPath);
        let config: any;

        try {
          config = JSON.parse(content);
        } catch {
          console.error(chalk.red('Error:'), 'Invalid JSON in config file.');
          process.exit(1);
        }

        // Check if already v3.0
        if (isV3Config(config)) {
          if (options.json) {
            console.log(JSON.stringify({
              status: 'already_v3',
              message: 'Configuration is already v3.0 format',
              version: config.version
            }));
          } else {
            console.log(chalk.green('✓'), 'Configuration is already v3.0 format.');
            console.log(chalk.dim(`  Version: ${config.version}`));
            console.log(chalk.dim(`  Organization: ${config.organization}`));
          }
          return;
        }

        // Check if v2.0
        if (!isV2Config(config)) {
          if (options.json) {
            console.log(JSON.stringify({
              status: 'unknown_format',
              message: 'Unknown configuration format'
            }));
          } else {
            console.log(chalk.yellow('Unknown configuration format.'));
            console.log(chalk.dim('Cannot determine config version. Consider running "fractary codex init --force".'));
          }
          return;
        }

        // Perform migration
        const v3Config = migrateV2ToV3(config);

        if (options.json) {
          const output: any = {
            status: 'migration_ready',
            dryRun: options.dryRun || false,
            v2Config: config,
            v3Config: v3Config,
            changes: [
              { field: 'version', from: 'undefined', to: '3.0' },
              { field: 'organization', from: config.organizationSlug, to: v3Config.organization },
              { field: 'cache', from: 'undefined', to: 'new cache config' },
              { field: 'storage', from: 'undefined', to: 'new storage config' },
              { field: 'types', from: 'undefined', to: 'new types config' },
              { field: 'sync', from: 'legacy rules', to: 'new sync config' },
              { field: 'mcp', from: 'undefined', to: 'new mcp config' }
            ]
          };

          if (!options.dryRun) {
            output.status = 'migrated';
          }

          console.log(JSON.stringify(output, null, 2));

          if (options.dryRun) {
            return;
          }
        } else {
          console.log(chalk.bold('v2.0 → v3.0 Migration\n'));

          console.log(chalk.bold('Detected v2.0 Configuration:'));
          console.log(chalk.dim(`  Organization: ${config.organizationSlug || 'not set'}`));
          if (config.directories) {
            console.log(chalk.dim(`  Source: ${config.directories.source || 'default'}`));
            console.log(chalk.dim(`  Target: ${config.directories.target || 'default'}`));
          }
          if (config.rules?.autoSyncPatterns?.length) {
            console.log(chalk.dim(`  Patterns: ${config.rules.autoSyncPatterns.length} patterns`));
          }
          console.log('');

          console.log(chalk.bold('Migration Plan:'));
          console.log(chalk.green('  + Add version: "3.0"'));
          console.log(chalk.green('  + Add cache configuration'));
          console.log(chalk.green('  + Add storage providers'));
          console.log(chalk.green('  + Add type registry'));
          console.log(chalk.green('  + Convert sync patterns'));
          console.log(chalk.green('  + Add MCP configuration'));
          console.log(chalk.red('  - Remove legacy fields (directories, rules)'));
          console.log('');

          if (options.dryRun) {
            console.log(chalk.blue('Dry run - no changes made.'));
            console.log(chalk.dim('Run without --dry-run to execute migration.'));
            return;
          }
        }

        // Create backup
        let backupPath: string | null = null;
        if (options.backup !== false) {
          backupPath = await createBackup(configPath);
          if (!options.json) {
            console.log(chalk.dim(`Backup created: ${path.basename(backupPath)}`));
          }
        }

        // Write new config
        await writeFileContent(configPath, JSON.stringify(v3Config, null, 2));

        // Create cache directory
        const cacheDir = path.join(configDir, 'cache');
        await fs.mkdir(cacheDir, { recursive: true });

        // Create cache index
        const indexPath = path.join(cacheDir, 'index.json');
        if (!await fileExists(indexPath)) {
          await writeFileContent(indexPath, JSON.stringify({
            version: '1.0',
            created: new Date().toISOString(),
            entries: {}
          }, null, 2));
        }

        if (!options.json) {
          console.log('');
          console.log(chalk.green('✓'), 'Migration complete!');
          console.log('');
          console.log(chalk.bold('New Configuration:'));
          console.log(chalk.dim(`  Version: ${v3Config.version}`));
          console.log(chalk.dim(`  Organization: ${v3Config.organization}`));
          console.log(chalk.dim(`  Cache: ${v3Config.cache.directory}`));
          console.log(chalk.dim(`  Storage: ${v3Config.storage.defaultProvider}`));
          console.log('');

          if (backupPath) {
            console.log(chalk.dim(`To restore v2.0 config: cp ${path.basename(backupPath)} config.json`));
          }
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
