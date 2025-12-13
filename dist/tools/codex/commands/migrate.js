"use strict";
/**
 * Migrate command (v3.0)
 *
 * Migrates legacy v2.0 configurations to v3.0 format:
 * - Detects v2.0 config structure
 * - Creates backup of old config
 * - Transforms to v3.0 format
 * - Validates migration result
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
exports.migrateCommand = migrateCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const file_scanner_1 = require("../utils/file-scanner");
/**
 * Get config directory path
 */
function getConfigDir() {
    return path.join(process.cwd(), '.fractary', 'plugins', 'codex');
}
/**
 * Detect if config is v2.0 format
 */
function isV2Config(config) {
    return (config.organizationSlug !== undefined ||
        config.directories !== undefined ||
        config.rules !== undefined ||
        (config.version === undefined && config.organization === undefined));
}
/**
 * Detect if config is v3.0 format
 */
function isV3Config(config) {
    return config.version?.startsWith('3.') && config.organization !== undefined;
}
/**
 * Migrate v2.0 config to v3.0 format
 */
function migrateV2ToV3(v2Config) {
    const org = v2Config.organizationSlug || 'unknown';
    // Extract sync patterns from v2
    const syncPatterns = [
        ...(v2Config.rules?.autoSyncPatterns || []),
        ...(v2Config.syncPatterns || []),
        'docs/**/*.md',
        'specs/**/*.md',
        '.fractary/standards/**',
        '.fractary/templates/**'
    ];
    // Remove duplicates
    const uniquePatterns = [...new Set(syncPatterns)];
    return {
        version: '3.0',
        organization: org,
        cache: {
            directory: '.fractary/plugins/codex/cache',
            defaultTtl: '24h',
            maxSize: '100MB',
            cleanupInterval: '1h'
        },
        storage: {
            providers: {
                github: {
                    token: '${GITHUB_TOKEN}',
                    baseUrl: 'https://api.github.com'
                }
            },
            defaultProvider: 'github'
        },
        types: {
            custom: {}
        },
        sync: {
            environments: {
                dev: 'develop',
                test: 'test',
                staging: 'staging',
                prod: 'main'
            },
            patterns: uniquePatterns,
            exclude: []
        },
        mcp: {
            enabled: false
        }
    };
}
/**
 * Create backup of config file
 */
