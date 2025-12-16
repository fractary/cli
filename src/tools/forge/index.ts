/**
 * Forge tool - Asset management and project scaffolding
 *
 * Exports the forge command for the unified Fractary CLI
 */

import { Command } from 'commander';
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
import { initCommand } from './commands/init';
import { agentCreateCommand } from './commands/agent-create';
import { agentInfoCommand } from './commands/agent-info';
import { agentListCommand } from './commands/agent-list';
import { agentValidateCommand } from './commands/agent-validate';

// Registry commands (Phase 1-6 implementation)
import {
  createInstallCommand,
  createUninstallCommand,
  createListCommand,
  createInfoCommand,
  createSearchCommand,
  createLockCommand,
  createUpdateCommand,
  createRegistryCommand,
  createCacheCommand,
  createForkCommand,
  createMergeCommand,
  createLoginCommand,
  createLogoutCommand,
  createWhoamiCommand,
} from './commands/registry';

/**
 * Create and configure the forge command
 */
export function createForgeCommand(): Command {
  const forge = new Command('forge');

  forge
    .description('Agent/tool definitions and asset management')
    .version('1.1.0');

  // Configuration commands
  forge.addCommand(initCommand());

  // Agent management commands
  forge.addCommand(agentCreateCommand());
  forge.addCommand(agentInfoCommand());
  forge.addCommand(agentListCommand());
  forge.addCommand(agentValidateCommand());

  // Registry management commands (Phase 1-6)
  forge.addCommand(createInstallCommand());
  forge.addCommand(createUninstallCommand());
  forge.addCommand(createListCommand());
  forge.addCommand(createInfoCommand());
  forge.addCommand(createSearchCommand());
  forge.addCommand(createLockCommand());
  forge.addCommand(createUpdateCommand());
  forge.addCommand(createRegistryCommand());
  forge.addCommand(createCacheCommand());
  forge.addCommand(createForkCommand());
  forge.addCommand(createMergeCommand());
  forge.addCommand(createLoginCommand());
  forge.addCommand(createLogoutCommand());
  forge.addCommand(createWhoamiCommand());

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
