"use strict";
/**
 * Forge Update Command
 *
 * Check for and install updates for installed plugins.
 * Supports updating individual plugins or all at once.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateCommand = createUpdateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const forge_1 = require("@fractary/forge");
const update_checker_1 = require("../../utils/update-checker");
const lockfile_manager_1 = require("../../utils/lockfile-manager");
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
const cli_table3_1 = __importDefault(require("cli-table3"));
/**
 * Create update command
 */
function createUpdateCommand() {
    const cmd = new commander_1.Command('update');
    cmd
        .description('Check for and install updates for installed plugins')
        .argument('[name]', 'Plugin name (optional, updates all if not provided)')
        .option('-a, --all', 'Update all installed plugins')
        .option('-g, --global', 'Update global installations')
        .option('--major', 'Include major version updates')
        .option('--dry-run', 'Preview updates without installing')
        .option('--save', 'Update lockfile after installing (default: true)', true)
        .option('-v, --verbose', 'Show detailed update information')
        .action(async (name, options) => {
        try {
            await updateCommand(name, options);
        }
        catch (error) {
            handleUpdateError(error);
        }
    });
    return cmd;
}
/**
 * Update command implementation
 */
async function updateCommand(pluginName, options) {
    // Load configuration
    const { config } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose) {
        console.log(chalk_1.default.dim('Checking for available updates...'));
        console.log();
    }
    // Get list of installed components
    let components = [];
    try {
        const types = ['agent', 'tool', 'workflow', 'template'];
        for (const type of types) {
            const listMethod = options.global
                ? forge_1.Registry.localResolver.listGlobal.bind(forge_1.Registry.localResolver)
                : forge_1.Registry.localResolver.listProject.bind(forge_1.Registry.localResolver);
            const comps = await listMethod(type);
            components.push(...comps);
        }
    }
    catch (error) {
        throw new Error(`Failed to list components: ${error.message}`);
    }
    if (components.length === 0) {
        console.log(chalk_1.default.yellow('No components installed'));
        process.exit(0);
    }
    // Filter components if name provided
    if (pluginName) {
        components = components.filter((c) => c.name === pluginName || c.plugin === pluginName);
        if (components.length === 0) {
            console.log(chalk_1.default.yellow(`Plugin '${pluginName}' not found`));
            process.exit(0);
        }
    }
    // Check for updates
    const updateInfos = await (0, update_checker_1.checkAllComponentUpdates)(components);
    const suggestions = (0, update_checker_1.getUpdateSuggestions)(updateInfos, {
        majorOnly: options.major,
    });
    // Display results
    if (suggestions.length === 0) {
        console.log(chalk_1.default.green('✓ All components are up to date'));
        process.exit(0);
    }
    // Show available updates table
    console.log(chalk_1.default.bold.cyan('Available Updates'));
    console.log(chalk_1.default.dim('─'.repeat(80)));
    console.log();
    const table = new cli_table3_1.default({
        head: ['Component', 'Current', 'Latest', 'Type'].map((h) => chalk_1.default.cyan(h)),
        style: {
            head: [],
            border: [],
        },
    });
    for (const info of suggestions) {
        table.push([
            info.name,
            chalk_1.default.yellow(info.current),
            chalk_1.default.green(info.latest),
            getUpdateTypeLabel(info.updateType),
        ]);
    }
    console.log(table.toString());
    console.log();
    // Show summary
    console.log(chalk_1.default.dim(`${suggestions.length} update(s) available`));
    console.log();
    // In dry-run mode, show what would be done
    if (options.dryRun) {
        console.log(chalk_1.default.dim('(Dry run - no changes will be made)'));
        process.exit(0);
    }
    // In non-interactive mode, show what will be done
    if (options.verbose) {
        console.log(chalk_1.default.cyan('Installing updates...'));
        console.log();
    }
    // Install updates
    let installCount = 0;
    let failureCount = 0;
    for (const info of suggestions) {
        try {
            const component = components.find((c) => c.name === info.name);
            if (!component)
                continue;
            if (options.verbose) {
                console.log(`Updating ${info.name} from ${info.current} to ${info.latest}...`);
            }
            // Install updated version
            const installOptions = {
                scope: options.global ? 'global' : 'local',
                force: true,
                agentsOnly: component.type === 'agent',
                toolsOnly: component.type === 'tool',
                workflowsOnly: component.type === 'workflow',
                templatesOnly: component.type === 'template',
            };
            const result = await forge_1.Registry.installer.installPlugin(`${info.name}@${info.latest}`, installOptions);
            if (result.success) {
                installCount++;
            }
            else {
                failureCount++;
                if (options.verbose) {
                    (0, formatters_1.formatWarning)(`Failed to update ${info.name}: ${result.error}`);
                }
            }
        }
        catch (error) {
            failureCount++;
            if (options.verbose) {
                (0, formatters_1.formatWarning)(`Error updating ${info.name}: ${error.message}`);
            }
        }
    }
    // Update lockfile if requested
    if (options.save && installCount > 0) {
        try {
            const lockfilePath = await (0, lockfile_manager_1.getLocalLockfilePath)();
            let lockfile = await (0, lockfile_manager_1.loadLockfile)(lockfilePath);
            if (!lockfile) {
                console.log(chalk_1.default.dim('Lockfile not found, skipping update'));
            }
            else {
                // Reload components to get updated versions
                const updatedComponents = [];
                const types = ['agent', 'tool', 'workflow', 'template'];
                for (const type of types) {
                    const listMethod = options.global
                        ? forge_1.Registry.localResolver.listGlobal.bind(forge_1.Registry.localResolver)
                        : forge_1.Registry.localResolver.listProject.bind(forge_1.Registry.localResolver);
                    const comps = await listMethod(type);
                    updatedComponents.push(...comps);
                }
                // Update lockfile
                for (const comp of updatedComponents) {
                    lockfile = (0, lockfile_manager_1.mergeLockEntry)(lockfile, comp);
                }
                await (0, lockfile_manager_1.saveLockfile)(lockfile, lockfilePath);
            }
        }
        catch (error) {
            (0, formatters_1.formatWarning)(`Could not update lockfile: ${error.message}`);
        }
    }
    // Show results
    console.log();
    if (failureCount === 0) {
        (0, formatters_1.formatSuccess)(`Updated ${installCount} component(s)`);
    }
    else {
        (0, formatters_1.formatWarning)(`Updated ${installCount} component(s), ${failureCount} failed`);
    }
    process.exit(0);
}
/**
 * Get display label for update type
 */
function getUpdateTypeLabel(type) {
    const labels = {
        major: chalk_1.default.red('Major'),
        minor: chalk_1.default.yellow('Minor'),
        patch: chalk_1.default.green('Patch'),
        none: chalk_1.default.dim('None'),
    };
    return labels[type] || type;
}
/**
 * Handle update command errors
 */
function handleUpdateError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('network') || err.message.includes('ENOTFOUND')) {
        hints.push('Network error - check internet connection');
        hints.push('Verify registry URLs are accessible');
    }
    else if (err.message.includes('no components')) {
        hints.push('No components installed');
        hints.push('Install a plugin first: fractary forge install <plugin>');
    }
    else if (err.message.includes('not found')) {
        hints.push('Plugin not found');
        hints.push('Check plugin name spelling');
        hints.push('List installed: fractary forge list');
    }
    (0, formatters_1.formatError)(err, 'Update failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createUpdateCommand;
//# sourceMappingURL=update.js.map