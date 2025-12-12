"use strict";
/**
 * Logs subcommand - Log management
 *
 * Provides capture, write, search, list, archive, cleanup, audit operations via LogManager SDK.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogsCommand = createLogsCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../../../sdk");
/**
 * Create the logs command tree
 */
function createLogsCommand() {
    const logs = new commander_1.Command('logs')
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
function createLogsCaptureCommand() {
    return new commander_1.Command('capture')
        .description('Start session capture')
        .argument('<issue_number>', 'Issue number to associate with session')
        .option('--model <model>', 'Model being used')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.startCapture({
                issueNumber: parseInt(issueNumber, 10),
                model: options.model,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Started session capture for issue #${issueNumber}`));
                console.log(chalk_1.default.gray(`  Session ID: ${result.sessionId}`));
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsStopCommand() {
    return new commander_1.Command('stop')
        .description('Stop session capture')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.stopCapture();
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green('✓ Stopped session capture'));
                if (result.path) {
                    console.log(chalk_1.default.gray(`  Log saved to: ${result.path}`));
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsWriteCommand() {
    return new commander_1.Command('write')
        .description('Write a typed log entry')
        .requiredOption('--type <type>', 'Log type: session|build|deployment|debug|test|audit|operational')
        .requiredOption('--title <title>', 'Log entry title')
        .option('--issue <number>', 'Associated issue number')
        .option('--content <text>', 'Log content')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.write({
                type: options.type,
                title: options.title,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
                content: options.content,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created ${options.type} log: ${options.title}`));
                console.log(chalk_1.default.gray(`  Path: ${result.path}`));
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsSearchCommand() {
    return new commander_1.Command('search')
        .description('Search logs')
        .requiredOption('--query <text>', 'Search query')
        .option('--type <type>', 'Filter by log type')
        .option('--issue <number>', 'Filter by issue number')
        .option('--limit <n>', 'Max results', '20')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const results = await logManager.search({
                query: options.query,
                type: options.type,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
                limit: parseInt(options.limit, 10),
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: results }, null, 2));
            }
            else {
                if (results.length === 0) {
                    console.log(chalk_1.default.yellow('No logs found'));
                }
                else {
                    results.forEach((log) => {
                        console.log(chalk_1.default.bold(`[${log.type}] ${log.title}`));
                        console.log(chalk_1.default.gray(`  ${log.path}`));
                        if (log.snippet) {
                            console.log(chalk_1.default.gray(`  ...${log.snippet}...`));
                        }
                        console.log('');
                    });
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsListCommand() {
    return new commander_1.Command('list')
        .description('List logs')
        .option('--type <type>', 'Filter by log type')
        .option('--status <status>', 'Filter by status (active, archived)', 'active')
        .option('--issue <number>', 'Filter by issue number')
        .option('--limit <n>', 'Max results', '50')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const logs = await logManager.list({
                type: options.type,
                status: options.status,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
                limit: parseInt(options.limit, 10),
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: logs }, null, 2));
            }
            else {
                if (logs.length === 0) {
                    console.log(chalk_1.default.yellow('No logs found'));
                }
                else {
                    logs.forEach((log) => {
                        const typeColor = getTypeColor(log.type);
                        console.log(`${typeColor(`[${log.type}]`)} ${log.title} (${log.date})`);
                    });
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsArchiveCommand() {
    return new commander_1.Command('archive')
        .description('Archive logs')
        .option('--type <type>', 'Archive by log type')
        .option('--issue <number>', 'Archive by issue number')
        .option('--dry-run', 'Show what would be archived')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.archive({
                type: options.type,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
                dryRun: options.dryRun,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                const prefix = options.dryRun ? 'Would archive' : 'Archived';
                if (result.archived.length === 0) {
                    console.log(chalk_1.default.yellow('No logs to archive'));
                }
                else {
                    result.archived.forEach((log) => {
                        console.log(chalk_1.default.green(`✓ ${prefix}: ${log}`));
                    });
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsCleanupCommand() {
    return new commander_1.Command('cleanup')
        .description('Clean up old logs')
        .option('--older-than <days>', 'Delete logs older than N days', '90')
        .option('--type <type>', 'Clean specific log type only')
        .option('--dry-run', 'Show what would be cleaned')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.cleanup({
                olderThanDays: parseInt(options.olderThan, 10),
                type: options.type,
                dryRun: options.dryRun,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                const prefix = options.dryRun ? 'Would delete' : 'Deleted';
                if (result.deleted.length === 0) {
                    console.log(chalk_1.default.yellow('No logs to clean up'));
                }
                else {
                    console.log(chalk_1.default.green(`✓ ${prefix} ${result.deleted.length} log(s)`));
                    result.deleted.forEach((log) => {
                        console.log(chalk_1.default.gray(`  - ${log}`));
                    });
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsAuditCommand() {
    return new commander_1.Command('audit')
        .description('Audit logs for issues')
        .option('--execute', 'Execute recommended fixes')
        .option('--verbose', 'Show detailed audit results')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = await logManager.audit({
                execute: options.execute,
                verbose: options.verbose,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold('Log Audit Results:'));
                console.log(`  Total logs: ${result.total}`);
                console.log(`  Issues found: ${result.issues.length}`);
                if (result.issues.length > 0) {
                    console.log(chalk_1.default.yellow('\nIssues:'));
                    result.issues.forEach((issue) => {
                        console.log(`  - ${issue.type}: ${issue.description}`);
                        if (issue.path) {
                            console.log(chalk_1.default.gray(`    Path: ${issue.path}`));
                        }
                    });
                }
                if (options.execute && result.fixed.length > 0) {
                    console.log(chalk_1.default.green('\nFixes applied:'));
                    result.fixed.forEach((fix) => {
                        console.log(`  ✓ ${fix}`);
                    });
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
// Helper functions
function getTypeColor(type) {
    switch (type) {
        case 'session':
            return chalk_1.default.blue;
        case 'build':
            return chalk_1.default.cyan;
        case 'deployment':
            return chalk_1.default.magenta;
        case 'debug':
            return chalk_1.default.yellow;
        case 'test':
            return chalk_1.default.green;
        case 'audit':
            return chalk_1.default.red;
        case 'operational':
            return chalk_1.default.gray;
        default:
            return chalk_1.default.white;
    }
}
// Error handling
function handleLogsError(error, options) {
    if (error instanceof sdk_1.SDKNotAvailableError) {
        if (options.json) {
            console.error(JSON.stringify({
                status: 'error',
                error: { code: 'SDK_NOT_AVAILABLE', message: error.message },
            }));
        }
        else {
            console.error(chalk_1.default.red('Error:'), error.message);
        }
        process.exit(9);
    }
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
        console.error(JSON.stringify({
            status: 'error',
            error: { code: 'LOGS_ERROR', message },
        }));
    }
    else {
        console.error(chalk_1.default.red('Error:'), message);
    }
    process.exit(1);
}
//# sourceMappingURL=index.js.map