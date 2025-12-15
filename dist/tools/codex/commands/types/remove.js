"use strict";
/**
 * Types remove command (v3.0)
 *
 * Unregisters a custom artifact type from YAML configuration
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
const migrate_config_1 = require("../../migrate-config");
const get_client_1 = require("../../get-client");
function typesRemoveCommand() {
    const cmd = new commander_1.Command('remove');
    cmd
        .description('Remove a custom artifact type')
        .argument('<name>', 'Type name to remove')
        .option('--json', 'Output as JSON')
        .option('--force', 'Skip confirmation')
        .action(async (name, options) => {
        try {
            // Get registry to check type status
            const client = await (0, get_client_1.getClient)();
            const registry = client.getTypeRegistry();
            // Check for built-in type
            if (registry.isBuiltIn(name)) {
                console.error(chalk_1.default.red('Error:'), `Cannot remove built-in type "${name}".`);
                console.log(chalk_1.default.dim('Built-in types are permanent and cannot be removed.'));
                process.exit(1);
            }
            // Check if custom type exists
            if (!registry.has(name)) {
                console.error(chalk_1.default.red('Error:'), `Custom type "${name}" not found.`);
                console.log(chalk_1.default.dim('Run "fractary codex types list --custom-only" to see custom types.'));
                process.exit(1);
            }
            // Get type info before removal
            const typeInfo = registry.get(name);
            // Load YAML configuration
            const configPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
            const config = await (0, migrate_config_1.readYamlConfig)(configPath);
            // Check if custom type exists in config
            if (!config.types?.custom?.[name]) {
                console.error(chalk_1.default.red('Error:'), `Custom type "${name}" not found in configuration.`);
                process.exit(1);
            }
            // Remove the type from config
            delete config.types.custom[name];
            // Clean up empty objects
            if (Object.keys(config.types.custom).length === 0) {
                delete config.types.custom;
            }
            if (config.types && Object.keys(config.types).length === 0) {
                delete config.types;
            }
            // Save config
            await (0, migrate_config_1.writeYamlConfig)(config, configPath);
            if (options.json) {
                console.log(JSON.stringify({
                    success: true,
                    removed: {
                        name: typeInfo.name,
                        description: typeInfo.description,
                        patterns: typeInfo.patterns,
                        defaultTtl: typeInfo.defaultTtl
                    },
                    message: 'Custom type removed successfully. Changes will take effect on next CLI invocation.'
                }, null, 2));
                return;
            }
            console.log(chalk_1.default.green('✓'), `Removed custom type "${chalk_1.default.cyan(name)}"`);
            console.log('');
            console.log(chalk_1.default.dim('Removed configuration:'));
            console.log(`  ${chalk_1.default.dim('Pattern:')}     ${typeInfo.patterns.join(', ')}`);
            console.log(`  ${chalk_1.default.dim('Description:')} ${typeInfo.description}`);
            console.log('');
            console.log(chalk_1.default.dim('Note: Custom type will be removed on next CLI invocation.'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            if (error.message.includes('Failed to load configuration')) {
                console.log(chalk_1.default.dim('\nRun "fractary codex init" to create a configuration.'));
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=remove.js.map