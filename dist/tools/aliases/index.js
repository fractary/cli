"use strict";
/**
 * Top-level command aliases
 *
 * Provides shortcuts to faber subcommands:
 * - work → faber work
 * - repo → faber repo
 * - spec → faber spec
 * - logs → faber logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkAliasCommand = createWorkAliasCommand;
exports.createRepoAliasCommand = createRepoAliasCommand;
exports.createSpecAliasCommand = createSpecAliasCommand;
exports.createLogsAliasCommand = createLogsAliasCommand;
// Re-export the command creators from faber subcommands
const work_1 = require("../faber/commands/work");
const repo_1 = require("../faber/commands/repo");
const spec_1 = require("../faber/commands/spec");
const logs_1 = require("../faber/commands/logs");
/**
 * Create work alias command (top-level shortcut to faber work)
 */
function createWorkAliasCommand() {
    const work = (0, work_1.createWorkCommand)();
    work.description('Work item tracking (alias for: faber work)');
    return work;
}
/**
 * Create repo alias command (top-level shortcut to faber repo)
 */
function createRepoAliasCommand() {
    const repo = (0, repo_1.createRepoCommand)();
    repo.description('Repository operations (alias for: faber repo)');
    return repo;
}
/**
 * Create spec alias command (top-level shortcut to faber spec)
 */
function createSpecAliasCommand() {
    const spec = (0, spec_1.createSpecCommand)();
    spec.description('Specification management (alias for: faber spec)');
    return spec;
}
/**
 * Create logs alias command (top-level shortcut to faber logs)
 */
function createLogsAliasCommand() {
    const logs = (0, logs_1.createLogsCommand)();
    logs.description('Log management (alias for: faber logs)');
    return logs;
}
//# sourceMappingURL=index.js.map