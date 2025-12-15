"use strict";
/**
 * Agent Create Command
 *
 * Create a new agent definition
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentCreateCommand = agentCreateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const yaml = __importStar(require("js-yaml"));
const get_client_1 = require("../get-client");
/**
 * Validate agent name format
 */
function validateAgentName(name) {
    // Must be lowercase with hyphens, no special characters
    return /^[a-z][a-z0-9-]*$/.test(name);
}
/**
 * Generate agent YAML template
 */
function generateAgentYAML(name, options, config) {
    const defaults = config.defaults.agent;
    const agentDef = {
        name,
        type: 'agent',
        description: options.description || `${name} agent`,
        version: '1.0.0',
        tags: [],
    };
    if (options.extends) {
        agentDef.extends = options.extends;
    }
    agentDef.llm = {
        provider: options.model || defaults.model.provider,
        model: options.modelName || defaults.model.name,
        temperature: defaults.config.temperature,
        max_tokens: defaults.config.max_tokens,
    };
    agentDef.system_prompt = options.prompt || `You are a helpful ${name} agent.`;
    if (options.tools) {
        agentDef.tools = options.tools.split(',').map(t => t.trim());
    }
    else {
        agentDef.tools = [];
    }
    return yaml.dump(agentDef, { indent: 2, lineWidth: 100 });
}
function agentCreateCommand() {
    const cmd = new commander_1.Command('agent-create');
    cmd
        .description('Create a new agent definition')
        .argument('<name>', 'Agent name (lowercase-with-hyphens)')
        .option('--description <text>', 'Agent description')
        .option('--model <provider>', 'LLM provider (anthropic|openai|google)')
        .option('--model-name <name>', 'Model name (e.g., claude-sonnet-4)')
        .option('--tools <tools>', 'Tool references (comma-separated)')
        .option('--prompt <text>', 'System prompt')
        .option('--extends <agent>', 'Extend existing agent')
        .option('--interactive', 'Interactive creation mode')
        .action(async (name, options) => {
        try {
            // Validate name
            if (!validateAgentName(name)) {
                console.error(chalk_1.default.red('Error: Invalid agent name'));
                console.log(chalk_1.default.dim('Agent names must be lowercase-with-hyphens'));
                console.log(chalk_1.default.dim('Examples: my-agent, code-reviewer, test-agent'));
                process.exit(1);
            }
            const client = await (0, get_client_1.getClient)();
            const config = client.getConfig();
            const agentsPath = path.join(client.getProjectRoot(), config.registry.local.agents_path);
            const agentFile = path.join(agentsPath, `${name}.yaml`);
            // Check if agent already exists
            try {
                await fs.access(agentFile);
                console.error(chalk_1.default.red(`Error: Agent '${name}' already exists`));
                console.log(chalk_1.default.dim(`File: ${agentFile}`));
                process.exit(1);
            }
            catch {
                // File doesn't exist, continue
            }
            // Generate YAML
            const yamlContent = generateAgentYAML(name, options, config);
            // Write file
            await fs.writeFile(agentFile, yamlContent, 'utf-8');
            console.log(chalk_1.default.green('\n✓ Agent created successfully!'));
            console.log('');
            console.log(chalk_1.default.bold('Agent:'), chalk_1.default.cyan(name));
            console.log(chalk_1.default.bold('File:'), agentFile);
            console.log('');
            console.log(chalk_1.default.dim('Next steps:'));
            console.log(chalk_1.default.dim('  1. Edit the agent file to customize'));
            console.log(chalk_1.default.dim('  2. Validate:'), chalk_1.default.cyan(`fractary forge agent-validate ${name}`));
            console.log(chalk_1.default.dim('  3. View info:'), chalk_1.default.cyan(`fractary forge agent-info ${name}`));
            console.log('');
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
//# sourceMappingURL=agent-create.js.map