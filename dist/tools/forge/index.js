"use strict";
/**
 * Forge tool - Asset management and project scaffolding
 *
 * Exports the forge command for the unified Fractary CLI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForgeCommand = createForgeCommand;
const commander_1 = require("commander");
// NOTE: Bundle/Starter commands temporarily disabled - they depend on old @fractary/forge SDK
// The new v1.1.1 SDK has incompatible exports (AgentAPI/ToolAPI instead of ProjectManifest/ConfigManager)
// These commands need to be migrated or the old SDK functionality needs to be restored
// import { CreateCommand } from './commands/create';
// import { InstallCommand } from './commands/install';
// import { UpdateCommand } from './commands/update';
// import { DeployCommand } from './commands/deploy';
// import { DiffCommand } from './commands/diff';
// import { ValidateCommand } from './commands/validate';
// import { ListCommand } from './commands/list';
// import { StatusCommand } from './commands/status';
// import { RemoveCommand } from './commands/remove';
// import { ConfigCommand } from './commands/config';
// import { SearchCommand } from './commands/search';
// Agent/Tool commands (using new SDK v1.1.1)
const init_1 = require("./commands/init");
const agent_create_1 = require("./commands/agent-create");
const agent_info_1 = require("./commands/agent-info");
const agent_list_1 = require("./commands/agent-list");
const agent_validate_1 = require("./commands/agent-validate");
// Registry commands (Phase 1-5 implementation)
const registry_1 = require("./commands/registry");
/**
 * Create and configure the forge command
 */
function createForgeCommand() {
    const forge = new commander_1.Command('forge');
    forge
        .description('Agent/tool definitions and asset management')
        .version('1.1.0');
    // Configuration commands
    forge.addCommand((0, init_1.initCommand)());
    // Agent management commands
    forge.addCommand((0, agent_create_1.agentCreateCommand)());
    forge.addCommand((0, agent_info_1.agentInfoCommand)());
    forge.addCommand((0, agent_list_1.agentListCommand)());
    forge.addCommand((0, agent_validate_1.agentValidateCommand)());
    // Registry management commands (Phase 1-5)
    forge.addCommand((0, registry_1.createInstallCommand)());
    forge.addCommand((0, registry_1.createUninstallCommand)());
    forge.addCommand((0, registry_1.createListCommand)());
    forge.addCommand((0, registry_1.createInfoCommand)());
    forge.addCommand((0, registry_1.createSearchCommand)());
    forge.addCommand((0, registry_1.createLockCommand)());
    forge.addCommand((0, registry_1.createUpdateCommand)());
    forge.addCommand((0, registry_1.createRegistryCommand)());
    forge.addCommand((0, registry_1.createCacheCommand)());
    forge.addCommand((0, registry_1.createForkCommand)());
    forge.addCommand((0, registry_1.createMergeCommand)());
    // NOTE: Bundle/Starter management commands temporarily disabled
    // See imports comment above for details
    // const commands = [
    //   new CreateCommand(),
    //   new InstallCommand(),
    //   new UpdateCommand(),
    //   new DeployCommand(),
    //   new DiffCommand(),
    //   new ValidateCommand(),
    //   new ListCommand(),
    //   new StatusCommand(),
    //   new RemoveCommand(),
    //   new ConfigCommand(),
    //   new SearchCommand(),
    // ];
    //
    // commands.forEach(cmd => cmd.register(forge));
    return forge;
}
//# sourceMappingURL=index.js.map