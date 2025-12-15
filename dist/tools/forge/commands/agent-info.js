"use strict";
/**
 * Agent Info Command
 *
 * Display information about an agent
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentInfoCommand = agentInfoCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../get-client");
const output_formatter_1 = require("../utils/output-formatter");
function agentInfoCommand() {
    const cmd = new commander_1.Command('agent-info');
    cmd
        .description('Show agent information')
        .argument('<name>', 'Agent name (with optional version, e.g., agent@1.0.0)')
        .option('--json', 'Output as JSON')
        .option('--show-tools', 'Show detailed tool information')
        .option('--show-prompt', 'Include full system prompt')
        .action(async (name, options) => {
        try {
            const client = await (0, get_client_1.getClient)();
            const info = await client.getAgentInfo(name);
            if (options.json) {
                console.log(JSON.stringify(info, null, 2));
            }
            else {
                console.log((0, output_formatter_1.formatAgentInfo)(info, {
                    showTools: options.showTools,
                    showPrompt: options.showPrompt,
                }));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            if (error.message.includes('not found')) {
                console.log(chalk_1.default.dim('\nAgent not found in any registry.'));
                console.log(chalk_1.default.dim('Available registries: local, global, stockyard'));
                console.log(chalk_1.default.dim('Run "fractary forge agent-list" to see available agents.'));
            }
            else if (error.message.includes('configuration')) {
                console.log(chalk_1.default.dim('\nRun "fractary forge init" to create a configuration.'));
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=agent-info.js.map