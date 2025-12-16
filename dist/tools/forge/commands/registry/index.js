"use strict";
/**
 * Registry Commands Barrel Export
 *
 * Exports all registry-related commands for plugin management.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistryListCommand = exports.createRegistryRemoveCommand = exports.createRegistryAddCommand = exports.createUpdateCommand = exports.createLockCommand = exports.createSearchCommand = exports.createInfoCommand = exports.createListCommand = exports.createUninstallCommand = exports.createInstallCommand = void 0;
exports.createRegistryCommand = createRegistryCommand;
const commander_1 = require("commander");
// Plugin management commands
var install_1 = require("./install");
Object.defineProperty(exports, "createInstallCommand", { enumerable: true, get: function () { return install_1.createInstallCommand; } });
var uninstall_1 = require("./uninstall");
Object.defineProperty(exports, "createUninstallCommand", { enumerable: true, get: function () { return uninstall_1.createUninstallCommand; } });
var list_1 = require("./list");
Object.defineProperty(exports, "createListCommand", { enumerable: true, get: function () { return list_1.createListCommand; } });
var info_1 = require("./info");
Object.defineProperty(exports, "createInfoCommand", { enumerable: true, get: function () { return info_1.createInfoCommand; } });
var search_1 = require("./search");
Object.defineProperty(exports, "createSearchCommand", { enumerable: true, get: function () { return search_1.createSearchCommand; } });
var lock_1 = require("./lock");
Object.defineProperty(exports, "createLockCommand", { enumerable: true, get: function () { return lock_1.createLockCommand; } });
var update_1 = require("./update");
Object.defineProperty(exports, "createUpdateCommand", { enumerable: true, get: function () { return update_1.createUpdateCommand; } });
// Registry management commands
var registry_add_1 = require("./registry-add");
Object.defineProperty(exports, "createRegistryAddCommand", { enumerable: true, get: function () { return registry_add_1.createRegistryAddCommand; } });
var registry_remove_1 = require("./registry-remove");
Object.defineProperty(exports, "createRegistryRemoveCommand", { enumerable: true, get: function () { return registry_remove_1.createRegistryRemoveCommand; } });
var registry_list_1 = require("./registry-list");
Object.defineProperty(exports, "createRegistryListCommand", { enumerable: true, get: function () { return registry_list_1.createRegistryListCommand; } });
// Default exports
const install_2 = __importDefault(require("./install"));
const uninstall_2 = __importDefault(require("./uninstall"));
const list_2 = __importDefault(require("./list"));
const info_2 = __importDefault(require("./info"));
const search_2 = __importDefault(require("./search"));
const lock_2 = __importDefault(require("./lock"));
const update_2 = __importDefault(require("./update"));
const registry_add_2 = __importDefault(require("./registry-add"));
const registry_remove_2 = __importDefault(require("./registry-remove"));
const registry_list_2 = __importDefault(require("./registry-list"));
/**
 * Create parent registry command
 */
function createRegistryCommand() {
    const cmd = new commander_1.Command('registry');
    cmd
        .description('Manage forge registries')
        .addCommand((0, registry_add_2.default)())
        .addCommand((0, registry_remove_2.default)())
        .addCommand((0, registry_list_2.default)());
    return cmd;
}
exports.default = {
    install: install_2.default,
    uninstall: uninstall_2.default,
    list: list_2.default,
    info: info_2.default,
    search: search_2.default,
    lock: lock_2.default,
    update: update_2.default,
    registry: createRegistryCommand,
};
//# sourceMappingURL=index.js.map