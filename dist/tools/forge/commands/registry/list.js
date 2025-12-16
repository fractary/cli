"use strict";
/**
 * Forge List Command
 *
 * List installed plugins and components from local and global registries.
 * Supports filtering by type, scope, and JSON output.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListCommand = createListCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const forge_1 = require("@fractary/forge");
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
/**
 * Create list command
 */
function createListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List installed plugins and components')
        .option('-g, --global', 'List globally installed components')
        .option('-l, --local', 'List locally installed components')
        .option('-t, --type <type>', 'Filter by component type (agents, tools, workflows, templates)')
        .option('--json', 'Output as JSON')
        .option('--updates', 'Check for available updates (requires network)')
        .option('-v, --verbose', 'Show detailed information including paths')
        .action(async (options) => {
        try {
            await listCommand(options);
        }
        catch (error) {
            handleListError(error);
        }
    });
    return cmd;
}
/**
 * List command implementation
 */
async function listCommand(options) {
    // Load configuration
    const { config, configSource } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose && !options.json) {
        console.log(chalk_1.default.dim(`Using ${configSource} configuration`));
        console.log();
    }
    // Determine scope to list
    const scopes = determineScopes(options);
    // Validate component type if provided
    if (options.type) {
        validateComponentType(options.type);
    }
    // Collect components from all scopes
    const allComponents = [];
    for (const scope of scopes) {
        try {
            // Use appropriate list method based on scope
            const listMethod = scope === 'local'
                ? forge_1.Registry.localResolver.listProject.bind(forge_1.Registry.localResolver)
                : forge_1.Registry.localResolver.listGlobal.bind(forge_1.Registry.localResolver);
            const components = options.type
                ? await listMethod(options.type)
                : await forge_1.Registry.localResolver.listAll(options.type || 'agent');
            // Add scope to each component
            components.forEach((comp) => {
                allComponents.push({
                    ...comp,
                    scope,
                });
            });
        }
        catch (error) {
            if (options.verbose && !options.json) {
                (0, formatters_1.formatWarning)(`Failed to list ${scope} components: ${error.message}`);
            }
        }
    }
    // Check for updates if requested
    if (options.updates) {
        await checkForUpdates(allComponents);
    }
    // Output results
    if (options.json) {
        outputJson(allComponents);
    }
    else {
        outputTable(allComponents, {
            showPath: options.verbose,
            showUpdates: options.updates,
        });
    }
    process.exit(0);
}
/**
 * Determine which scopes to list based on options
 */
function determineScopes(options) {
    // If both specified or neither specified, list both
    if ((options.global && options.local) || (!options.global && !options.local)) {
        return ['local', 'global'];
    }
    // Otherwise, list only the specified scope
    if (options.global) {
        return ['global'];
    }
    return ['local'];
}
/**
 * Validate component type
 */
function validateComponentType(type) {
    const validTypes = ['agent', 'tool', 'workflow', 'template', 'plugin'];
    if (!validTypes.includes(type)) {
        console.error(chalk_1.default.red(`✗ Invalid component type: ${type}`));
        console.error();
        console.error(chalk_1.default.yellow('Valid types:'));
        validTypes.forEach((t) => {
            console.error(chalk_1.default.yellow(`  • ${t}`));
        });
        process.exit(1);
    }
}
/**
 * Check for updates for components
 */
async function checkForUpdates(components) {
    // TODO: Implement update checking in Phase 2
    // This will require:
    // 1. Fetching latest versions from registries
    // 2. Comparing with installed versions using semver
    // 3. Adding 'updateAvailable' field to components
    // For now, this is a placeholder
    // Will be implemented when UpdateChecker is added in Phase 2
}
/**
 * Output components as JSON
 */
function outputJson(components) {
    const output = components.map((comp) => ({
        name: comp.name,
        type: comp.type,
        version: comp.version || null,
        source: comp.source,
        scope: comp.scope,
        path: comp.path || null,
        plugin: comp.plugin || null,
        isProject: comp.isProject || false,
    }));
    console.log(JSON.stringify(output, null, 2));
}
/**
 * Output components as formatted table
 */
function outputTable(components, options) {
    if (components.length === 0) {
        console.log(chalk_1.default.dim('No components found.'));
        console.log();
        console.log(chalk_1.default.dim('Install a plugin with:'));
        console.log(chalk_1.default.cyan('  fractary forge install <plugin-name>'));
        return;
    }
    // Group components by scope
    const localComponents = components.filter((c) => c.scope === 'local');
    const globalComponents = components.filter((c) => c.scope === 'global');
    // Display local components
    if (localComponents.length > 0) {
        console.log();
        console.log(chalk_1.default.bold.cyan('Local Components'));
        console.log(chalk_1.default.dim('─'.repeat(60)));
        (0, formatters_1.formatComponentTable)(localComponents.map((c) => ({
            name: c.name,
            type: c.type,
            version: c.version,
            source: c.plugin || c.source,
            path: c.path,
        })), { showPath: options.showPath });
    }
    // Display global components
    if (globalComponents.length > 0) {
        console.log();
        console.log(chalk_1.default.bold.cyan('Global Components'));
        console.log(chalk_1.default.dim('─'.repeat(60)));
        (0, formatters_1.formatComponentTable)(globalComponents.map((c) => ({
            name: c.name,
            type: c.type,
            version: c.version,
            source: c.plugin || c.source,
            path: c.path,
        })), { showPath: options.showPath });
    }
    // Show update notice if requested but not implemented
    if (options.showUpdates) {
        console.log();
        console.log(chalk_1.default.dim('Note: Update checking will be available in Phase 2 (forge update command)'));
    }
}
/**
 * Handle list errors
 */
function handleListError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('permission') || err.message.includes('EACCES')) {
        hints.push('Permission denied reading component directories');
        hints.push('Check file permissions');
    }
    else if (err.message.includes('not found') || err.message.includes('ENOENT')) {
        hints.push('Component directory not found');
        hints.push('Run: fractary forge init');
    }
    console.error();
    console.error(chalk_1.default.red(`✗ List failed: ${err.message}`));
    if (hints.length > 0) {
        console.error();
        console.error(chalk_1.default.yellow('Try:'));
        hints.forEach((hint) => {
            console.error(chalk_1.default.yellow(`  • ${hint}`));
        });
    }
    if (process.env.DEBUG) {
        console.error();
        console.error(chalk_1.default.dim('Stack trace:'));
        console.error(chalk_1.default.dim(err.stack));
    }
    console.error();
    process.exit(1);
}
// Export for use in index
exports.default = createListCommand;
//# sourceMappingURL=list.js.map