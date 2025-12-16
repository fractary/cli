"use strict";
/**
 * Forge Uninstall Command
 *
 * Uninstall plugins and components using the @fractary/forge Registry SDK.
 * Supports global and local uninstallation with confirmation prompts.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUninstallCommand = createUninstallCommand;
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const forge_1 = require("@fractary/forge");
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
/**
 * Create uninstall command
 */
function createUninstallCommand() {
    const cmd = new commander_1.Command('uninstall');
    cmd
        .description('Uninstall a plugin')
        .argument('<plugin>', 'Plugin name (e.g., @fractary/faber-plugin)')
        .option('-g, --global', 'Uninstall from global registry (~/.fractary/registry)')
        .option('-f, --force', 'Force uninstall without confirmation')
        .option('--save', 'Update lockfile after uninstall (default: true)', true)
        .option('-y, --yes', 'Skip confirmation prompt')
        .option('-v, --verbose', 'Show detailed uninstallation progress')
        .action(async (pluginName, options) => {
        try {
            await uninstallCommand(pluginName, options);
        }
        catch (error) {
            handleUninstallError(error, pluginName);
        }
    });
    return cmd;
}
/**
 * Uninstall command implementation
 */
async function uninstallCommand(pluginName, options) {
    // Parse plugin name (remove version if provided)
    const { name } = parsePluginIdentifier(pluginName);
    // Load configuration
    const { config, configSource } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Using ${configSource} configuration`));
    }
    // Determine scope
    const scope = options.global ? 'global' : 'local';
    const scopeText = scope === 'global' ? 'globally' : 'locally';
    // Check if plugin is installed
    const isInstalled = await checkPluginInstalled(name, scope);
    if (!isInstalled) {
        console.log(chalk_1.default.yellow(`⚠ Plugin ${chalk_1.default.bold(name)} is not installed ${scopeText}`));
        console.log();
        console.log(chalk_1.default.dim('Run this to see installed plugins:'));
        console.log(chalk_1.default.cyan(`  fractary forge list ${scope === 'global' ? '--global' : ''}`));
        process.exit(1);
    }
    // Confirm uninstallation (unless --force or --yes)
    if (!options.force && !options.yes) {
        const answer = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to uninstall ${chalk_1.default.bold(name)} ${scopeText}?`,
                default: false,
            },
        ]);
        if (!answer.confirm) {
            console.log(chalk_1.default.dim('Uninstall cancelled'));
            process.exit(0);
        }
    }
    if (options.verbose) {
        console.log();
        console.log(chalk_1.default.cyan(`Uninstalling ${name} ${scopeText}...`));
        console.log();
    }
    // Create progress spinner
    const spinner = (0, ora_1.default)((0, formatters_1.createProgressMessage)('Uninstalling', name)).start();
    try {
        // Call SDK uninstaller
        await forge_1.Registry.installer.uninstallPlugin(name, scope);
        // Stop spinner
        spinner.succeed();
        // Display success
        (0, formatters_1.formatSuccess)(`Uninstalled ${name} ${scopeText}`);
        // Note about lockfile
        if (options.save && scope === 'local') {
            console.log(chalk_1.default.dim('Lockfile will be updated (--save is enabled)'));
        }
        // Success exit
        process.exit(0);
    }
    catch (error) {
        spinner.fail();
        throw error;
    }
}
/**
 * Parse plugin identifier (strip version if provided)
 */
function parsePluginIdentifier(identifier) {
    const parts = identifier.split('@');
    // Handle scoped packages (@org/package or @org/package@version)
    if (identifier.startsWith('@')) {
        if (parts.length === 2) {
            // @org/package
            return { name: `@${parts[1]}` };
        }
        else if (parts.length === 3) {
            // @org/package@version - strip version
            return { name: `@${parts[1]}` };
        }
    }
    else {
        // Regular package or package@version
        if (parts.length === 1) {
            return { name: parts[0] };
        }
        else if (parts.length === 2) {
            // package@version - strip version
            return { name: parts[0] };
        }
    }
    throw new Error(`Invalid plugin identifier: ${identifier}`);
}
/**
 * Check if plugin is installed
 */
async function checkPluginInstalled(name, scope) {
    try {
        // Use local resolver to check installation
        const listMethod = scope === 'local'
            ? forge_1.Registry.localResolver.listProject.bind(forge_1.Registry.localResolver)
            : forge_1.Registry.localResolver.listGlobal.bind(forge_1.Registry.localResolver);
        // List all component types and check if any match
        const types = ['agent', 'tool', 'workflow', 'template'];
        for (const type of types) {
            const components = await listMethod(type);
            if (components.some((comp) => comp.plugin === name || comp.name === name)) {
                return true;
            }
        }
        return false;
    }
    catch (error) {
        // If we can't list, assume not installed
        return false;
    }
}
/**
 * Handle uninstallation errors with contextual help
 */
function handleUninstallError(error, pluginName) {
    const err = error;
    // Determine error type and provide helpful hints
    const hints = [];
    if (err.message.includes('not found') || err.message.includes('not installed')) {
        hints.push('Plugin is not installed');
        hints.push(`Run: fractary forge list`);
        hints.push(`Check spelling: ${pluginName}`);
    }
    else if (err.message.includes('permission') || err.message.includes('EACCES')) {
        hints.push('Permission denied');
        hints.push('Try with sudo for global uninstall: sudo fractary forge uninstall <name> --global');
        hints.push('Check file permissions');
    }
    else if (err.message.includes('in use') || err.message.includes('locked')) {
        hints.push('Plugin is currently in use');
        hints.push('Close any processes using the plugin');
        hints.push('Use --force to override (risky)');
    }
    else if (err.message.includes('dependency') || err.message.includes('required by')) {
        hints.push('Plugin is required by other installed plugins');
        hints.push('Uninstall dependent plugins first');
        hints.push('Or use --force to uninstall anyway (may break dependencies)');
    }
    (0, formatters_1.formatError)(err, 'Uninstallation failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createUninstallCommand;
//# sourceMappingURL=uninstall.js.map