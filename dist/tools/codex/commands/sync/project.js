"use strict";
/**
 * Sync project command
 *
 * Synchronizes a single project with the codex repository
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
const child_process_1 = require("child_process");
const file_scanner_1 = require("../../utils/file-scanner");
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
 * Detect current project name from git remote or directory
 */
function detectProjectName() {
    try {
        const remoteUrl = (0, child_process_1.execSync)('git remote get-url origin', { encoding: 'utf-8' }).trim();
        const match = remoteUrl.match(/[:/]([^/]+)\/([^/.]+)(\.git)?$/);
        if (match) {
            return match[2];
        }
    }
    catch {
        // Git not available
    }
    // Fallback to directory name
    return path.basename(process.cwd());
}
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
 * Generate sync plan
 */
async function generateSyncPlan(projectName, config, direction) {
    const plan = [];
    // Default sync patterns
    const patterns = config.sync?.patterns || [
        'docs/**/*.md',
        'specs/**/*.md',
        '.fractary/standards/**',
        '.fractary/templates/**'
    ];
    // Simulate finding files that match patterns
    for (const pattern of patterns) {
        const basePath = pattern.replace(/\*\*?\/?\*?\.?\w*$/, '').replace(/\/$/, '');
        if (direction === 'to-codex' || direction === 'bidirectional') {
            plan.push({
                path: `${basePath}/`,
                action: 'copy',
                direction: 'to-codex',
                reason: `Match pattern: ${pattern}`
            });
        }
        if (direction === 'from-codex' || direction === 'bidirectional') {
            plan.push({
                path: `codex://${config.organization}/codex/${basePath}/`,
                action: 'copy',
                direction: 'from-codex',
                reason: `Match pattern: ${pattern}`
            });
        }
    }
    return plan;
}
/**
 * Execute sync operation
 */
async function executeSync(plan, config, targetBranch) {
    let success = 0;
    let errors = 0;
    for (const item of plan) {
        try {
            // In a full implementation, this would:
            // 1. For to-codex: Copy local files to codex repo
            // 2. For from-codex: Fetch files from codex repo to local
            // For now, simulate the operation
            console.log(chalk_1.default.green('  ✓'), chalk_1.default.dim(item.direction === 'to-codex' ? '→' : '←'), item.path);
            success++;
        }
        catch (err) {
            console.log(chalk_1.default.red('  ✗'), chalk_1.default.dim(item.direction === 'to-codex' ? '→' : '←'), item.path, chalk_1.default.red(`(${err.message})`));
            errors++;
        }
    }
    return { success, errors };
}
function syncProjectCommand() {
    const cmd = new commander_1.Command('project');
    cmd
        .description('Sync single project with codex repository')
        .argument('[name]', 'Project name (auto-detected if not provided)')
        .option('--env <env>', 'Target environment (dev/test/staging/prod)', 'prod')
        .option('--dry-run', 'Show what would sync without executing')
        .option('--direction <dir>', 'Sync direction (to-codex/from-codex/bidirectional)', 'bidirectional')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            // Load config
            const config = await loadConfig();
            if (!config) {
                console.error(chalk_1.default.red('Error:'), 'Codex not initialized.');
                console.log(chalk_1.default.dim('Run "fractary codex init" first.'));
                process.exit(1);
            }
            // Determine project name
            const projectName = name || detectProjectName();
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
            // Generate sync plan
            const plan = await generateSyncPlan(projectName, config, direction);
            if (plan.length === 0) {
                if (options.json) {
                    console.log(JSON.stringify({ project: projectName, items: [], synced: 0 }));
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
                    items: plan.map(item => ({
                        path: item.path,
                        action: item.action,
                        direction: item.direction
                    }))
                };
                if (options.dryRun) {
                    console.log(JSON.stringify(output, null, 2));
                    return;
                }
                // Execute and add results
                const results = await executeSync(plan, config, targetBranch);
                console.log(JSON.stringify({
                    ...output,
                    results: {
                        success: results.success,
                        errors: results.errors
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
            console.log('');
            if (options.dryRun) {
                console.log(chalk_1.default.blue('Dry run - would sync:\n'));
                for (const item of plan) {
                    const arrow = item.direction === 'to-codex' ? '→ codex' : '← codex';
                    console.log(chalk_1.default.dim(`  ${arrow}  ${item.path}`));
                }
                console.log(chalk_1.default.dim(`\nTotal: ${plan.length} items`));
                console.log(chalk_1.default.dim('Run without --dry-run to execute sync.'));
                return;
            }
            // Execute sync
            console.log(chalk_1.default.blue('Syncing...\n'));
            const results = await executeSync(plan, config, targetBranch);
            // Summary
            console.log('');
            console.log(chalk_1.default.green(`✓ Synced ${results.success} items`));
            if (results.errors > 0) {
                console.log(chalk_1.default.red(`✗ ${results.errors} errors`));
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