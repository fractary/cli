"use strict";
/**
 * Migrate command (v3.0)
 *
 * Migrates legacy v2.x JSON configurations to v3.0 YAML format:
 * - Detects legacy config at .fractary/plugins/codex/config.json
 * - Creates backup of old config
 * - Transforms to v3.0 YAML format
 * - Writes to .fractary/codex.yaml
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
const migrate_config_1 = require("../migrate-config");
/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Read file content
 */
async function readFileContent(filePath) {
    return fs.readFile(filePath, 'utf-8');
}
function migrateCommand() {
    const cmd = new commander_1.Command('migrate');
    cmd
        .description('Migrate legacy JSON configuration to v3.0 YAML format')
        .option('--dry-run', 'Show migration plan without executing')
        .option('--no-backup', 'Skip creating backup of old config')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const legacyConfigPath = path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'config.json');
            const newConfigPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
            // Check if legacy config exists
            if (!await fileExists(legacyConfigPath)) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'no_config',
                        message: 'No legacy configuration file found',
                        path: legacyConfigPath
                    }));
                }
                else {
                    console.log(chalk_1.default.yellow('⚠ No legacy configuration file found.'));
                    console.log(chalk_1.default.dim(`  Expected: ${legacyConfigPath}`));
                    console.log(chalk_1.default.dim('\nRun "fractary codex init" to create a new v3.0 YAML configuration.'));
                }
                return;
            }
            // Check if new YAML config already exists
            if (await fileExists(newConfigPath) && !options.dryRun) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'already_migrated',
                        message: 'YAML configuration already exists',
                        path: newConfigPath
                    }));
                }
                else {
                    console.log(chalk_1.default.yellow('⚠ YAML configuration already exists.'));
                    console.log(chalk_1.default.dim(`  Path: ${newConfigPath}`));
                    console.log(chalk_1.default.dim('\nUse "fractary codex init --force" to recreate.'));
                }
                return;
            }
            // Load and validate legacy config
            const legacyContent = await readFileContent(legacyConfigPath);
            let legacyConfig;
            try {
                legacyConfig = JSON.parse(legacyContent);
            }
            catch {
                console.error(chalk_1.default.red('Error:'), 'Invalid JSON in legacy config file.');
                process.exit(1);
            }
            if (!options.json && !options.dryRun) {
                console.log(chalk_1.default.blue('Migrating Codex configuration to v3.0 YAML format...\n'));
            }
            // Perform migration using utility
            const migrationResult = await (0, migrate_config_1.migrateConfig)(legacyConfigPath, {
                createBackup: options.backup !== false,
                backupSuffix: new Date().toISOString().replace(/[:.]/g, '-')
            });
            // Display migration plan
            if (!options.json) {
                console.log(chalk_1.default.bold('Legacy Configuration:'));
                console.log(chalk_1.default.dim(`  Path: ${legacyConfigPath}`));
                console.log(chalk_1.default.dim(`  Organization: ${legacyConfig.organization || legacyConfig.organizationSlug || 'unknown'}`));
                console.log('');
                console.log(chalk_1.default.bold('Migration Changes:'));
                console.log(chalk_1.default.green('  + Format: JSON → YAML'));
                console.log(chalk_1.default.green('  + Location: .fractary/plugins/codex/ → .fractary/'));
                console.log(chalk_1.default.green('  + File: config.json → codex.yaml'));
                console.log(chalk_1.default.green('  + Storage: Multi-provider configuration'));
                console.log(chalk_1.default.green('  + Cache: Modern cache management'));
                console.log(chalk_1.default.green('  + Types: Custom type registry'));
                if (migrationResult.warnings.length > 0) {
                    console.log('');
                    console.log(chalk_1.default.yellow('Warnings:'));
                    for (const warning of migrationResult.warnings) {
                        console.log(chalk_1.default.yellow('  ⚠'), chalk_1.default.dim(warning));
                    }
                }
                console.log('');
                if (options.dryRun) {
                    console.log(chalk_1.default.blue('Dry run - no changes made.'));
                    console.log(chalk_1.default.dim('Run without --dry-run to execute migration.'));
                    return;
                }
            }
            // JSON output for dry run
            if (options.json) {
                const output = {
                    status: options.dryRun ? 'migration_ready' : 'migrated',
                    dryRun: options.dryRun || false,
                    legacyConfig: {
                        path: legacyConfigPath,
                        organization: legacyConfig.organization || legacyConfig.organizationSlug
                    },
                    newConfig: {
                        path: newConfigPath,
                        organization: migrationResult.yamlConfig.organization
                    },
                    warnings: migrationResult.warnings,
                    backupPath: migrationResult.backupPath
                };
                console.log(JSON.stringify(output, null, 2));
                if (options.dryRun) {
                    return;
                }
            }
            // Write new YAML config
            if (!options.dryRun) {
                await (0, migrate_config_1.writeYamlConfig)(migrationResult.yamlConfig, newConfigPath);
                // Create cache directory
                const cacheDir = path.join(process.cwd(), '.codex-cache');
                await fs.mkdir(cacheDir, { recursive: true });
                if (!options.json) {
                    console.log(chalk_1.default.green('✓'), 'YAML configuration created');
                    console.log(chalk_1.default.green('✓'), 'Cache directory initialized');
                    if (migrationResult.backupPath) {
                        console.log(chalk_1.default.green('✓'), 'Legacy config backed up');
                    }
                    console.log('');
                    console.log(chalk_1.default.bold('New Configuration:'));
                    console.log(chalk_1.default.dim(`  Path: ${newConfigPath}`));
                    console.log(chalk_1.default.dim(`  Organization: ${migrationResult.yamlConfig.organization}`));
                    console.log(chalk_1.default.dim(`  Cache: ${migrationResult.yamlConfig.cacheDir || '.codex-cache'}`));
                    console.log(chalk_1.default.dim(`  Storage Providers: ${migrationResult.yamlConfig.storage?.length || 0}`));
                    console.log('');
                    console.log(chalk_1.default.bold('Next Steps:'));
                    console.log(chalk_1.default.dim('  1. Review the new configuration: .fractary/codex.yaml'));
                    console.log(chalk_1.default.dim('  2. Set your GitHub token: export GITHUB_TOKEN="your_token"'));
                    console.log(chalk_1.default.dim('  3. Test fetching: fractary codex fetch codex://org/project/path'));
                    if (migrationResult.backupPath) {
                        console.log('');
                        console.log(chalk_1.default.dim(`Backup saved: ${path.basename(migrationResult.backupPath)}`));
                    }
                }
            }
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'error',
                    message: error.message
                }));
            }
            else {
                console.error(chalk_1.default.red('Error:'), error.message);
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=migrate.js.map