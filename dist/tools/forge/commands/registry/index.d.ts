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
import createInstallCommand from './install';
import createUninstallCommand from './uninstall';
import createListCommand from './list';
import createInfoCommand from './info';
import createSearchCommand from './search';
declare const _default: {
    install: typeof createInstallCommand;
    uninstall: typeof createUninstallCommand;
    list: typeof createListCommand;
    info: typeof createInfoCommand;
    search: typeof createSearchCommand;
};
export default _default;
//# sourceMappingURL=index.d.ts.map