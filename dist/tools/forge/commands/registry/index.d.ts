/**
 * Registry Commands Barrel Export
 *
 * Exports all registry-related commands for plugin management.
 */
import { Command } from 'commander';
export { createInstallCommand } from './install';
export { createUninstallCommand } from './uninstall';
export { createListCommand } from './list';
export { createInfoCommand } from './info';
export { createSearchCommand } from './search';
export { createLockCommand } from './lock';
export { createUpdateCommand } from './update';
export { createRegistryAddCommand } from './registry-add';
export { createRegistryRemoveCommand } from './registry-remove';
export { createRegistryListCommand } from './registry-list';
import createInstallCommand from './install';
import createUninstallCommand from './uninstall';
import createListCommand from './list';
import createInfoCommand from './info';
import createSearchCommand from './search';
import createLockCommand from './lock';
import createUpdateCommand from './update';
/**
 * Create parent registry command
 */
export declare function createRegistryCommand(): Command;
declare const _default: {
    install: typeof createInstallCommand;
    uninstall: typeof createUninstallCommand;
    list: typeof createListCommand;
    info: typeof createInfoCommand;
    search: typeof createSearchCommand;
    lock: typeof createLockCommand;
    update: typeof createUpdateCommand;
    registry: typeof createRegistryCommand;
};
export default _default;
//# sourceMappingURL=index.d.ts.map