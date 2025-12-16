"use strict";
/**
 * Forge Registry List Command
 *
 * List all configured registries with their settings.
 * Shows name, type, URL, status, and priority.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistryListCommand = createRegistryListCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
/**
 * Create registry list command
 */
function createRegistryListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List all configured registries')
        .option('--json', 'Output as JSON')
        .option('-v, --verbose', 'Show detailed registry information')
        .action(async (options) => {
        try {
            await registryListCommand(options);
        }
        catch (error) {
            handleListError(error);
        }
    });
    return cmd;
}
/**
 * Registry list command implementation
 */
async function registryListCommand(options) {
    // Load configuration
    const { config, configSource } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose && !options.json) {
        console.log(chalk_1.default.dim(`Configuration source: ${configSource}`));
        console.log();
    }
    // Check if any registries configured
    if (!config.registries || config.registries.length === 0) {
        console.log(chalk_1.default.yellow('No registries configured'));
        console.log();
        console.log(chalk_1.default.dim('Add a registry with:'));
        console.log(chalk_1.default.cyan('  fractary forge registry add <name> <url>'));
        process.exit(0);
    }
    // Output as JSON
    if (options.json) {
        console.log(JSON.stringify(config.registries, null, 2));
        process.exit(0);
    }
    // Display as table
    console.log();
    console.log(chalk_1.default.bold.cyan('Configured Registries'));
    console.log(chalk_1.default.dim('─'.repeat(100)));
    console.log();
    const table = new cli_table3_1.default({
        head: [
            'Name',
            'Type',
            'URL',
            'Status',
            'Priority',
            ...(options.verbose ? ['Cache TTL'] : []),
        ].map((h) => chalk_1.default.cyan(h)),
        style: {
            head: [],
            border: [],
        },
        colWidths: [20, 12, 50, 10, 10, ...(options.verbose ? [12] : [])],
    });
    for (const registry of config.registries) {
        const row = [
            registry.name,
            registry.type,
            truncateUrl(registry.url, 45),
            registry.enabled ? chalk_1.default.green('Enabled') : chalk_1.default.red('Disabled'),
            registry.priority.toString(),
        ];
        if (options.verbose) {
            row.push(`${registry.cache_ttl || 3600}s`);
        }
        table.push(row);
    }
    console.log(table.toString());
    console.log();
    console.log(chalk_1.default.dim(`Total: ${config.registries.length} registr${config.registries.length === 1 ? 'y' : 'ies'}`));
    if (options.verbose) {
        console.log();
        console.log(chalk_1.default.dim('Registry priority: Higher numbers are checked first'));
        console.log(chalk_1.default.dim('Cache TTL: How long manifests are cached (in seconds)'));
    }
    process.exit(0);
}
/**
 * Truncate URL for display
 */
function truncateUrl(url, maxLength) {
    if (url.length <= maxLength)
        return url;
    const start = url.substring(0, maxLength - 3);
    return `${start}...`;
}
/**
 * Handle list command errors
 */
function handleListError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('config') || err.message.includes('not found')) {
        hints.push('Configuration not found');
        hints.push('Run: fractary forge init');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied reading config');
        hints.push('Check file permissions');
    }
    (0, formatters_1.formatError)(err, 'Registry list failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createRegistryListCommand;
//# sourceMappingURL=registry-list.js.map