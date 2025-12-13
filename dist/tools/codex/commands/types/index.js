"use strict";
/**
 * Types command group (v3.0)
 *
 * Manages the artifact type registry:
 * - list: View all types (built-in and custom)
 * - show: View details for a specific type
 * - add: Register a custom type
 * - remove: Unregister a custom type
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.typesCommand = typesCommand;
const commander_1 = require("commander");
const list_1 = require("./list");
const show_1 = require("./show");
const add_1 = require("./add");
const remove_1 = require("./remove");
function typesCommand() {
    const cmd = new commander_1.Command('types');
    cmd
        .description('Manage artifact type registry');
    // Register subcommands
    cmd.addCommand((0, list_1.typesListCommand)());
    cmd.addCommand((0, show_1.typesShowCommand)());
    cmd.addCommand((0, add_1.typesAddCommand)());
    cmd.addCommand((0, remove_1.typesRemoveCommand)());
    return cmd;
}
//# sourceMappingURL=index.js.map