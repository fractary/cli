"use strict";
/**
 * Types show command (v3.0)
 *
 * Shows details for a specific artifact type using SDK's TypeRegistry
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typesShowCommand = typesShowCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../../get-client");
/**
 * Format TTL from seconds to human-readable string
 */
function formatTtl(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}
function typesShowCommand() {
    const cmd = new commander_1.Command('show');
    cmd
        .description('Show details for a specific type')
        .argument('<name>', 'Type name')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            const registry = client.getTypeRegistry();
            // Get type from registry
            const type = registry.get(name);
            if (!type) {
                console.error(chalk_1.default.red('Error:'), `Type "${name}" not found.`);
                console.log(chalk_1.default.dim('Run "fractary codex types list" to see available types.'));
                process.exit(1);
            }
            const isBuiltin = registry.isBuiltIn(name);
            if (options.json) {
                console.log(JSON.stringify({
                    name: type.name,
                    builtin: isBuiltin,
                    description: type.description,
                    patterns: type.patterns,
                    defaultTtl: type.defaultTtl,
                    ttl: formatTtl(type.defaultTtl),
                    archiveAfterDays: type.archiveAfterDays,
                    archiveStorage: type.archiveStorage,
                    syncPatterns: type.syncPatterns,
                    excludePatterns: type.excludePatterns
                }, null, 2));
                return;
            }
            // Display formatted output
            const nameColor = isBuiltin ? chalk_1.default.cyan : chalk_1.default.green;
            console.log(chalk_1.default.bold(`Type: ${nameColor(name)}\n`));
            console.log(`  ${chalk_1.default.dim('Source:')}      ${isBuiltin ? 'Built-in' : 'Custom'}`);
            console.log(`  ${chalk_1.default.dim('Description:')} ${type.description}`);
            console.log(`  ${chalk_1.default.dim('TTL:')}         ${formatTtl(type.defaultTtl)} (${type.defaultTtl} seconds)`);
            console.log('');
            console.log(chalk_1.default.bold('Patterns'));
            for (const pattern of type.patterns) {
                console.log(`  ${chalk_1.default.dim('•')} ${pattern}`);
            }
            if (type.archiveAfterDays !== null) {
                console.log('');
                console.log(chalk_1.default.bold('Archive Settings'));
                console.log(`  ${chalk_1.default.dim('After:')}   ${type.archiveAfterDays} days`);
                console.log(`  ${chalk_1.default.dim('Storage:')} ${type.archiveStorage || 'not set'}`);
            }
            if (type.syncPatterns && type.syncPatterns.length > 0) {
                console.log('');
                console.log(chalk_1.default.bold('Sync Patterns'));
                for (const pattern of type.syncPatterns) {
                    console.log(`  ${chalk_1.default.dim('•')} ${pattern}`);
                }
            }
            if (type.excludePatterns && type.excludePatterns.length > 0) {
                console.log('');
                console.log(chalk_1.default.bold('Exclude Patterns'));
                for (const pattern of type.excludePatterns) {
                    console.log(`  ${chalk_1.default.dim('•')} ${pattern}`);
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=show.js.map