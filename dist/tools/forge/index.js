"use strict";
/**
 * Forge tool - Asset management and project scaffolding
 *
 * Exports the forge command for the unified Fractary CLI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForgeCommand = createForgeCommand;
const commander_1 = require("commander");
const create_1 = require("./commands/create");
const install_1 = require("./commands/install");
const update_1 = require("./commands/update");
const deploy_1 = require("./commands/deploy");
const diff_1 = require("./commands/diff");
const validate_1 = require("./commands/validate");
const list_1 = require("./commands/list");
const status_1 = require("./commands/status");
const remove_1 = require("./commands/remove");
const config_1 = require("./commands/config");
const search_1 = require("./commands/search");
/**
 * Create and configure the forge command
 */
function createForgeCommand() {
    const forge = new commander_1.Command('forge');
    forge
        .description('Asset management and project scaffolding')
        .version('1.0.0');
    // Register all commands
    const commands = [
        new create_1.CreateCommand(),
        new install_1.InstallCommand(),
        new update_1.UpdateCommand(),
        new deploy_1.DeployCommand(),
        new diff_1.DiffCommand(),
        new validate_1.ValidateCommand(),
        new list_1.ListCommand(),
        new status_1.StatusCommand(),
        new remove_1.RemoveCommand(),
        new config_1.ConfigCommand(),
        new search_1.SearchCommand(),
    ];
    commands.forEach(cmd => cmd.register(forge));
    return forge;
}
//# sourceMappingURL=index.js.map