"use strict";
/**
 * Sync project command (v3.0)
 *
 * Synchronizes a single project with the codex repository using SDK SyncManager:
 * - Multi-directional sync (to-codex, from-codex, bidirectional)
 * - Manifest tracking for sync state
 * - Conflict detection and resolution
 * - Pattern-based file filtering
 * - Dry-run mode
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
exports.syncProjectCommand = syncProjectCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const codex_1 = require("@fractary/codex");
const migrate_config_1 = require("../../migrate-config");
/**
 * Get environment branch mapping
 */
function getEnvironmentBranch(config, env) {
    const envMap = config.sync?.environments || {
        dev: 'develop',
        test: 'test',
        staging: 'staging',
        prod: 'main'
    };
    return envMap[env] || env;
}
/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
/**
 * Format duration in milliseconds
 */
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
function syncProjectCommand() {
    const cmd = new commander_1.Command('project');
    cmd
        .description('Sync single project with codex repository')
        .argument('[name]', 'Project name (auto-detected if not provided)')
        .option('--env <env>', 'Target environment (dev/test/staging/prod)', 'prod')
        .option('--dry-run', 'Show what would sync without executing')
        .option('--direction <dir>', 'Sync direction (to-codex/from-codex/bidirectional)', 'bidirectional')
        .option('--include <pattern>', 'Include files matching pattern (can be used multiple times)', (val, prev) => prev.concat([val]), [])
        .option('--exclude <pattern>', 'Exclude files matching pattern (can be used multiple times)', (val, prev) => prev.concat([val]), [])
        .option('--force', 'Force sync without checking timestamps')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            // Load YAML config
            const configPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
            let config;
            try {
                config = await (0, migrate_config_1.readYamlConfig)(configPath);
            }
            catch (error) {
                console.error(chalk_1.default.red('Error:'), 'Codex not initialized.');
                console.log(chalk_1.default.dim('Run "fractary codex init" first.'));
                process.exit(1);
            }
            // Determine project name
            let projectName = name;
            if (!projectName) {
                const detected = (0, codex_1.detectCurrentProject)();
                projectName = detected.project || null;
            }
            if (!projectName) {
                console.error(chalk_1.default.red('Error:'), 'Could not determine project name.');
                console.log(chalk_1.default.dim('Provide project name as argument or run from a git repository.'));
                process.exit(1);
            }
            // Validate direction
            const validDirections = ['to-codex', 'from-codex', 'bidirectional'];
            if (!validDirections.includes(options.direction)) {
                console.error(chalk_1.default.red('Error:'), `Invalid direction: ${options.direction}`);
                console.log(chalk_1.default.dim('Valid options: to-codex, from-codex, bidirectional'));
                process.exit(1);
            }
            const direction = options.direction;
            const targetBranch = getEnvironmentBranch(config, options.env);
            // Create LocalStorage instance
            const localStorage = (0, codex_1.createLocalStorage)({
                baseDir: process.cwd()
            });
            // Create SyncManager
            const syncManager = (0, codex_1.createSyncManager)({
                localStorage,
                config: config.sync,
                manifestPath: path.join(process.cwd(), '.fractary', '.codex-sync-manifest.json')
            });
            // Get default include patterns from config
            const defaultPatterns = config.sync?.include || [
                'docs/**/*.md',
                'specs/**/*.md',
                '.fractary/standards/**',
                '.fractary/templates/**'
            ];
            // Combine config patterns with CLI options
            const includePatterns = options.include.length > 0 ? options.include : defaultPatterns;
            const excludePatterns = [
                ...(config.sync?.exclude || []),
                ...options.exclude
            ];
            // Scan local files
            const sourceDir = process.cwd();
            const allFiles = await syncManager.listLocalFiles(sourceDir);
            // Filter files by patterns (simple implementation)
            const targetFiles = allFiles.filter(file => {
                // Check exclude patterns first
                for (const pattern of excludePatterns) {
                    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
                    if (regex.test(file.path)) {
                        return false;
                    }
                }
                // Check include patterns
                for (const pattern of includePatterns) {
                    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
                    if (regex.test(file.path)) {
                        return true;
                    }
                }
                return false;
            });
            // Create sync plan
            const syncOptions = {
                direction,
                dryRun: options.dryRun,
                force: options.force,
                include: includePatterns,
                exclude: excludePatterns
            };
            const plan = await syncManager.createPlan(config.organization, projectName, sourceDir, targetFiles, syncOptions);
            if (plan.totalFiles === 0) {
                if (options.json) {
                    console.log(JSON.stringify({
                        project: projectName,
                        organization: config.organization,
                        files: [],
                        synced: 0
                    }, null, 2));
                }
                else {
                    console.log(chalk_1.default.yellow('No files to sync.'));
                }
                return;
            }
            if (options.json) {
                const output = {
                    project: projectName,
                    organization: config.organization,
                    environment: options.env,
                    branch: targetBranch,
                    direction,
                    dryRun: options.dryRun || false,
                    plan: {
                        totalFiles: plan.totalFiles,
                        totalBytes: plan.totalBytes,
                        estimatedTime: plan.estimatedTime,
                        conflicts: plan.conflicts.length,
                        skipped: plan.skipped.length
                    },
                    files: plan.files.map(f => ({
                        path: f.path,
                        operation: f.operation,
                        size: f.size
                    }))
                };
                if (options.dryRun) {
                    console.log(JSON.stringify(output, null, 2));
                    return;
                }
                // Execute and add results
                const result = await syncManager.executePlan(plan, syncOptions);
                console.log(JSON.stringify({
                    ...output,
                    result: {
                        success: result.success,
                        synced: result.synced,
                        failed: result.failed,
                        skipped: result.skipped,
                        duration: result.duration,
                        errors: result.errors
                    }
                }, null, 2));
                return;
            }
            // Display sync plan
            console.log(chalk_1.default.bold('Sync Plan\n'));
            console.log(`  Project:      ${chalk_1.default.cyan(projectName)}`);
            console.log(`  Organization: ${chalk_1.default.cyan(config.organization)}`);
            console.log(`  Environment:  ${chalk_1.default.cyan(options.env)} (${targetBranch})`);
            console.log(`  Direction:    ${chalk_1.default.cyan(direction)}`);
            console.log(`  Files:        ${chalk_1.default.cyan(plan.totalFiles.toString())}`);
            console.log(`  Total size:   ${chalk_1.default.cyan(formatBytes(plan.totalBytes))}`);
            if (plan.estimatedTime) {
                console.log(`  Est. time:    ${chalk_1.default.dim(formatDuration(plan.estimatedTime))}`);
            }
            console.log('');
            if (plan.conflicts.length > 0) {
                console.log(chalk_1.default.yellow(`⚠ ${plan.conflicts.length} conflicts detected:`));
                for (const conflict of plan.conflicts.slice(0, 5)) {
                    console.log(chalk_1.default.yellow(`  • ${conflict.path}`));
                }
                if (plan.conflicts.length > 5) {
                    console.log(chalk_1.default.dim(`  ... and ${plan.conflicts.length - 5} more`));
                }
                console.log('');
            }
            if (plan.skipped.length > 0) {
                console.log(chalk_1.default.dim(`${plan.skipped.length} files skipped (no changes)`));
                console.log('');
            }
            if (options.dryRun) {
                console.log(chalk_1.default.blue('Dry run - would sync:\n'));
                const filesToShow = plan.files.slice(0, 10);
                for (const file of filesToShow) {
                    const arrow = direction === 'to-codex' ? '→' : direction === 'from-codex' ? '←' : '↔';
                    const opColor = file.operation === 'create' ? chalk_1.default.green :
                        file.operation === 'update' ? chalk_1.default.yellow :
                            chalk_1.default.dim;
                    console.log(chalk_1.default.dim(`  ${arrow}`), opColor(file.operation.padEnd(7)), file.path, chalk_1.default.dim(`(${formatBytes(file.size || 0)})`));
                }
                if (plan.files.length > 10) {
                    console.log(chalk_1.default.dim(`  ... and ${plan.files.length - 10} more files`));
                }
                console.log(chalk_1.default.dim(`\nTotal: ${plan.totalFiles} files (${formatBytes(plan.totalBytes)})`));
                console.log(chalk_1.default.dim('Run without --dry-run to execute sync.'));
                return;
            }
            // Execute sync
            console.log(chalk_1.default.blue('Syncing...\n'));
            const startTime = Date.now();
            const result = await syncManager.executePlan(plan, syncOptions);
            const duration = Date.now() - startTime;
            // Summary
            console.log('');
            if (result.success) {
                console.log(chalk_1.default.green(`✓ Sync completed successfully`));
                console.log(chalk_1.default.dim(`  Synced: ${result.synced} files`));
                if (result.skipped > 0) {
                    console.log(chalk_1.default.dim(`  Skipped: ${result.skipped} files`));
                }
                console.log(chalk_1.default.dim(`  Duration: ${formatDuration(duration)}`));
            }
            else {
                console.log(chalk_1.default.yellow(`⚠ Sync completed with errors`));
                console.log(chalk_1.default.green(`  Synced: ${result.synced} files`));
                console.log(chalk_1.default.red(`  Failed: ${result.failed} files`));
                if (result.skipped > 0) {
                    console.log(chalk_1.default.dim(`  Skipped: ${result.skipped} files`));
                }
                if (result.errors.length > 0) {
                    console.log('');
                    console.log(chalk_1.default.red('Errors:'));
                    for (const error of result.errors.slice(0, 5)) {
                        console.log(chalk_1.default.red(`  • ${error.path}: ${error.error}`));
                    }
                    if (result.errors.length > 5) {
                        console.log(chalk_1.default.dim(`  ... and ${result.errors.length - 5} more errors`));
                    }
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
//# sourceMappingURL=project.js.map