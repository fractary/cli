"use strict";
/**
 * Forge Registry Remove Command
 *
 * Remove a registry from the configuration.
 * Prevents removing the last registry.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistryRemoveCommand = createRegistryRemoveCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
/**
 * Create registry remove command
 */
function createRegistryRemoveCommand() {
    const cmd = new commander_1.Command('remove');
    cmd
        .description('Remove a registry from configuration')
        .argument('<name>', 'Registry name to remove')
        .option('-f, --force', 'Force removal without confirmation')
        .option('-y, --yes', 'Skip confirmation prompt')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (name, options) => {
        try {
            await registryRemoveCommand(name, options);
        }
        catch (error) {
            handleRemoveError(error);
        }
    });
    return cmd;
}
/**
 * Registry remove command implementation
 */
async function registryRemoveCommand(name, options) {
    // Load current configuration
    const { config, configSource } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Configuration source: ${configSource}`));
        console.log();
    }
    // Find registry
    const registryIndex = config.registries.findIndex((r) => r.name === name);
    if (registryIndex === -1) {
        console.log(chalk_1.default.yellow(`⚠ Registry '${name}' not found`));
        console.log();
        console.log(chalk_1.default.dim('List registries with:'));
        console.log(chalk_1.default.cyan('  fractary forge registry list'));
        process.exit(0);
    }
    const registry = config.registries[registryIndex];
    // Prevent removing the last registry
    if (config.registries.length === 1) {
        console.error(chalk_1.default.red('✗ Cannot remove the last registry'));
        console.error();
        console.error(chalk_1.default.yellow('At least one registry must be configured.'));
        console.error(chalk_1.default.yellow('Add another registry before removing this one:'));
        console.error(chalk_1.default.cyan('  fractary forge registry add <name> <url>'));
        process.exit(1);
    }
    // Show what will be removed
    if (!options.force && !options.yes) {
        console.log();
        console.log(chalk_1.default.bold('Registry to be removed:'));
        console.log();
        console.log(`  Name:     ${chalk_1.default.cyan(registry.name)}`);
        console.log(`  Type:     ${chalk_1.default.cyan(registry.type)}`);
        console.log(`  URL:      ${chalk_1.default.cyan(registry.url)}`);
        console.log(`  Priority: ${chalk_1.default.cyan(registry.priority.toString())}`);
        console.log();
        // Confirm removal
        const answer = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Remove registry '${chalk_1.default.bold(name)}'?`,
                default: false,
            },
        ]);
        if (!answer.confirm) {
            console.log(chalk_1.default.dim('Removal cancelled'));
            process.exit(0);
        }
    }
    // Remove from configuration
    config.registries.splice(registryIndex, 1);
    // Save configuration
    await (0, forge_config_1.saveForgeConfig)(config);
    // Display success
    console.log();
    (0, formatters_1.formatSuccess)(`Registry '${name}' removed`);
    if (config.registries.length > 0) {
        console.log();
        console.log(chalk_1.default.dim(`Remaining registries: ${config.registries.length}`));
        if (options.verbose) {
            console.log();
            console.log(chalk_1.default.dim('Active registries:'));
            config.registries.forEach((r) => {
                const status = r.enabled ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                console.log(chalk_1.default.dim(`  ${status} ${r.name} (priority: ${r.priority})`));
            });
        }
    }
    process.exit(0);
}
/**
 * Handle remove command errors
 */
function handleRemoveError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('config')) {
        hints.push('Configuration error');
        hints.push('Run: fractary forge init');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied writing config');
        hints.push('Check file permissions');
    }
    (0, formatters_1.formatError)(err, 'Registry remove failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createRegistryRemoveCommand;
//# sourceMappingURL=registry-remove.js.map