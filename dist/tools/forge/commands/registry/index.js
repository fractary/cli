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
exports.createUpdateCommand = exports.createLockCommand = exports.createSearchCommand = exports.createInfoCommand = exports.createListCommand = exports.createUninstallCommand = exports.createInstallCommand = void 0;
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
// Default exports
const install_2 = __importDefault(require("./install"));
const uninstall_2 = __importDefault(require("./uninstall"));
const list_2 = __importDefault(require("./list"));
const info_2 = __importDefault(require("./info"));
const search_2 = __importDefault(require("./search"));
const lock_2 = __importDefault(require("./lock"));
const update_2 = __importDefault(require("./update"));
exports.default = {
    install: install_2.default,
    uninstall: uninstall_2.default,
    list: list_2.default,
    info: info_2.default,
    search: search_2.default,
    lock: lock_2.default,
    update: update_2.default,
};
//# sourceMappingURL=index.js.map