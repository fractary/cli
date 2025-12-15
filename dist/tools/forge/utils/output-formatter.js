"use strict";
/**
 * Output Formatting Utilities for Forge CLI
 *
 * Provides consistent formatting for agent and tool information
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAgentInfo = formatAgentInfo;
exports.formatToolInfo = formatToolInfo;
exports.formatAgentList = formatAgentList;
exports.formatToolList = formatToolList;
exports.formatValidationErrors = formatValidationErrors;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Format agent information for display
 */
function formatAgentInfo(info, options) {
    const lines = [];
    lines.push(chalk_1.default.bold.cyan(`\nAgent: ${info.name}`));
    lines.push(chalk_1.default.dim('─'.repeat(50)));
    lines.push(`${chalk_1.default.bold('Version:')} ${chalk_1.default.green(info.version)}`);
    lines.push(`${chalk_1.default.bold('Source:')} ${chalk_1.default.yellow(info.source)}`);
    if (info.description) {
        lines.push(`${chalk_1.default.bold('Description:')} ${info.description}`);
    }
    if (info.tags && info.tags.length > 0) {
        lines.push(`${chalk_1.default.bold('Tags:')} ${info.tags.join(', ')}`);
    }
    if (info.author) {
        lines.push(`${chalk_1.default.bold('Author:')} ${info.author}`);
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format tool information for display
 */
function formatToolInfo(info) {
    const lines = [];
    lines.push(chalk_1.default.bold.cyan(`\nTool: ${info.name}`));
    lines.push(chalk_1.default.dim('─'.repeat(50)));
    lines.push(`${chalk_1.default.bold('Version:')} ${chalk_1.default.green(info.version)}`);
    lines.push(`${chalk_1.default.bold('Source:')} ${chalk_1.default.yellow(info.source)}`);
    if (info.description) {
        lines.push(`${chalk_1.default.bold('Description:')} ${info.description}`);
    }
    if (info.tags && info.tags.length > 0) {
        lines.push(`${chalk_1.default.bold('Tags:')} ${info.tags.join(', ')}`);
    }
    if (info.author) {
        lines.push(`${chalk_1.default.bold('Author:')} ${info.author}`);
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format agent list as table
 */
function formatAgentList(agents) {
    if (agents.length === 0) {
        return chalk_1.default.dim('No agents found');
    }
    const lines = [];
    lines.push(chalk_1.default.bold.cyan('\nAvailable Agents:'));
    lines.push(chalk_1.default.dim('─'.repeat(80)));
    for (const agent of agents) {
        lines.push('');
        lines.push(chalk_1.default.green(`  ${agent.name}`) + chalk_1.default.dim(` @${agent.version}`));
        if (agent.description) {
            lines.push(chalk_1.default.dim(`    ${agent.description}`));
        }
        lines.push(chalk_1.default.dim(`    Source: ${agent.source}`));
        if (agent.tags && agent.tags.length > 0) {
            lines.push(chalk_1.default.dim(`    Tags: ${agent.tags.join(', ')}`));
        }
    }
    lines.push('');
    lines.push(chalk_1.default.dim('─'.repeat(80)));
    lines.push(chalk_1.default.bold(`Total: ${agents.length} agent(s)`));
    lines.push('');
    return lines.join('\n');
}
/**
 * Format tool list as table
 */
function formatToolList(tools) {
    if (tools.length === 0) {
        return chalk_1.default.dim('No tools found');
    }
    const lines = [];
    lines.push(chalk_1.default.bold.cyan('\nAvailable Tools:'));
    lines.push(chalk_1.default.dim('─'.repeat(80)));
    for (const tool of tools) {
        lines.push('');
        lines.push(chalk_1.default.green(`  ${tool.name}`) + chalk_1.default.dim(` @${tool.version}`));
        if (tool.description) {
            lines.push(chalk_1.default.dim(`    ${tool.description}`));
        }
        lines.push(chalk_1.default.dim(`    Source: ${tool.source}`));
        if (tool.tags && tool.tags.length > 0) {
            lines.push(chalk_1.default.dim(`    Tags: ${tool.tags.join(', ')}`));
        }
    }
    lines.push('');
    lines.push(chalk_1.default.dim('─'.repeat(80)));
    lines.push(chalk_1.default.bold(`Total: ${tools.length} tool(s)`));
    lines.push('');
    return lines.join('\n');
}
/**
 * Format validation errors
 */
function formatValidationErrors(errors) {
    if (errors.length === 0) {
        return chalk_1.default.green('✓ No errors found');
    }
    const lines = [];
    lines.push(chalk_1.default.red(`\n✗ Found ${errors.length} validation error(s):`));
    lines.push('');
    for (const error of errors) {
        lines.push(chalk_1.default.red(`  • ${error.message || error}`));
        if (error.path) {
            lines.push(chalk_1.default.dim(`    Path: ${error.path}`));
        }
    }
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=output-formatter.js.map