async function createBackup(configPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = configPath.replace('.json', `.v2-backup-${timestamp}.json`);
    const content = await (0, file_scanner_1.readFileContent)(configPath);
    await (0, file_scanner_1.writeFileContent)(backupPath, content);
    return backupPath;
}
function migrateCommand() {
    const cmd = new commander_1.Command('migrate');
    cmd
        .description('Migrate legacy v2.0 configuration to v3.0 format')
        .option('--dry-run', 'Show migration plan without executing')
        .option('--no-backup', 'Skip creating backup of old config')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const configDir = getConfigDir();
            const configPath = path.join(configDir, 'config.json');
            // Check if config exists
            if (!await (0, file_scanner_1.fileExists)(configPath)) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'no_config',
                        message: 'No configuration file found'
                    }));
                }
                else {
                    console.log(chalk_1.default.yellow('No configuration file found.'));
                    console.log(chalk_1.default.dim('Run "fractary codex init" to create a new v3.0 configuration.'));
                }
                return;
            }
            // Load current config
            const content = await (0, file_scanner_1.readFileContent)(configPath);
            let config;
            try {
                config = JSON.parse(content);
            }
            catch {
                console.error(chalk_1.default.red('Error:'), 'Invalid JSON in config file.');
                process.exit(1);
            }
            // Check if already v3.0
            if (isV3Config(config)) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'already_v3',
                        message: 'Configuration is already v3.0 format',
                        version: config.version
                    }));
                }
                else {
                    console.log(chalk_1.default.green('✓'), 'Configuration is already v3.0 format.');
                    console.log(chalk_1.default.dim(`  Version: ${config.version}`));
                    console.log(chalk_1.default.dim(`  Organization: ${config.organization}`));
                }
                return;
            }
            // Check if v2.0
            if (!isV2Config(config)) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'unknown_format',
                        message: 'Unknown configuration format'
                    }));
                }
                else {
                    console.log(chalk_1.default.yellow('Unknown configuration format.'));
                    console.log(chalk_1.default.dim('Cannot determine config version. Consider running "fractary codex init --force".'));
                }
                return;
            }
            // Perform migration
            const v3Config = migrateV2ToV3(config);
            if (options.json) {
                const output = {
                    status: 'migration_ready',
                    dryRun: options.dryRun || false,
                    v2Config: config,
                    v3Config: v3Config,
                    changes: [
                        { field: 'version', from: 'undefined', to: '3.0' },
                        { field: 'organization', from: config.organizationSlug, to: v3Config.organization },
                        { field: 'cache', from: 'undefined', to: 'new cache config' },
                        { field: 'storage', from: 'undefined', to: 'new storage config' },
                        { field: 'types', from: 'undefined', to: 'new types config' },
                        { field: 'sync', from: 'legacy rules', to: 'new sync config' },
                        { field: 'mcp', from: 'undefined', to: 'new mcp config' }
                    ]
                };
                if (!options.dryRun) {
                    output.status = 'migrated';
                }
                console.log(JSON.stringify(output, null, 2));
                if (options.dryRun) {
                    return;
                }
            }
            else {
                console.log(chalk_1.default.bold('v2.0 → v3.0 Migration\n'));
                console.log(chalk_1.default.bold('Detected v2.0 Configuration:'));
                console.log(chalk_1.default.dim(`  Organization: ${config.organizationSlug || 'not set'}`));
                if (config.directories) {
                    console.log(chalk_1.default.dim(`  Source: ${config.directories.source || 'default'}`));
                    console.log(chalk_1.default.dim(`  Target: ${config.directories.target || 'default'}`));
                }
                if (config.rules?.autoSyncPatterns?.length) {
                    console.log(chalk_1.default.dim(`  Patterns: ${config.rules.autoSyncPatterns.length} patterns`));
                }
                console.log('');
                console.log(chalk_1.default.bold('Migration Plan:'));
                console.log(chalk_1.default.green('  + Add version: "3.0"'));
                console.log(chalk_1.default.green('  + Add cache configuration'));
                console.log(chalk_1.default.green('  + Add storage providers'));
                console.log(chalk_1.default.green('  + Add type registry'));
                console.log(chalk_1.default.green('  + Convert sync patterns'));
                console.log(chalk_1.default.green('  + Add MCP configuration'));
                console.log(chalk_1.default.red('  - Remove legacy fields (directories, rules)'));
                console.log('');
                if (options.dryRun) {
                    console.log(chalk_1.default.blue('Dry run - no changes made.'));
                    console.log(chalk_1.default.dim('Run without --dry-run to execute migration.'));
                    return;
                }
            }
            // Create backup
            let backupPath = null;
            if (options.backup !== false) {
                backupPath = await createBackup(configPath);
                if (!options.json) {
                    console.log(chalk_1.default.dim(`Backup created: ${path.basename(backupPath)}`));
                }
            }
            // Write new config
            await (0, file_scanner_1.writeFileContent)(configPath, JSON.stringify(v3Config, null, 2));
            // Create cache directory
            const cacheDir = path.join(configDir, 'cache');
            await fs.mkdir(cacheDir, { recursive: true });
            // Create cache index
            const indexPath = path.join(cacheDir, 'index.json');
            if (!await (0, file_scanner_1.fileExists)(indexPath)) {
                await (0, file_scanner_1.writeFileContent)(indexPath, JSON.stringify({
                    version: '1.0',
                    created: new Date().toISOString(),
                    entries: {}
                }, null, 2));
            }
            if (!options.json) {
                console.log('');
                console.log(chalk_1.default.green('✓'), 'Migration complete!');
                console.log('');
                console.log(chalk_1.default.bold('New Configuration:'));
                console.log(chalk_1.default.dim(`  Version: ${v3Config.version}`));
                console.log(chalk_1.default.dim(`  Organization: ${v3Config.organization}`));
                console.log(chalk_1.default.dim(`  Cache: ${v3Config.cache.directory}`));
                console.log(chalk_1.default.dim(`  Storage: ${v3Config.storage.defaultProvider}`));
                console.log('');
                if (backupPath) {
                    console.log(chalk_1.default.dim(`To restore v2.0 config: cp ${path.basename(backupPath)} config.json`));
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=migrate.js.map