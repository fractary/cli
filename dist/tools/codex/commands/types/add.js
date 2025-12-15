"use strict";
/**
 * Types add command (v3.0)
 *
 * Registers a custom artifact type in YAML configuration
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
const migrate_config_1 = require("../../migrate-config");
const get_client_1 = require("../../get-client");
/**
 * Validate type name
 */
function isValidTypeName(name) {
    return /^[a-z][a-z0-9-]*$/.test(name);
}
/**
 * Parse TTL string to seconds
 */
function parseTtl(ttl) {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error('Invalid TTL format');
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: throw new Error('Unknown TTL unit');
    }
}
/**
 * Format TTL from seconds to human-readable string
 */
function formatTtl(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
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
            // Get registry to check for conflicts
            const client = await (0, get_client_1.getClient)();
            const registry = client.getTypeRegistry();
            // Check for built-in type conflict
            if (registry.isBuiltIn(name)) {
                console.error(chalk_1.default.red('Error:'), `Cannot override built-in type "${name}".`);
                const builtinNames = registry.list().filter(t => registry.isBuiltIn(t.name)).map(t => t.name);
                console.log(chalk_1.default.dim('Built-in types: ' + builtinNames.join(', ')));
                process.exit(1);
            }
            // Check if type already exists
            if (registry.has(name)) {
                console.error(chalk_1.default.red('Error:'), `Custom type "${name}" already exists.`);
                console.log(chalk_1.default.dim('Use "fractary codex types remove" first to remove it.'));
                process.exit(1);
            }
            // Parse and validate TTL
            let ttlSeconds;
            try {
                ttlSeconds = parseTtl(options.ttl);
            }
            catch {
                console.error(chalk_1.default.red('Error:'), 'Invalid TTL format.');
                console.log(chalk_1.default.dim('Expected format: <number><unit> where unit is s (seconds), m (minutes), h (hours), or d (days)'));
                console.log(chalk_1.default.dim('Examples: 30m, 24h, 7d'));
                process.exit(1);
            }
            // Load YAML configuration
            const configPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
            const config = await (0, migrate_config_1.readYamlConfig)(configPath);
            // Initialize types.custom if needed
            if (!config.types) {
                config.types = { custom: {} };
            }
            if (!config.types.custom) {
                config.types.custom = {};
            }
            // Add the new type to config
            config.types.custom[name] = {
                description: options.description || `Custom type: ${name}`,
                patterns: [options.pattern],
                defaultTtl: ttlSeconds
            };
            // Save config
            await (0, migrate_config_1.writeYamlConfig)(config, configPath);
            if (options.json) {
                console.log(JSON.stringify({
                    success: true,
                    type: {
                        name,
                        description: config.types.custom[name].description,
                        patterns: config.types.custom[name].patterns,
                        defaultTtl: ttlSeconds,
                        ttl: formatTtl(ttlSeconds),
                        builtin: false
                    },
                    message: 'Custom type added successfully. Changes will take effect on next CLI invocation.'
                }, null, 2));
                return;
            }
            console.log(chalk_1.default.green('✓'), `Added custom type "${chalk_1.default.cyan(name)}"`);
            console.log('');
            console.log(`  ${chalk_1.default.dim('Pattern:')}     ${options.pattern}`);
            console.log(`  ${chalk_1.default.dim('TTL:')}         ${formatTtl(ttlSeconds)} (${ttlSeconds} seconds)`);
            if (options.description) {
                console.log(`  ${chalk_1.default.dim('Description:')} ${options.description}`);
            }
            console.log('');
            console.log(chalk_1.default.dim('Note: Custom type will be available on next CLI invocation.'));
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
//# sourceMappingURL=add.js.map