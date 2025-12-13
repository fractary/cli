"use strict";
/**
 * Types list command
 *
 * Lists all artifact types (built-in and custom)
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
exports.typesListCommand = typesListCommand;
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
        description: 'Documentation files',
        ttl: '24h'
    },
    specs: {
        pattern: 'specs/**/*.md',
        description: 'Specification documents',
        ttl: '7d'
    },
    logs: {
        pattern: 'logs/**/*.md',
        description: 'Session logs and summaries',
        ttl: '24h'
    },
    standards: {
        pattern: 'standards/**/*.md',
        description: 'Coding and process standards',
        ttl: '7d'
    },
    templates: {
        pattern: 'templates/**/*',
        description: 'File and project templates',
        ttl: '7d'
    },
    state: {
        pattern: 'state/**/*.json',
        description: 'Persistent state files',
        ttl: '1h'
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
function typesListCommand() {
    const cmd = new commander_1.Command('list');
    cmd
        .description('List all artifact types')
        .option('--json', 'Output as JSON')
        .option('--custom-only', 'Show only custom types')
        .option('--builtin-only', 'Show only built-in types')
        .action(async (options) => {
        try {
            const customTypes = await loadCustomTypes();
            // Build type list
            const types = [];
            // Add built-in types
            if (!options.customOnly) {
                for (const [name, type] of Object.entries(BUILT_IN_TYPES)) {
                    types.push({
                        name,
                        pattern: type.pattern,
                        description: type.description,
                        ttl: type.ttl,
                        builtin: true
                    });
                }
            }
            // Add custom types
            if (!options.builtinOnly) {
                for (const [name, type] of Object.entries(customTypes)) {
                    types.push({
                        name,
                        pattern: type.pattern,
                        description: type.description || 'Custom type',
                        ttl: type.ttl || '24h',
                        builtin: false
                    });
                }
            }
            if (options.json) {
                console.log(JSON.stringify({
                    count: types.length,
                    builtinCount: types.filter(t => t.builtin).length,
                    customCount: types.filter(t => !t.builtin).length,
                    types
                }, null, 2));
                return;
            }
            if (types.length === 0) {
                console.log(chalk_1.default.yellow('No types found.'));
                return;
            }
            console.log(chalk_1.default.bold('Artifact Types\n'));
            // Group by built-in vs custom
            const builtinTypes = types.filter(t => t.builtin);
            const customTypesList = types.filter(t => !t.builtin);
            if (builtinTypes.length > 0 && !options.customOnly) {
                console.log(chalk_1.default.bold('Built-in Types'));
                console.log(chalk_1.default.dim('─'.repeat(60)));
                for (const type of builtinTypes) {
                    console.log(`  ${chalk_1.default.cyan(type.name.padEnd(12))} ${type.pattern.padEnd(25)} ${chalk_1.default.dim(`TTL: ${type.ttl}`)}`);
                    console.log(`  ${chalk_1.default.dim(' '.repeat(12) + type.description)}`);
                }
                console.log('');
            }
            if (customTypesList.length > 0 && !options.builtinOnly) {
                console.log(chalk_1.default.bold('Custom Types'));
                console.log(chalk_1.default.dim('─'.repeat(60)));
                for (const type of customTypesList) {
                    console.log(`  ${chalk_1.default.green(type.name.padEnd(12))} ${type.pattern.padEnd(25)} ${chalk_1.default.dim(`TTL: ${type.ttl}`)}`);
                    console.log(`  ${chalk_1.default.dim(' '.repeat(12) + type.description)}`);
                }
                console.log('');
            }
            // Summary
            console.log(chalk_1.default.dim(`Total: ${types.length} types (${builtinTypes.length} built-in, ${customTypesList.length} custom)`));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=list.js.map