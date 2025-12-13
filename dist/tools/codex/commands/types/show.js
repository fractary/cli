"use strict";
/**
 * Types show command
 *
 * Shows details for a specific artifact type
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
exports.typesShowCommand = typesShowCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const file_scanner_1 = require("../../utils/file-scanner");
/**
 * Built-in artifact types from SDK v3.0
 */
const BUILT_IN_TYPES = {
    docs: {
        pattern: 'docs/**/*.md',
        description: 'Documentation files including guides, tutorials, and API references',
        ttl: '24h',
        examples: [
            'codex://org/project/docs/api.md',
            'codex://org/project/docs/guides/getting-started.md'
        ]
    },
    specs: {
        pattern: 'specs/**/*.md',
        description: 'Specification documents defining system behavior and architecture',
        ttl: '7d',
        examples: [
            'codex://org/project/specs/SPEC-0001.md',
            'codex://org/project/specs/architecture/overview.md'
        ]
    },
    logs: {
        pattern: 'logs/**/*.md',
        description: 'Session logs, conversation summaries, and decision records',
        ttl: '24h',
        examples: [
            'codex://org/project/logs/2025-01-15-session.md',
            'codex://org/project/logs/decisions/ADR-001.md'
        ]
    },
    standards: {
        pattern: 'standards/**/*.md',
        description: 'Coding standards, process guidelines, and best practices',
        ttl: '7d',
        examples: [
            'codex://org/project/standards/typescript.md',
            'codex://org/project/standards/git-workflow.md'
        ]
    },
    templates: {
        pattern: 'templates/**/*',
        description: 'File and project templates for code generation',
        ttl: '7d',
        examples: [
            'codex://org/project/templates/component.tsx.hbs',
            'codex://org/project/templates/spec.md.hbs'
        ]
    },
    state: {
        pattern: 'state/**/*.json',
        description: 'Persistent state files for cross-session data',
        ttl: '1h',
        examples: [
            'codex://org/project/state/project-status.json',
            'codex://org/project/state/metrics.json'
        ]
    }
};
/**
 * Get config directory path
 */
function getConfigDir() {
    return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}
/**
 * Load custom types from config
 */
async function loadCustomTypes() {
    const configPath = path.join(getConfigDir(), 'config.json');
    try {
        if (await (0, file_scanner_1.fileExists)(configPath)) {
            const content = await (0, file_scanner_1.readFileContent)(configPath);
            const config = JSON.parse(content);
            return config.types?.custom || {};
        }
    }
    catch {
        // Config load failed
    }
    return {};
}
function typesShowCommand() {
    const cmd = new commander_1.Command('show');
    cmd
        .description('Show details for a specific type')
        .argument('<name>', 'Type name')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const customTypes = await loadCustomTypes();
            // Check built-in types first
            if (BUILT_IN_TYPES[name]) {
                const type = BUILT_IN_TYPES[name];
                if (options.json) {
                    console.log(JSON.stringify({
                        name,
                        builtin: true,
                        pattern: type.pattern,
                        description: type.description,
                        ttl: type.ttl,
                        examples: type.examples
                    }, null, 2));
                    return;
                }
                console.log(chalk_1.default.bold(`Type: ${chalk_1.default.cyan(name)}\n`));
                console.log(`  ${chalk_1.default.dim('Source:')}      Built-in`);
                console.log(`  ${chalk_1.default.dim('Pattern:')}     ${type.pattern}`);
                console.log(`  ${chalk_1.default.dim('TTL:')}         ${type.ttl}`);
                console.log(`  ${chalk_1.default.dim('Description:')} ${type.description}`);
                console.log('');
                console.log(chalk_1.default.bold('Examples'));
                for (const example of type.examples) {
                    console.log(`  ${chalk_1.default.dim('•')} ${example}`);
                }
                return;
            }
            // Check custom types
            if (customTypes[name]) {
                const type = customTypes[name];
                if (options.json) {
                    console.log(JSON.stringify({
                        name,
                        builtin: false,
                        pattern: type.pattern,
                        description: type.description || 'Custom type',
                        ttl: type.ttl || '24h'
                    }, null, 2));
                    return;
                }
                console.log(chalk_1.default.bold(`Type: ${chalk_1.default.green(name)}\n`));
                console.log(`  ${chalk_1.default.dim('Source:')}      Custom`);
                console.log(`  ${chalk_1.default.dim('Pattern:')}     ${type.pattern}`);
                console.log(`  ${chalk_1.default.dim('TTL:')}         ${type.ttl || '24h'}`);
                console.log(`  ${chalk_1.default.dim('Description:')} ${type.description || 'Custom type'}`);
                return;
            }
            // Type not found
            console.error(chalk_1.default.red('Error:'), `Type "${name}" not found.`);
            console.log(chalk_1.default.dim('Run "fractary codex types list" to see available types.'));
            process.exit(1);
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=show.js.map