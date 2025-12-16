"use strict";
/**
 * Output Formatting Utilities
 *
 * Consistent formatting for Forge CLI output including tables,
 * success/error messages, and component information display.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInstallResult = formatInstallResult;
exports.formatComponentTable = formatComponentTable;
exports.formatComponentInfo = formatComponentInfo;
exports.formatError = formatError;
exports.formatSuccess = formatSuccess;
exports.formatWarning = formatWarning;
exports.formatInfo = formatInfo;
exports.formatBytes = formatBytes;
exports.formatSearchResults = formatSearchResults;
exports.formatCacheStats = formatCacheStats;
exports.createProgressMessage = createProgressMessage;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * Format installation result
 */
function formatInstallResult(result, options = {}) {
    if (!result.success) {
        console.error(chalk_1.default.red(`✗ Installation failed: ${result.error}`));
        return;
    }
    // Success header
    console.log(chalk_1.default.green(`✓ Installed ${result.name}`));
    // Component counts
    const counts = [];
    if (result.installed.agents)
        counts.push(`${result.installed.agents} agent(s)`);
    if (result.installed.tools)
        counts.push(`${result.installed.tools} tool(s)`);
    if (result.installed.workflows)
        counts.push(`${result.installed.workflows} workflow(s)`);
    if (result.installed.templates)
        counts.push(`${result.installed.templates} template(s)`);
    if (result.installed.hooks)
        counts.push(`${result.installed.hooks} hook(s)`);
    if (result.installed.commands)
        counts.push(`${result.installed.commands} command(s)`);
    if (counts.length > 0) {
        counts.forEach((count) => console.log(`  • ${count}`));
    }
    // Installation path
    if (result.path) {
        console.log(`\\nInstalled to: ${chalk_1.default.cyan(result.path)}`);
    }
    // Size
    if (result.totalSize > 0) {
        console.log(`Total size: ${formatBytes(result.totalSize)}`);
    }
    // Warnings
    if (result.warnings && result.warnings.length > 0) {
        console.log();
        result.warnings.forEach((warning) => {
            console.warn(chalk_1.default.yellow(`⚠ ${warning}`));
        });
    }
    // Dry run notice
    if (result.dryRun) {
        console.log();
        console.log(chalk_1.default.dim('(Dry run - no files were actually installed)'));
    }
}
/**
 * Format component list as table
 */
function formatComponentTable(components, options = {}) {
    if (components.length === 0) {
        console.log(chalk_1.default.dim('No components found.'));
        return;
    }
    const table = new cli_table3_1.default({
        head: ['Name', 'Type', 'Version', 'Source', ...(options.showPath ? ['Path'] : [])].map((h) => chalk_1.default.cyan(h)),
        style: {
            head: [],
            border: [],
        },
    });
    components.forEach((comp) => {
        const row = [
            comp.name,
            comp.type,
            comp.version || '-',
            comp.source,
            ...(options.showPath ? [comp.path || '-'] : []),
        ];
        table.push(row);
    });
    console.log(table.toString());
    console.log();
    console.log(chalk_1.default.dim(`Total: ${components.length} component(s)`));
}
/**
 * Format component info (detailed view)
 */
function formatComponentInfo(info) {
    console.log();
    console.log(chalk_1.default.bold.cyan(`${info.name}`));
    console.log(chalk_1.default.dim('─'.repeat(60)));
    // Basic info
    console.log(`Type: ${chalk_1.default.yellow(info.type)}`);
    if (info.version) {
        console.log(`Version: ${chalk_1.default.green(info.version)}`);
    }
    console.log(`Source: ${chalk_1.default.cyan(info.source)}`);
    // Location
    if (info.path) {
        console.log(`Path: ${chalk_1.default.dim(info.path)}`);
    }
    if (info.url) {
        console.log(`URL: ${chalk_1.default.dim(info.url)}`);
    }
    // Description
    if (info.description) {
        console.log();
        console.log(chalk_1.default.bold('Description:'));
        console.log(info.description);
    }
    // Dependencies
    if (info.dependencies && info.dependencies.length > 0) {
        console.log();
        console.log(chalk_1.default.bold('Dependencies:'));
        info.dependencies.forEach((dep) => {
            console.log(`  • ${dep}`);
        });
    }
    // Available versions
    if (info.availableVersions && info.availableVersions.length > 0) {
        console.log();
        console.log(chalk_1.default.bold('Available Versions:'));
        info.availableVersions.forEach((version) => {
            console.log(`  • ${version}`);
        });
    }
    console.log();
}
/**
 * Format error with contextual help
 */
