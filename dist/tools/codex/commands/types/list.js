"use strict";
/**
 * Types list command (v3.0)
 *
 * Lists all artifact types using SDK's TypeRegistry
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typesListCommand = typesListCommand;
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
function typesListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List all artifact types')
        .option('--json', 'Output as JSON')
        .option('--custom-only', 'Show only custom types')
        .option('--builtin-only', 'Show only built-in types')
        .action(async (options) => {
        try {
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            const registry = client.getTypeRegistry();
            // Get all types from registry
            const allTypes = registry.list();
            // Filter based on options
            let types = allTypes;
            if (options.customOnly) {
                types = allTypes.filter(t => !registry.isBuiltIn(t.name));
            }
            else if (options.builtinOnly) {
                types = allTypes.filter(t => registry.isBuiltIn(t.name));
            }
            if (options.json) {
                const builtinCount = types.filter(t => registry.isBuiltIn(t.name)).length;
                const customCount = types.length - builtinCount;
                console.log(JSON.stringify({
                    count: types.length,
                    builtinCount,
                    customCount,
                    types: types.map(t => ({
                        name: t.name,
                        description: t.description,
                        patterns: t.patterns,
                        defaultTtl: t.defaultTtl,
                        ttl: formatTtl(t.defaultTtl),
                        builtin: registry.isBuiltIn(t.name),
                        archiveAfterDays: t.archiveAfterDays,
                        archiveStorage: t.archiveStorage
                    }))
                }, null, 2));
                return;
            }
            if (types.length === 0) {
                console.log(chalk_1.default.yellow('No types found.'));
                return;
            }
            console.log(chalk_1.default.bold('Artifact Types\n'));
            // Group by built-in vs custom
            const builtinTypes = types.filter(t => registry.isBuiltIn(t.name));
            const customTypes = types.filter(t => !registry.isBuiltIn(t.name));
            if (builtinTypes.length > 0 && !options.customOnly) {
                console.log(chalk_1.default.bold('Built-in Types'));
                console.log(chalk_1.default.dim('─'.repeat(70)));
                for (const type of builtinTypes) {
                    const patternStr = type.patterns[0] || '';
                    console.log(`  ${chalk_1.default.cyan(type.name.padEnd(12))} ${patternStr.padEnd(30)} ${chalk_1.default.dim(`TTL: ${formatTtl(type.defaultTtl)}`)}`);
                    console.log(`  ${chalk_1.default.dim(' '.repeat(12) + type.description)}`);
                }
                console.log('');
            }
            if (customTypes.length > 0 && !options.builtinOnly) {
                console.log(chalk_1.default.bold('Custom Types'));
                console.log(chalk_1.default.dim('─'.repeat(70)));
                for (const type of customTypes) {
                    const patternStr = type.patterns[0] || '';
                    console.log(`  ${chalk_1.default.green(type.name.padEnd(12))} ${patternStr.padEnd(30)} ${chalk_1.default.dim(`TTL: ${formatTtl(type.defaultTtl)}`)}`);
                    console.log(`  ${chalk_1.default.dim(' '.repeat(12) + type.description)}`);
                }
                console.log('');
            }
            // Summary
            console.log(chalk_1.default.dim(`Total: ${types.length} types (${builtinTypes.length} built-in, ${customTypes.length} custom)`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=list.js.map