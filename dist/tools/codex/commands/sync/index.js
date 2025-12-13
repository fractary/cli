"use strict";
/**
 * Sync command group (v3.0)
 *
 * Bidirectional synchronization with codex repository:
 * - project: Sync single project
 * - org: Sync all projects in organization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCommand = syncCommand;
const commander_1 = require("commander");
const project_1 = require("./project");
const org_1 = require("./org");
function syncCommand() {
    const cmd = new commander_1.Command('sync');
    cmd
        .description('Synchronize with codex repository');
    // Register subcommands
    cmd.addCommand((0, project_1.syncProjectCommand)());
    cmd.addCommand((0, org_1.syncOrgCommand)());
    return cmd;
}
//# sourceMappingURL=index.js.map