/**
 * Registry Commands Barrel Export
 *
 * Exports all registry-related commands for plugin management.
 */

import { Command } from 'commander';

// Plugin management commands
export { createInstallCommand } from './install';
export { createUninstallCommand } from './uninstall';
export { createListCommand } from './list';
export { createInfoCommand } from './info';
export { createSearchCommand } from './search';
export { createLockCommand } from './lock';
export { createUpdateCommand } from './update';

// Registry management commands
export { createRegistryAddCommand } from './registry-add';
export { createRegistryRemoveCommand } from './registry-remove';
export { createRegistryListCommand } from './registry-list';

// Default exports
import createInstallCommand from './install';
import createUninstallCommand from './uninstall';
import createListCommand from './list';
import createInfoCommand from './info';
import createSearchCommand from './search';
import createLockCommand from './lock';
import createUpdateCommand from './update';
import createRegistryAddCommand from './registry-add';
import createRegistryRemoveCommand from './registry-remove';
import createRegistryListCommand from './registry-list';

/**
 * Create parent registry command
 */
export function createRegistryCommand(): Command {
  const cmd = new Command('registry');

  cmd
    .description('Manage forge registries')
    .addCommand(createRegistryAddCommand())
    .addCommand(createRegistryRemoveCommand())
    .addCommand(createRegistryListCommand());

  return cmd;
}

export default {
  install: createInstallCommand,
  uninstall: createUninstallCommand,
  list: createListCommand,
  info: createInfoCommand,
  search: createSearchCommand,
  lock: createLockCommand,
  update: createUpdateCommand,
  registry: createRegistryCommand,
};
