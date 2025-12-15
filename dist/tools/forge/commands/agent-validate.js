"use strict";
/**
 * Agent Validate Command
 *
 * Validate agent definition
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentValidateCommand = agentValidateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const get_client_1 = require("../get-client");
const validation_reporter_1 = require("../utils/validation-reporter");
function agentValidateCommand() {
    const cmd = new commander_1.Command('agent-validate');
    cmd
        .description('Validate agent definition')
        .argument('<name>', 'Agent name (with optional version, e.g., agent@1.0.0)')
        .option('--strict', 'Enable strict validation')
        .option('--check-tools', 'Verify all tool references exist')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const client = await (0, get_client_1.getClient)();
            // Resolve agent to trigger validation
            const resolved = await client.resolveAgent(name);
            // Basic validation result
            const result = {
                valid: true,
                name: resolved.definition.name,
                version: resolved.version,
                errors: [],
            };
            // Additional tool checking if requested
            if (options.checkTools && resolved.definition.tools) {
                for (const toolName of resolved.definition.tools) {
                    const exists = await client.hasTool(toolName);
                    if (!exists) {
                        result.valid = false;
                        result.errors.push({
                            message: `Tool not found: ${toolName}`,
                            path: 'tools',
                        });
                    }
                }
            }
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                validation_reporter_1.ValidationReporter.reportAgentValidation(result);
            }
            process.exit(result.valid ? 0 : 1);
        }
        catch (error) {
            const result = {
                valid: false,
                name,
                errors: [{ message: error.message }],
            };
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.error(chalk_1.default.red('Error:'), error.message);
                if (error.message.includes('not found')) {
                    console.log(chalk_1.default.dim('\nAgent definition not found.'));
                    console.log(chalk_1.default.dim('Check: .fractary/agents/<name>.yaml'));
                }
                else if (error.message.includes('configuration')) {
                    console.log(chalk_1.default.dim('\nRun "fractary forge init" to create a configuration.'));
                }
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=agent-validate.js.map