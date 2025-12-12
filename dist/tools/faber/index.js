"use strict";
/**
 * Faber tool - FABER Development Toolkit
 *
 * Provides workflow orchestration, work tracking, repository operations,
 * specification management, and log management through the @fractary/faber SDK.
 *
 * Command structure:
 * - faber init              Initialize FABER configuration
 * - faber run               Run FABER workflow
 * - faber status            Show workflow status
 * - faber plan              Create/view execution plan
 * - faber work              Work item tracking (issue, comment, label, milestone)
 * - faber repo              Repository operations (branch, commit, pr, tag, worktree)
 * - faber spec              Specification management
 * - faber logs              Log management
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
exports.createFaberCommand = createFaberCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// Import subcommands
const work_1 = require("./commands/work");
const repo_1 = require("./commands/repo");
const spec_1 = require("./commands/spec");
const logs_1 = require("./commands/logs");
const workflow_1 = require("./commands/workflow");
/**
 * Create and configure the faber command
 */
function createFaberCommand() {
    const faber = new commander_1.Command('faber');
    faber
        .description('FABER development toolkit (workflow, work, repo, spec, logs)')
        .version('0.2.0');
    // Workflow commands (top-level)
    faber.addCommand(createInitCommand());
    faber.addCommand((0, workflow_1.createRunCommand)());
    faber.addCommand((0, workflow_1.createStatusCommand)());
    faber.addCommand((0, workflow_1.createPlanCommand)());
    // Subcommand trees
    faber.addCommand((0, work_1.createWorkCommand)());
    faber.addCommand((0, repo_1.createRepoCommand)());
    faber.addCommand((0, spec_1.createSpecCommand)());
    faber.addCommand((0, logs_1.createLogsCommand)());
    return faber;
}
/**
 * Create the init command for FABER configuration
 */
function createInitCommand() {
    return new commander_1.Command('init')
        .description('Initialize FABER configuration')
        .option('--preset <name>', 'Use a preset configuration', 'default')
        .option('--force', 'Overwrite existing configuration')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const configDir = '.fractary/faber';
            const configPath = path.join(configDir, 'config.json');
            // Check if already initialized
            const exists = await fs.access(configPath).then(() => true).catch(() => false);
            if (exists && !options.force) {
                if (options.json) {
                    console.log(JSON.stringify({
                        status: 'error',
                        error: { code: 'ALREADY_INITIALIZED', message: 'FABER already initialized. Use --force to reinitialize.' },
                    }));
                }
                else {
                    console.error(chalk_1.default.yellow('FABER already initialized. Use --force to reinitialize.'));
                }
                process.exit(1);
            }
            // Create directory structure
            await fs.mkdir(configDir, { recursive: true });
            await fs.mkdir(path.join(configDir, 'specs'), { recursive: true });
            await fs.mkdir(path.join(configDir, 'logs'), { recursive: true });
            await fs.mkdir(path.join(configDir, 'state'), { recursive: true });
            // Create default configuration
            const config = createDefaultConfig(options.preset);
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            // Create .gitignore for sensitive files
            const gitignore = `# FABER state files
state/*.json
logs/session-*.md
*.tmp
`;
            await fs.writeFile(path.join(configDir, '.gitignore'), gitignore);
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'success',
                    data: { configPath, preset: options.preset },
                }, null, 2));
            }
            else {
                console.log(chalk_1.default.green('✓ FABER initialized successfully'));
                console.log(chalk_1.default.gray(`  Config: ${configPath}`));
                console.log(chalk_1.default.gray(`  Preset: ${options.preset}`));
                console.log('\nNext steps:');
                console.log('  1. Configure work tracking: Edit .fractary/faber/config.json');
                console.log('  2. Start a workflow: fractary faber run --work-id <issue-number>');
                console.log('  3. Check status: fractary faber status');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (options.json) {
                console.error(JSON.stringify({
                    status: 'error',
                    error: { code: 'INIT_ERROR', message },
                }));
            }
            else {
                console.error(chalk_1.default.red('Error:'), message);
            }
            process.exit(1);
        }
    });
}
/**
 * Create default FABER configuration
 */
function createDefaultConfig(preset) {
    const baseConfig = {
        version: '1.0.0',
        preset,
        // Work tracking configuration
        work: {
            provider: 'github', // or 'jira', 'linear'
            // Provider-specific settings loaded from environment
        },
        // Repository configuration
        repo: {
            provider: 'github', // or 'gitlab', 'bitbucket'
            defaultBranch: 'main',
            branchPrefix: 'feat/',
            conventionalCommits: true,
        },
        // Specification configuration
        spec: {
            directory: '.fractary/faber/specs',
            templates: {
                feature: 'feature',
                bugfix: 'bugfix',
                refactor: 'refactor',
            },
        },
        // Log configuration
        logs: {
            directory: '.fractary/faber/logs',
            retention: {
                session: 30,
                build: 90,
                deployment: 365,
            },
        },
        // Workflow configuration
        workflow: {
            defaultAutonomy: 'guarded',
            phases: ['frame', 'architect', 'build', 'evaluate', 'release'],
            checkpoints: true,
        },
        // State management
        state: {
            directory: '.fractary/faber/state',
            persistence: 'file', // or 'none' for stateless
        },
    };
    // Apply preset modifications
    switch (preset) {
        case 'minimal':
            return {
                ...baseConfig,
                workflow: {
                    ...baseConfig.workflow,
                    checkpoints: false,
                },
                logs: {
                    ...baseConfig.logs,
                    retention: {
                        session: 7,
                        build: 30,
                        deployment: 90,
                    },
                },
            };
        case 'enterprise':
            return {
                ...baseConfig,
                workflow: {
                    ...baseConfig.workflow,
                    defaultAutonomy: 'assist',
                },
                logs: {
                    ...baseConfig.logs,
                    retention: {
                        session: 90,
                        build: 365,
                        deployment: 730,
                    },
                },
            };
        default:
            return baseConfig;
    }
}
//# sourceMappingURL=index.js.map