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

// Cache management commands
export { createCacheClearCommand } from './cache-clear';
export { createCacheStatsCommand } from './cache-stats';

// Fork and merge commands
export { createForkCommand } from './fork';
export { createMergeCommand } from './merge';

// Authentication commands
export { createLoginCommand } from './login';
export { createLogoutCommand } from './logout';
export { createWhoamiCommand } from './whoami';

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
import createCacheClearCommand from './cache-clear';
import createCacheStatsCommand from './cache-stats';
import createForkCommand from './fork';
import createMergeCommand from './merge';
import createLoginCommand from './login';
import createLogoutCommand from './logout';
import createWhoamiCommand from './whoami';

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

/**
 * Create parent cache command
 */
export function createCacheCommand(): Command {
  const cmd = new Command('cache');

  cmd
    .description('Manage manifest cache')
    .addCommand(createCacheClearCommand())
    .addCommand(createCacheStatsCommand());

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
  cache: createCacheCommand,
};