function formatError(error, context, hints) {
    console.error();
    console.error(chalk_1.default.red(`✗ ${context}: ${error.message}`));
    // Show hints if provided
    if (hints && hints.length > 0) {
        console.error();
        console.error(chalk_1.default.yellow('Try:'));
        hints.forEach((hint) => {
            console.error(chalk_1.default.yellow(`  • ${hint}`));
        });
    }
    // Show stack trace in debug mode
    if (process.env.DEBUG) {
        console.error();
        console.error(chalk_1.default.dim('Stack trace:'));
        console.error(chalk_1.default.dim(error.stack));
    }
    console.error();
}
/**
 * Format success message
 */
function formatSuccess(message) {
    console.log(chalk_1.default.green(`✓ ${message}`));
}
/**
 * Format warning message
 */
function formatWarning(message) {
    console.warn(chalk_1.default.yellow(`⚠ ${message}`));
}
/**
 * Format info message
 */
function formatInfo(message) {
    console.log(chalk_1.default.cyan(`ℹ ${message}`));
}
/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
/**
 * Format search results table
 */
function formatSearchResults(results, pagination) {
    if (results.length === 0) {
        console.log(chalk_1.default.dim('No results found.'));
        return;
    }
    const table = new cli_table3_1.default({
        head: ['Name', 'Type', 'Version', 'Description', 'Author', 'Downloads'].map((h) => chalk_1.default.cyan(h)),
        style: {
            head: [],
            border: [],
        },
        colWidths: [25, 12, 10, 40, 15, 12],
    });
    results.forEach((result) => {
        table.push([
            result.name,
            result.type,
            result.version,
            result.description.substring(0, 37) + (result.description.length > 37 ? '...' : ''),
            result.author || '-',
            result.downloads?.toLocaleString() || '-',
        ]);
    });
    console.log(table.toString());
    console.log();
    const startIndex = (pagination.page - 1) * pagination.limit + 1;
    const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);
    console.log(chalk_1.default.dim(`Showing ${startIndex}-${endIndex} of ${pagination.total} results. Page ${pagination.page}`));
    if (endIndex < pagination.total) {
        console.log(chalk_1.default.dim(`Use --page ${pagination.page + 1} for next page.`));
    }
}
/**
 * Format cache statistics
 */
function formatCacheStats(stats) {
    console.log();
    console.log(chalk_1.default.bold.cyan('Cache Statistics'));
    console.log(chalk_1.default.dim('─'.repeat(60)));
    console.log(`Total entries: ${chalk_1.default.yellow(stats.totalEntries.toString())}`);
    console.log(`Fresh entries: ${chalk_1.default.green(stats.freshEntries.toString())}`);
    console.log(`Stale entries: ${chalk_1.default.red(stats.staleEntries.toString())}`);
    console.log(`Total size: ${chalk_1.default.cyan(formatBytes(stats.totalSize))}`);
    if (stats.oldestEntry) {
        console.log(`Oldest entry: ${chalk_1.default.dim(new Date(stats.oldestEntry).toLocaleString())}`);
    }
    if (stats.newestEntry) {
        console.log(`Newest entry: ${chalk_1.default.dim(new Date(stats.newestEntry).toLocaleString())}`);
    }
    console.log();
}
/**
 * Create a progress message (for use with ora)
 */
function createProgressMessage(action, target) {
    return chalk_1.default.cyan(`${action} ${chalk_1.default.bold(target)}...`);
}
//# sourceMappingURL=formatters.js.map