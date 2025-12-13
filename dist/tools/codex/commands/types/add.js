"use strict";
/**
 * Types add command
 *
 * Registers a custom artifact type
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
exports.typesAddCommand = typesAddCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const file_scanner_1 = require("../../utils/file-scanner");
/**
 * Built-in type names (cannot be overridden)
 */
const BUILT_IN_TYPE_NAMES = ['docs', 'specs', 'logs', 'standards', 'templates', 'state'];
/**
 * Get config directory path
 */
function getConfigDir() {
    return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}
/**
 * Load codex configuration
 */
async function loadConfig() {
    const configPath = path.join(getConfigDir(), 'config.json');
    try {
        if (await (0, file_scanner_1.fileExists)(configPath)) {
            const content = await (0, file_scanner_1.readFileContent)(configPath);
            return JSON.parse(content);
        }
    }
    catch {
        // Config load failed
    }
    return null;
}
/**
 * Save codex configuration
 */
async function saveConfig(config) {
    const configPath = path.join(getConfigDir(), 'config.json');
    await (0, file_scanner_1.writeFileContent)(configPath, JSON.stringify(config, null, 2));
}
/**
 * Validate type name
 */
function isValidTypeName(name) {
    return /^[a-z][a-z0-9-]*$/.test(name);
}
/**
 * Parse TTL string
 */
function isValidTtl(ttl) {
    return /^\d+[smhd]$/.test(ttl);
}
function typesAddCommand() {
    const cmd = new commander_1.Command('add');
    cmd
        .description('Add a custom artifact type')
        .argument('<name>', 'Type name (lowercase, alphanumeric with hyphens)')
        .requiredOption('--pattern <glob>', 'File pattern (glob syntax)')
        .option('--ttl <duration>', 'Cache TTL (e.g., "24h", "7d")', '24h')
        .option('--description <text>', 'Type description')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            // Validate type name
            if (!isValidTypeName(name)) {
                console.error(chalk_1.default.red('Error:'), 'Invalid type name.');
                console.log(chalk_1.default.dim('Type name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.'));
                process.exit(1);
            }
            // Check for built-in type conflict
            if (BUILT_IN_TYPE_NAMES.includes(name)) {
                console.error(chalk_1.default.red('Error:'), `Cannot override built-in type "${name}".`);
                console.log(chalk_1.default.dim('Built-in types: ' + BUILT_IN_TYPE_NAMES.join(', ')));
                process.exit(1);
            }
            // Validate TTL
            if (!isValidTtl(options.ttl)) {
                console.error(chalk_1.default.red('Error:'), 'Invalid TTL format.');
                console.log(chalk_1.default.dim('Expected format: <number><unit> where unit is s (seconds), m (minutes), h (hours), or d (days)'));
                console.log(chalk_1.default.dim('Examples: 30m, 24h, 7d'));
                process.exit(1);
            }
            // Load existing config
            const config = await loadConfig();
            if (!config) {
                console.error(chalk_1.default.red('Error:'), 'Codex not initialized.');
                console.log(chalk_1.default.dim('Run "fractary codex init" first.'));
                process.exit(1);
            }
            // Initialize types.custom if needed
            if (!config.types) {
                config.types = {};
            }
            if (!config.types.custom) {
                config.types.custom = {};
            }
            // Check if type already exists
            if (config.types.custom[name]) {
                console.error(chalk_1.default.red('Error:'), `Custom type "${name}" already exists.`);
                console.log(chalk_1.default.dim('Use "fractary codex types remove" first to remove it.'));
                process.exit(1);
            }
            // Add the new type
            const newType = {
                pattern: options.pattern,
                ttl: options.ttl
            };
            if (options.description) {
                newType.description = options.description;
            }
            config.types.custom[name] = newType;
            // Save config
            await saveConfig(config);
            if (options.json) {
                console.log(JSON.stringify({
                    success: true,
                    type: {
                        name,
                        ...newType,
                        builtin: false
                    }
                }, null, 2));
                return;
            }
            console.log(chalk_1.default.green('✓'), `Added custom type "${chalk_1.default.cyan(name)}"`);
            console.log('');
            console.log(`  ${chalk_1.default.dim('Pattern:')}     ${options.pattern}`);
            console.log(`  ${chalk_1.default.dim('TTL:')}         ${options.ttl}`);
            if (options.description) {
                console.log(`  ${chalk_1.default.dim('Description:')} ${options.description}`);
            }
            console.log('');
            console.log(chalk_1.default.dim('Example URI: codex://org/project/' + options.pattern.replace('**/', '').replace('/*', '/example.md')));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=add.js.map