/**
 * Logs subcommand - Log management
 *
 * Provides capture, write, search, list, archive, cleanup, audit operations via LogManager SDK.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getLogManager, SDKNotAvailableError } from '../../../../sdk';

/**
 * Create the logs command tree
 */
export function createLogsCommand(): Command {
  const logs = new Command('logs')
    .description('Log management');

  logs.addCommand(createLogsCaptureCommand());
  logs.addCommand(createLogsStopCommand());
  logs.addCommand(createLogsWriteCommand());
  logs.addCommand(createLogsSearchCommand());
  logs.addCommand(createLogsListCommand());
  logs.addCommand(createLogsArchiveCommand());
  logs.addCommand(createLogsCleanupCommand());
  logs.addCommand(createLogsAuditCommand());

  return logs;
}

function createLogsCaptureCommand(): Command {
  return new Command('capture')
    .description('Start session capture')
    .argument('<issue_number>', 'Issue number to associate with session')
    .option('--model <model>', 'Model being used')
    .option('--json', 'Output as JSON')
    .action(async (issueNumber: string, options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.startCapture({
          issueNumber: parseInt(issueNumber, 10),
          model: options.model,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Started session capture for issue #${issueNumber}`));
          console.log(chalk.gray(`  Session ID: ${result.sessionId}`));
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsStopCommand(): Command {
  return new Command('stop')
    .description('Stop session capture')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.stopCapture();

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green('✓ Stopped session capture'));
          if (result.path) {
            console.log(chalk.gray(`  Log saved to: ${result.path}`));
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsWriteCommand(): Command {
  return new Command('write')
    .description('Write a typed log entry')
    .requiredOption('--type <type>', 'Log type: session|build|deployment|debug|test|audit|operational')
    .requiredOption('--title <title>', 'Log entry title')
    .option('--issue <number>', 'Associated issue number')
    .option('--content <text>', 'Log content')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.write({
          type: options.type,
          title: options.title,
          issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
          content: options.content,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created ${options.type} log: ${options.title}`));
          console.log(chalk.gray(`  Path: ${result.path}`));
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsSearchCommand(): Command {
  return new Command('search')
    .description('Search logs')
    .requiredOption('--query <text>', 'Search query')
    .option('--type <type>', 'Filter by log type')
    .option('--issue <number>', 'Filter by issue number')
    .option('--limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const results = await logManager.search({
          query: options.query,
          type: options.type,
          issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
          limit: parseInt(options.limit, 10),
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: results }, null, 2));
        } else {
          if (results.length === 0) {
            console.log(chalk.yellow('No logs found'));
          } else {
            results.forEach((log: any) => {
              console.log(chalk.bold(`[${log.type}] ${log.title}`));
              console.log(chalk.gray(`  ${log.path}`));
              if (log.snippet) {
                console.log(chalk.gray(`  ...${log.snippet}...`));
              }
              console.log('');
            });
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsListCommand(): Command {
  return new Command('list')
    .description('List logs')
    .option('--type <type>', 'Filter by log type')
    .option('--status <status>', 'Filter by status (active, archived)', 'active')
    .option('--issue <number>', 'Filter by issue number')
    .option('--limit <n>', 'Max results', '50')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const logs = await logManager.list({
          type: options.type,
          status: options.status,
          issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
          limit: parseInt(options.limit, 10),
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: logs }, null, 2));
        } else {
          if (logs.length === 0) {
            console.log(chalk.yellow('No logs found'));
          } else {
            logs.forEach((log: any) => {
              const typeColor = getTypeColor(log.type);
              console.log(`${typeColor(`[${log.type}]`)} ${log.title} (${log.date})`);
            });
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsArchiveCommand(): Command {
  return new Command('archive')
    .description('Archive logs')
    .option('--type <type>', 'Archive by log type')
    .option('--issue <number>', 'Archive by issue number')
    .option('--dry-run', 'Show what would be archived')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.archive({
          type: options.type,
          issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
          dryRun: options.dryRun,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          const prefix = options.dryRun ? 'Would archive' : 'Archived';
          if (result.archived.length === 0) {
            console.log(chalk.yellow('No logs to archive'));
          } else {
            result.archived.forEach((log: string) => {
              console.log(chalk.green(`✓ ${prefix}: ${log}`));
            });
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsCleanupCommand(): Command {
  return new Command('cleanup')
    .description('Clean up old logs')
    .option('--older-than <days>', 'Delete logs older than N days', '90')
    .option('--type <type>', 'Clean specific log type only')
    .option('--dry-run', 'Show what would be cleaned')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.cleanup({
          olderThanDays: parseInt(options.olderThan, 10),
          type: options.type,
          dryRun: options.dryRun,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          const prefix = options.dryRun ? 'Would delete' : 'Deleted';
          if (result.deleted.length === 0) {
            console.log(chalk.yellow('No logs to clean up'));
          } else {
            console.log(chalk.green(`✓ ${prefix} ${result.deleted.length} log(s)`));
            result.deleted.forEach((log: string) => {
              console.log(chalk.gray(`  - ${log}`));
            });
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

function createLogsAuditCommand(): Command {
  return new Command('audit')
    .description('Audit logs for issues')
    .option('--execute', 'Execute recommended fixes')
    .option('--verbose', 'Show detailed audit results')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const logManager = await getLogManager();
        const result = await logManager.audit({
          execute: options.execute,
          verbose: options.verbose,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.bold('Log Audit Results:'));
          console.log(`  Total logs: ${result.total}`);
          console.log(`  Issues found: ${result.issues.length}`);

          if (result.issues.length > 0) {
            console.log(chalk.yellow('\nIssues:'));
            result.issues.forEach((issue: any) => {
              console.log(`  - ${issue.type}: ${issue.description}`);
              if (issue.path) {
                console.log(chalk.gray(`    Path: ${issue.path}`));
              }
            });
          }

          if (options.execute && result.fixed.length > 0) {
            console.log(chalk.green('\nFixes applied:'));
            result.fixed.forEach((fix: string) => {
              console.log(`  ✓ ${fix}`);
            });
          }
        }
      } catch (error) {
        handleLogsError(error, options);
      }
    });
}

// Helper functions

function getTypeColor(type: string): (text: string) => string {
  switch (type) {
    case 'session':
      return chalk.blue;
    case 'build':
      return chalk.cyan;
    case 'deployment':
      return chalk.magenta;
    case 'debug':
      return chalk.yellow;
    case 'test':
      return chalk.green;
    case 'audit':
      return chalk.red;
    case 'operational':
      return chalk.gray;
    default:
      return chalk.white;
  }
}

// Error handling

function handleLogsError(error: unknown, options: { json?: boolean }): void {
  if (error instanceof SDKNotAvailableError) {
    if (options.json) {
      console.error(JSON.stringify({
        status: 'error',
        error: { code: 'SDK_NOT_AVAILABLE', message: error.message },
      }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(9);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (options.json) {
    console.error(JSON.stringify({
      status: 'error',
      error: { code: 'LOGS_ERROR', message },
    }));
  } else {
    console.error(chalk.red('Error:'), message);
  }
  process.exit(1);
}
