/**
 * Registry Commands Barrel Export
 *
 * Exports all registry-related commands for plugin management.
 */

export { createInstallCommand } from './install';
export { createUninstallCommand } from './uninstall';
export { createListCommand } from './list';
export { createInfoCommand } from './info';
export { createSearchCommand } from './search';
export { createLockCommand } from './lock';
export { createUpdateCommand } from './update';

// Default exports
import createInstallCommand from './install';
import createUninstallCommand from './uninstall';
import createListCommand from './list';
import createInfoCommand from './info';
import createSearchCommand from './search';
import createLockCommand from './lock';
import createUpdateCommand from './update';

export default {
  install: createInstallCommand,
  uninstall: createUninstallCommand,
  list: createListCommand,
  info: createInfoCommand,
  search: createSearchCommand,
  lock: createLockCommand,
  update: createUpdateCommand,
};
