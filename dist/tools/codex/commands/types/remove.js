"use strict";
/**
 * Types remove command
 *
 * Unregisters a custom artifact type
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
exports.typesRemoveCommand = typesRemoveCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const file_scanner_1 = require("../../utils/file-scanner");
/**
 * Built-in type names (cannot be removed)
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
function typesRemoveCommand() {
    const cmd = new commander_1.Command('remove');
    cmd
        .description('Remove a custom artifact type')
        .argument('<name>', 'Type name to remove')
        .option('--json', 'Output as JSON')
        .option('--force', 'Skip confirmation')
        .action(async (name, options) => {
        try {
            // Check for built-in type
            if (BUILT_IN_TYPE_NAMES.includes(name)) {
                console.error(chalk_1.default.red('Error:'), `Cannot remove built-in type "${name}".`);
                console.log(chalk_1.default.dim('Built-in types are permanent and cannot be removed.'));
                process.exit(1);
            }
            // Load existing config
            const config = await loadConfig();
            if (!config) {
                console.error(chalk_1.default.red('Error:'), 'Codex not initialized.');
                console.log(chalk_1.default.dim('Run "fractary codex init" first.'));
                process.exit(1);
            }
            // Check if custom type exists
            if (!config.types?.custom?.[name]) {
                console.error(chalk_1.default.red('Error:'), `Custom type "${name}" not found.`);
                console.log(chalk_1.default.dim('Run "fractary codex types list --custom-only" to see custom types.'));
                process.exit(1);
            }
            // Get type info before removal
            const removedType = config.types.custom[name];
            // Remove the type
            delete config.types.custom[name];
            // Clean up empty objects
            if (Object.keys(config.types.custom).length === 0) {
                delete config.types.custom;
            }
            if (config.types && Object.keys(config.types).length === 0) {
                delete config.types;
            }
            // Save config
            await saveConfig(config);
            if (options.json) {
                console.log(JSON.stringify({
                    success: true,
                    removed: {
                        name,
                        ...removedType
                    }
                }, null, 2));
                return;
            }
            console.log(chalk_1.default.green('✓'), `Removed custom type "${chalk_1.default.cyan(name)}"`);
            console.log('');
            console.log(chalk_1.default.dim('Removed configuration:'));
            console.log(`  ${chalk_1.default.dim('Pattern:')} ${removedType.pattern}`);
            if (removedType.ttl) {
                console.log(`  ${chalk_1.default.dim('TTL:')}     ${removedType.ttl}`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=remove.js.map