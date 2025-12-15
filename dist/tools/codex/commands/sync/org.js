"use strict";
/**
 * Sync org command (v3.0)
 *
 * Synchronizes all projects in an organization with the codex repository using SDK SyncManager:
 * - Discovers repositories via GitHub CLI
 * - Parallel sync execution
 * - Pattern-based filtering and exclusion
 * - Dry-run mode
 * - Per-repo error handling
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
exports.syncOrgCommand = syncOrgCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
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
 * Discover repositories in organization using GitHub CLI
 */
async function discoverRepos(org) {
    try {
        const output = (0, child_process_1.execSync)(`gh repo list ${org} --json name,url,defaultBranchRef --limit 100`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        const repos = JSON.parse(output);
        return repos.map((repo) => ({
            name: repo.name,
            url: repo.url,
            defaultBranch: repo.defaultBranchRef?.name || 'main'
        }));
    }
    catch (error) {
        throw new Error(`Failed to discover repos: ${error.message}. Ensure GitHub CLI is installed and authenticated.`);
    }
}
/**
 * Check if repo should be excluded
 */
function shouldExclude(repoName, excludePatterns) {
    for (const pattern of excludePatterns) {
        // Simple glob matching
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(repoName)) {
            return true;
        }
    }
    return false;
}
/**
 * Sync a single repository
 */
