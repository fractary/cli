"use strict";
/**
 * Cache command group (v3.0)
 *
 * Manages the codex document cache with subcommands:
 * - list: View cached entries
 * - clear: Remove cache entries
 * - stats: Display cache statistics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheCommand = cacheCommand;
const commander_1 = require("commander");
const list_1 = require("./list");
const clear_1 = require("./clear");
const stats_1 = require("./stats");
function cacheCommand() {
    const cmd = new commander_1.Command('cache');
    cmd
        .description('Manage the codex document cache');
    // Register subcommands
    cmd.addCommand((0, list_1.cacheListCommand)());
    cmd.addCommand((0, clear_1.cacheClearCommand)());
    cmd.addCommand((0, stats_1.cacheStatsCommand)());
    return cmd;
}
//# sourceMappingURL=index.js.map