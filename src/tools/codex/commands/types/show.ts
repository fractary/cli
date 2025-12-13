/**
 * Types show command
 *
 * Shows details for a specific artifact type
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
  examples: string[];
}> = {
  docs: {
    pattern: 'docs/**/*.md',
    description: 'Documentation files including guides, tutorials, and API references',
    ttl: '24h',
    examples: [
      'codex://org/project/docs/api.md',
      'codex://org/project/docs/guides/getting-started.md'
    ]
  },
  specs: {
    pattern: 'specs/**/*.md',
    description: 'Specification documents defining system behavior and architecture',
    ttl: '7d',
    examples: [
      'codex://org/project/specs/SPEC-0001.md',
      'codex://org/project/specs/architecture/overview.md'
    ]
  },
  logs: {
    pattern: 'logs/**/*.md',
    description: 'Session logs, conversation summaries, and decision records',
    ttl: '24h',
    examples: [
      'codex://org/project/logs/2025-01-15-session.md',
      'codex://org/project/logs/decisions/ADR-001.md'
    ]
  },
  standards: {
    pattern: 'standards/**/*.md',
    description: 'Coding standards, process guidelines, and best practices',
    ttl: '7d',
    examples: [
      'codex://org/project/standards/typescript.md',
      'codex://org/project/standards/git-workflow.md'
    ]
  },
  templates: {
    pattern: 'templates/**/*',
    description: 'File and project templates for code generation',
    ttl: '7d',
    examples: [
      'codex://org/project/templates/component.tsx.hbs',
      'codex://org/project/templates/spec.md.hbs'
    ]
  },
  state: {
    pattern: 'state/**/*.json',
    description: 'Persistent state files for cross-session data',
    ttl: '1h',
    examples: [
      'codex://org/project/state/project-status.json',
      'codex://org/project/state/metrics.json'
    ]
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

export function typesShowCommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Show details for a specific type')
    .argument('<name>', 'Type name')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      try {
        const customTypes = await loadCustomTypes();

        // Check built-in types first
        if (BUILT_IN_TYPES[name]) {
          const type = BUILT_IN_TYPES[name];

          if (options.json) {
            console.log(JSON.stringify({
              name,
              builtin: true,
              pattern: type.pattern,
              description: type.description,
              ttl: type.ttl,
              examples: type.examples
            }, null, 2));
            return;
          }

          console.log(chalk.bold(`Type: ${chalk.cyan(name)}\n`));
          console.log(`  ${chalk.dim('Source:')}      Built-in`);
          console.log(`  ${chalk.dim('Pattern:')}     ${type.pattern}`);
          console.log(`  ${chalk.dim('TTL:')}         ${type.ttl}`);
          console.log(`  ${chalk.dim('Description:')} ${type.description}`);
          console.log('');
          console.log(chalk.bold('Examples'));
          for (const example of type.examples) {
            console.log(`  ${chalk.dim('•')} ${example}`);
          }
          return;
        }

        // Check custom types
        if (customTypes[name]) {
          const type = customTypes[name];

          if (options.json) {
            console.log(JSON.stringify({
              name,
              builtin: false,
              pattern: type.pattern,
              description: type.description || 'Custom type',
              ttl: type.ttl || '24h'
            }, null, 2));
            return;
          }

          console.log(chalk.bold(`Type: ${chalk.green(name)}\n`));
          console.log(`  ${chalk.dim('Source:')}      Custom`);
          console.log(`  ${chalk.dim('Pattern:')}     ${type.pattern}`);
          console.log(`  ${chalk.dim('TTL:')}         ${type.ttl || '24h'}`);
          console.log(`  ${chalk.dim('Description:')} ${type.description || 'Custom type'}`);
          return;
        }

        // Type not found
        console.error(chalk.red('Error:'), `Type "${name}" not found.`);
        console.log(chalk.dim('Run "fractary codex types list" to see available types.'));
        process.exit(1);

      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  return cmd;
}