async function syncRepository(repo, config, direction, syncOptions) {
    const startTime = Date.now();
    try {
        // Dynamic import to avoid loading SDK at module time
        const { createSyncManager, createLocalStorage } = await Promise.resolve().then(() => __importStar(require('@fractary/codex')));
        // Note: In a real implementation, this would:
        // 1. Clone or update local copy of repo to a temp directory
        // 2. Create SyncManager for that directory
        // 3. Execute sync plan
        // 4. Commit and push changes if direction includes 'to-codex'
        // For now, we'll demonstrate the SDK integration pattern
        // Assuming repo is already cloned to a local directory
        const repoDir = path.join(process.cwd(), '..', repo.name);
        // Create LocalStorage for this repo
        const localStorage = createLocalStorage({
            baseDir: repoDir
        });
        // Create SyncManager
        const syncManager = createSyncManager({
            localStorage,
            config: config.sync,
            manifestPath: path.join(repoDir, '.fractary', '.codex-sync-manifest.json')
        });
        // Get include patterns from config
        const includePatterns = config.sync?.include || [
            'docs/**/*.md',
            'specs/**/*.md',
            '.fractary/standards/**',
            '.fractary/templates/**'
        ];
        // List files in repo
        const allFiles = await syncManager.listLocalFiles(repoDir);
        // Filter by include patterns
        const targetFiles = allFiles.filter(file => {
            for (const pattern of includePatterns) {
                const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
                if (regex.test(file.path)) {
                    return true;
                }
            }
            return false;
        });
        // Create and execute sync plan
        const plan = await syncManager.createPlan(config.organization, repo.name, repoDir, targetFiles, syncOptions);
        if (plan.totalFiles === 0) {
            return {
                repo: repo.name,
                status: 'skipped',
                filesSynced: 0,
                duration: Date.now() - startTime
            };
        }
        const result = await syncManager.executePlan(plan, syncOptions);
        return {
            repo: repo.name,
            status: result.success ? 'success' : 'error',
            filesSynced: result.synced,
            duration: Date.now() - startTime,
            error: result.success ? undefined : `${result.failed} files failed`
        };
    }
    catch (error) {
        return {
            repo: repo.name,
            status: 'error',
            duration: Date.now() - startTime,
            error: error.message
        };
    }
}
function syncOrgCommand() {
    const cmd = new commander_1.Command('org');
    cmd
        .description('Sync all projects in organization with codex repository')
        .option('--env <env>', 'Target environment (dev/test/staging/prod)', 'prod')
        .option('--dry-run', 'Show what would sync without executing')
        .option('--exclude <pattern>', 'Exclude repos matching pattern (can be used multiple times)', (val, prev) => prev.concat([val]), [])
        .option('--parallel <n>', 'Number of parallel syncs', parseInt, 3)
        .option('--direction <dir>', 'Sync direction (to-codex/from-codex/bidirectional)', 'bidirectional')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
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
            // Validate direction
            const validDirections = ['to-codex', 'from-codex', 'bidirectional'];
            if (!validDirections.includes(options.direction)) {
                console.error(chalk_1.default.red('Error:'), `Invalid direction: ${options.direction}`);
                console.log(chalk_1.default.dim('Valid options: to-codex, from-codex, bidirectional'));
                process.exit(1);
            }
            const direction = options.direction;
            const org = config.organization;
            const targetBranch = getEnvironmentBranch(config, options.env);
            // Combine config excludes with CLI excludes
            const excludePatterns = [
                ...(config.sync?.exclude || []),
                ...options.exclude
            ];
            if (!options.json) {
                console.log(chalk_1.default.bold('Organization Sync\n'));
                console.log(`  Organization: ${chalk_1.default.cyan(org)}`);
                console.log(`  Environment:  ${chalk_1.default.cyan(options.env)} (${targetBranch})`);
                console.log(`  Direction:    ${chalk_1.default.cyan(direction)}`);
                console.log(`  Parallelism:  ${chalk_1.default.cyan(options.parallel.toString())}`);
                if (excludePatterns.length > 0) {
                    console.log(`  Excluding:    ${chalk_1.default.dim(excludePatterns.join(', '))}`);
                }
                console.log('');
                console.log(chalk_1.default.dim('Discovering repositories...'));
            }
            // Discover repos
            let repos;
            try {
                repos = await discoverRepos(org);
            }
            catch (error) {
                if (options.json) {
                    console.log(JSON.stringify({ error: error.message }));
                }
                else {
                    console.error(chalk_1.default.red('Error:'), error.message);
                }
                process.exit(1);
            }
            // Filter excluded repos
            const eligibleRepos = repos.filter(repo => !shouldExclude(repo.name, excludePatterns));
            const excludedRepos = repos.filter(repo => shouldExclude(repo.name, excludePatterns));
            if (!options.json) {
                console.log(chalk_1.default.dim(`Found ${repos.length} repositories (${excludedRepos.length} excluded)\n`));
            }
            if (options.dryRun) {
                if (options.json) {
                    console.log(JSON.stringify({
                        organization: org,
                        environment: options.env,
                        branch: targetBranch,
                        direction,
                        dryRun: true,
                        repos: {
                            total: repos.length,
                            eligible: eligibleRepos.map(r => r.name),
                            excluded: excludedRepos.map(r => r.name)
                        }
                    }, null, 2));
                }
                else {
                    console.log(chalk_1.default.blue('Dry run - would sync:\n'));
                    for (const repo of eligibleRepos) {
                        console.log(chalk_1.default.green('  ✓'), repo.name);
                    }
                    if (excludedRepos.length > 0) {
                        console.log('');
                        console.log(chalk_1.default.dim('Excluded:'));
                        for (const repo of excludedRepos) {
                            console.log(chalk_1.default.dim(`  - ${repo.name}`));
                        }
                    }
                    console.log(chalk_1.default.dim(`\nTotal: ${eligibleRepos.length} repos would be synced`));
                    console.log(chalk_1.default.dim('Run without --dry-run to execute sync.'));
                }
                return;
            }
            // Execute sync
            if (!options.json) {
                console.log(chalk_1.default.blue('Syncing repositories...\n'));
            }
            const results = [];
            const syncOptions = {
                direction,
                dryRun: false,
                force: false
            };
            // Process in parallel batches
            for (let i = 0; i < eligibleRepos.length; i += options.parallel) {
                const batch = eligibleRepos.slice(i, i + options.parallel);
                const batchResults = await Promise.all(batch.map(repo => syncRepository(repo, config, direction, syncOptions)));
                for (const result of batchResults) {
                    results.push(result);
                    if (!options.json) {
                        if (result.status === 'success') {
                            console.log(chalk_1.default.green('  ✓'), result.repo, chalk_1.default.dim(`(${result.filesSynced} files in ${result.duration}ms)`));
                        }
                        else if (result.status === 'skipped') {
                            console.log(chalk_1.default.dim('  -'), result.repo, chalk_1.default.dim('(no files to sync)'));
                        }
                        else if (result.status === 'error') {
                            console.log(chalk_1.default.red('  ✗'), result.repo, chalk_1.default.red(`(${result.error})`));
                        }
                    }
                }
            }
            // Summary
            const successful = results.filter(r => r.status === 'success');
            const skipped = results.filter(r => r.status === 'skipped');
            const failed = results.filter(r => r.status === 'error');
            const totalFiles = successful.reduce((sum, r) => sum + (r.filesSynced || 0), 0);
            if (options.json) {
                console.log(JSON.stringify({
                    organization: org,
                    environment: options.env,
                    branch: targetBranch,
                    direction,
                    results: {
                        total: results.length,
                        successful: successful.length,
                        skipped: skipped.length,
                        failed: failed.length,
                        filesSynced: totalFiles,
                        details: results
                    }
                }, null, 2));
            }
            else {
                console.log('');
                console.log(chalk_1.default.green(`✓ Synced ${successful.length}/${results.length} repos (${totalFiles} files)`));
                if (skipped.length > 0) {
                    console.log(chalk_1.default.dim(`  Skipped ${skipped.length} repos (no changes)`));
                }
                if (failed.length > 0) {
                    console.log(chalk_1.default.red(`✗ ${failed.length} repos failed`));
                }
            }
        }
        catch (error) {
            if (options.json) {
                console.log(JSON.stringify({ error: error.message }));
            }
            else {
                console.error(chalk_1.default.red('Error:'), error.message);
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=org.js.map