"use strict";
/**
 * Agent List Command
 *
 * List available agents
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentListCommand = agentListCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../get-client");
const output_formatter_1 = require("../utils/output-formatter");
function agentListCommand() {
    const cmd = new commander_1.Command('agent-list');
    cmd
        .description('List available agents')
        .option('--tags <tags>', 'Filter by tags (comma-separated)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const client = await (0, get_client_1.getClient)();
            // Parse tags if provided
            const filters = {};
            if (options.tags) {
                filters.tags = options.tags.split(',').map((t) => t.trim());
            }
            const agents = await client.listAgents(filters);
            if (options.json) {
                console.log(JSON.stringify(agents, null, 2));
            }
            else {
                console.log((0, output_formatter_1.formatAgentList)(agents));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            if (error.message.includes('configuration')) {
                console.log(chalk_1.default.dim('\nRun "fractary forge init" to create a configuration.'));
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=agent-list.js.map