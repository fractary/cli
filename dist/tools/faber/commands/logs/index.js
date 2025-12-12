"use strict";
/**
 * Logs subcommand - Log management
 *
 * Provides capture, write, search, list, archive operations via LogManager SDK.
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
    logs.addCommand(createLogsReadCommand());
    logs.addCommand(createLogsSearchCommand());
    logs.addCommand(createLogsListCommand());
    logs.addCommand(createLogsArchiveCommand());
    logs.addCommand(createLogsDeleteCommand());
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
                if (result?.logPath) {
                    console.log(chalk_1.default.gray(`  Log saved to: ${result.logPath}`));
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
        .requiredOption('--content <text>', 'Log content')
        .option('--issue <number>', 'Associated issue number')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = logManager.writeLog({
                type: options.type,
                title: options.title,
                content: options.content,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created ${options.type} log: ${options.title}`));
                console.log(chalk_1.default.gray(`  ID: ${result.id}`));
                console.log(chalk_1.default.gray(`  Path: ${result.path}`));
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsReadCommand() {
    return new commander_1.Command('read')
        .description('Read a log entry by ID or path')
        .argument('<id>', 'Log ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const log = logManager.readLog(id);
            if (!log) {
                if (options.json) {
                    console.error(JSON.stringify({
                        status: 'error',
                        error: { code: 'LOG_NOT_FOUND', message: `Log not found: ${id}` },
                    }));
                }
                else {
                    console.error(chalk_1.default.red(`Log not found: ${id}`));
                }
                process.exit(5);
            }
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: log }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold(`[${log.type}] ${log.title}`));
                console.log(chalk_1.default.gray(`ID: ${log.id}`));
                console.log(chalk_1.default.gray(`Date: ${log.metadata.date}`));
                console.log(chalk_1.default.gray(`Path: ${log.path}`));
                console.log('\n' + log.content);
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
        .option('--regex', 'Use regex search')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const results = logManager.searchLogs({
                query: options.query,
                type: options.type,
                issueNumber: options.issue ? parseInt(options.issue, 10) : undefined,
                regex: options.regex,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: results }, null, 2));
            }
            else {
                if (results.length === 0) {
                    console.log(chalk_1.default.yellow('No logs found'));
                }
                else {
                    results.forEach((result) => {
                        console.log(chalk_1.default.bold(`[${result.log.type}] ${result.log.title}`));
                        console.log(chalk_1.default.gray(`  ${result.log.path}`));
                        if (result.snippets && result.snippets.length > 0) {
                            result.snippets.forEach((snippet) => {
                                console.log(chalk_1.default.gray(`  ...${snippet}...`));
                            });
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
            const logs = logManager.listLogs({
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
                        console.log(`${typeColor(`[${log.type}]`)} ${log.title} (${log.metadata.date})`);
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
        .description('Archive old logs')
        .option('--max-age <days>', 'Archive logs older than N days', '30')
        .option('--compress', 'Compress archived logs')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const result = logManager.archiveLogs({
                maxAgeDays: parseInt(options.maxAge, 10),
                compress: options.compress,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                if (result.archived.length === 0 && result.deleted.length === 0) {
                    console.log(chalk_1.default.yellow('No logs to archive'));
                }
                else {
                    if (result.archived.length > 0) {
                        console.log(chalk_1.default.green(`✓ Archived ${result.archived.length} log(s)`));
                        result.archived.forEach((log) => {
                            console.log(chalk_1.default.gray(`  - ${log}`));
                        });
                    }
                    if (result.deleted.length > 0) {
                        console.log(chalk_1.default.green(`✓ Deleted ${result.deleted.length} log(s)`));
                        result.deleted.forEach((log) => {
                            console.log(chalk_1.default.gray(`  - ${log}`));
                        });
                    }
                    if (result.errors.length > 0) {
                        console.log(chalk_1.default.yellow(`\nErrors (${result.errors.length}):`));
                        result.errors.forEach((err) => {
                            console.log(chalk_1.default.red(`  - ${err}`));
                        });
                    }
                }
            }
        }
        catch (error) {
            handleLogsError(error, options);
        }
    });
}
function createLogsDeleteCommand() {
    return new commander_1.Command('delete')
        .description('Delete a log entry')
        .argument('<id>', 'Log ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const logManager = await (0, sdk_1.getLogManager)();
            const deleted = logManager.deleteLog(id);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { deleted } }, null, 2));
            }
            else {
                if (deleted) {
                    console.log(chalk_1.default.green(`✓ Deleted log: ${id}`));
                }
                else {
                    console.log(chalk_1.default.yellow(`Log not found: ${id}`));
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