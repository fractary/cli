/**
 * Forge tool - Asset management and project scaffolding
 *
 * Exports the forge command for the unified Fractary CLI
 */

import { Command } from 'commander';
import { CreateCommand } from './commands/create';
import { InstallCommand } from './commands/install';
import { UpdateCommand } from './commands/update';
import { DeployCommand } from './commands/deploy';
import { DiffCommand } from './commands/diff';
import { ValidateCommand } from './commands/validate';
import { ListCommand } from './commands/list';
import { StatusCommand } from './commands/status';
import { RemoveCommand } from './commands/remove';
import { ConfigCommand } from './commands/config';
import { SearchCommand } from './commands/search';

/**
 * Create and configure the forge command
 */
export function createForgeCommand(): Command {
  const forge = new Command('forge');

  forge
    .description('Asset management and project scaffolding')
    .version('1.0.0');

  // Register all commands
  const commands = [
    new CreateCommand(),
    new InstallCommand(),
    new UpdateCommand(),
    new DeployCommand(),
    new DiffCommand(),
    new ValidateCommand(),
    new ListCommand(),
    new StatusCommand(),
    new RemoveCommand(),
    new ConfigCommand(),
    new SearchCommand(),
  ];

  commands.forEach(cmd => cmd.register(forge));

  return forge;
}
