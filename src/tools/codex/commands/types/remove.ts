/**
 * Types remove command
 *
 * Unregisters a custom artifact type
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { fileExists, readFileContent, writeFileContent } from '../../utils/file-scanner';

/**
 * Built-in type names (cannot be removed)
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

export function typesRemoveCommand(): Command {
  const cmd = new Command('remove');

  cmd
    .description('Remove a custom artifact type')
    .argument('<name>', 'Type name to remove')
    .option('--json', 'Output as JSON')
    .option('--force', 'Skip confirmation')
    .action(async (name: string, options) => {
      try {
        // Check for built-in type
        if (BUILT_IN_TYPE_NAMES.includes(name)) {
          console.error(chalk.red('Error:'), `Cannot remove built-in type "${name}".`);
          console.log(chalk.dim('Built-in types are permanent and cannot be removed.'));
          process.exit(1);
        }

        // Load existing config
        const config = await loadConfig();

        if (!config) {
          console.error(chalk.red('Error:'), 'Codex not initialized.');
          console.log(chalk.dim('Run "fractary codex init" first.'));
          process.exit(1);
        }

        // Check if custom type exists
        if (!config.types?.custom?.[name]) {
          console.error(chalk.red('Error:'), `Custom type "${name}" not found.`);
          console.log(chalk.dim('Run "fractary codex types list --custom-only" to see custom types.'));
          process.exit(1);
        }

        // Get type info before removal
        const removedType = config.types.custom[name];

        // Remove the type
        delete config.types.custom[name];

        // Clean up empty objects
        if (Object.keys(config.types.custom).length === 0) {
          delete config.types.custom;
        }
        if (config.types && Object.keys(config.types).length === 0) {
          delete config.types;
        }

        // Save config
        await saveConfig(config);

        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            removed: {
              name,
              ...removedType
            }
          }, null, 2));
          return;
        }

        console.log(chalk.green('✓'), `Removed custom type "${chalk.cyan(name)}"`);
        console.log('');
        console.log(chalk.dim('Removed configuration:'));
        console.log(`  ${chalk.dim('Pattern:')} ${removedType.pattern}`);
        if (removedType.ttl) {
          console.log(`  ${chalk.dim('TTL:')}     ${removedType.ttl}`);
        }

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
