/**
 * Types add command
 *
 * Registers a custom artifact type
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { fileExists, readFileContent, writeFileContent } from '../../utils/file-scanner';

/**
 * Built-in type names (cannot be overridden)
 */
const BUILT_IN_TYPE_NAMES = ['docs', 'specs', 'logs', 'standards', 'templates', 'state'];

interface TypeConfig {
  pattern: string;
  description?: string;
  ttl?: string;
}

interface CodexConfig {
  version: string;
  organization?: string;
  cache?: object;
  storage?: object;
  types?: {
    custom?: Record<string, TypeConfig>;
  };
  sync?: object;
  mcp?: object;
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
async function loadConfig(): Promise<CodexConfig | null> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (await fileExists(configPath)) {
      const content = await readFileContent(configPath);
      return JSON.parse(content) as CodexConfig;
    }
  } catch {
    // Config load failed
  }

  return null;
}

/**
 * Save codex configuration
 */
async function saveConfig(config: CodexConfig): Promise<void> {
  const configPath = path.join(getConfigDir(), 'config.json');
  await writeFileContent(configPath, JSON.stringify(config, null, 2));
}

/**
 * Validate type name
 */
function isValidTypeName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

/**
 * Parse TTL string
 */
function isValidTtl(ttl: string): boolean {
  return /^\d+[smhd]$/.test(ttl);
}

export function typesAddCommand(): Command {
  const cmd = new Command('add');

  cmd
    .description('Add a custom artifact type')
    .argument('<name>', 'Type name (lowercase, alphanumeric with hyphens)')
    .requiredOption('--pattern <glob>', 'File pattern (glob syntax)')
    .option('--ttl <duration>', 'Cache TTL (e.g., "24h", "7d")', '24h')
    .option('--description <text>', 'Type description')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      try {
        // Validate type name
        if (!isValidTypeName(name)) {
          console.error(chalk.red('Error:'), 'Invalid type name.');
          console.log(chalk.dim('Type name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.'));
          process.exit(1);
        }

        // Check for built-in type conflict
        if (BUILT_IN_TYPE_NAMES.includes(name)) {
          console.error(chalk.red('Error:'), `Cannot override built-in type "${name}".`);
          console.log(chalk.dim('Built-in types: ' + BUILT_IN_TYPE_NAMES.join(', ')));
          process.exit(1);
        }

        // Validate TTL
        if (!isValidTtl(options.ttl)) {
          console.error(chalk.red('Error:'), 'Invalid TTL format.');
          console.log(chalk.dim('Expected format: <number><unit> where unit is s (seconds), m (minutes), h (hours), or d (days)'));
          console.log(chalk.dim('Examples: 30m, 24h, 7d'));
          process.exit(1);
        }

        // Load existing config
        const config = await loadConfig();

        if (!config) {
          console.error(chalk.red('Error:'), 'Codex not initialized.');
          console.log(chalk.dim('Run "fractary codex init" first.'));
          process.exit(1);
        }

        // Initialize types.custom if needed
        if (!config.types) {
          config.types = {};
        }
        if (!config.types.custom) {
          config.types.custom = {};
        }

        // Check if type already exists
        if (config.types.custom[name]) {
          console.error(chalk.red('Error:'), `Custom type "${name}" already exists.`);
          console.log(chalk.dim('Use "fractary codex types remove" first to remove it.'));
          process.exit(1);
        }

        // Add the new type
        const newType: TypeConfig = {
          pattern: options.pattern,
          ttl: options.ttl
        };

        if (options.description) {
          newType.description = options.description;
        }

        config.types.custom[name] = newType;

        // Save config
        await saveConfig(config);

        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            type: {
              name,
              ...newType,
              builtin: false
            }
          }, null, 2));
          return;
        }

        console.log(chalk.green('✓'), `Added custom type "${chalk.cyan(name)}"`);
        console.log('');
        console.log(`  ${chalk.dim('Pattern:')}     ${options.pattern}`);
        console.log(`  ${chalk.dim('TTL:')}         ${options.ttl}`);
        if (options.description) {
          console.log(`  ${chalk.dim('Description:')} ${options.description}`);
        }
        console.log('');
        console.log(chalk.dim('Example URI: codex://org/project/' + options.pattern.replace('**/', '').replace('/*', '/example.md')));

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
