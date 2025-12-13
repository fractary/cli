/**
 * Types list command
 *
 * Lists all artifact types (built-in and custom)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { fileExists, readFileContent } from '../../utils/file-scanner';

/**
 * Built-in artifact types from SDK v3.0
 */
const BUILT_IN_TYPES: Record<string, {
  pattern: string;
  description: string;
  ttl: string;
}> = {
  docs: {
    pattern: 'docs/**/*.md',
    description: 'Documentation files',
    ttl: '24h'
  },
  specs: {
    pattern: 'specs/**/*.md',
    description: 'Specification documents',
    ttl: '7d'
  },
  logs: {
    pattern: 'logs/**/*.md',
    description: 'Session logs and summaries',
    ttl: '24h'
  },
  standards: {
    pattern: 'standards/**/*.md',
    description: 'Coding and process standards',
    ttl: '7d'
  },
  templates: {
    pattern: 'templates/**/*',
    description: 'File and project templates',
    ttl: '7d'
  },
  state: {
    pattern: 'state/**/*.json',
    description: 'Persistent state files',
    ttl: '1h'
  }
};

interface TypeConfig {
  pattern: string;
  description?: string;
  ttl?: string;
}

interface CodexConfig {
  version: string;
  types?: {
    custom?: Record<string, TypeConfig>;
  };
}

/**
 * Get config directory path
 */
function getConfigDir(): string {
  return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}

/**
 * Load custom types from config
 */
async function loadCustomTypes(): Promise<Record<string, TypeConfig>> {
  const configPath = path.join(getConfigDir(), 'config.json');

  try {
    if (await fileExists(configPath)) {
      const content = await readFileContent(configPath);
      const config: CodexConfig = JSON.parse(content);
      return config.types?.custom || {};
    }
  } catch {
    // Config load failed
  }

  return {};
}

export function typesListCommand(): Command {
  const cmd = new Command('list');

  cmd
    .description('List all artifact types')
    .option('--json', 'Output as JSON')
    .option('--custom-only', 'Show only custom types')
    .option('--builtin-only', 'Show only built-in types')
    .action(async (options) => {
      try {
        const customTypes = await loadCustomTypes();

        // Build type list
        const types: Array<{
          name: string;
          pattern: string;
          description: string;
          ttl: string;
          builtin: boolean;
        }> = [];

        // Add built-in types
        if (!options.customOnly) {
          for (const [name, type] of Object.entries(BUILT_IN_TYPES)) {
            types.push({
              name,
              pattern: type.pattern,
              description: type.description,
              ttl: type.ttl,
              builtin: true
            });
          }
        }

        // Add custom types
        if (!options.builtinOnly) {
          for (const [name, type] of Object.entries(customTypes)) {
            types.push({
              name,
              pattern: type.pattern,
              description: type.description || 'Custom type',
              ttl: type.ttl || '24h',
              builtin: false
            });
          }
        }

        if (options.json) {
          console.log(JSON.stringify({
            count: types.length,
            builtinCount: types.filter(t => t.builtin).length,
            customCount: types.filter(t => !t.builtin).length,
            types
          }, null, 2));
          return;
        }

        if (types.length === 0) {
          console.log(chalk.yellow('No types found.'));
          return;
        }

        console.log(chalk.bold('Artifact Types\n'));

        // Group by built-in vs custom
        const builtinTypes = types.filter(t => t.builtin);
        const customTypesList = types.filter(t => !t.builtin);

        if (builtinTypes.length > 0 && !options.customOnly) {
          console.log(chalk.bold('Built-in Types'));
          console.log(chalk.dim('─'.repeat(60)));

          for (const type of builtinTypes) {
            console.log(`  ${chalk.cyan(type.name.padEnd(12))} ${type.pattern.padEnd(25)} ${chalk.dim(`TTL: ${type.ttl}`)}`);
            console.log(`  ${chalk.dim(' '.repeat(12) + type.description)}`);
          }
          console.log('');
        }

        if (customTypesList.length > 0 && !options.builtinOnly) {
          console.log(chalk.bold('Custom Types'));
          console.log(chalk.dim('─'.repeat(60)));

          for (const type of customTypesList) {
            console.log(`  ${chalk.green(type.name.padEnd(12))} ${type.pattern.padEnd(25)} ${chalk.dim(`TTL: ${type.ttl}`)}`);
            console.log(`  ${chalk.dim(' '.repeat(12) + type.description)}`);
          }
          console.log('');
        }

        // Summary
        console.log(chalk.dim(`Total: ${types.length} types (${builtinTypes.length} built-in, ${customTypesList.length} custom)`));

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
