"use strict";
/**
 * Workflow commands - FABER workflow execution
 *
 * Provides run, status, plan commands via FaberWorkflow SDK.
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
exports.createRunCommand = createRunCommand;
exports.createStatusCommand = createStatusCommand;
exports.createPlanCommand = createPlanCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../../../sdk");
/**
 * Create the run command
 */
function createRunCommand() {
    return new commander_1.Command('run')
        .description('Run FABER workflow')
        .requiredOption('--work-id <id>', 'Work item ID to process')
        .option('--autonomy <level>', 'Autonomy level: dry-run|assist|guarded|autonomous', 'guarded')
        .option('--phase <phase>', 'Start from specific phase: frame|architect|build|evaluate|release')
        .option('--resume', 'Resume from last checkpoint')
        .option('--skip-frame', 'Skip frame phase (reuse existing context)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workflow = await (0, sdk_1.getWorkflow)();
            console.log(chalk_1.default.blue(`Starting FABER workflow for work item #${options.workId}`));
            console.log(chalk_1.default.gray(`Autonomy: ${options.autonomy}`));
            if (options.phase) {
                console.log(chalk_1.default.gray(`Starting from phase: ${options.phase}`));
            }
            const result = await workflow.run({
                workId: options.workId,
                autonomy: options.autonomy,
                startPhase: options.phase,
                resume: options.resume,
                skipFrame: options.skipFrame,
                onPhaseStart: (phase) => {
                    if (!options.json) {
                        console.log(chalk_1.default.cyan(`\n→ Starting phase: ${phase.toUpperCase()}`));
                    }
                },
                onPhaseComplete: (phase, result) => {
                    if (!options.json) {
                        console.log(chalk_1.default.green(`  ✓ Completed phase: ${phase}`));
                    }
                },
                onCheckpoint: (checkpoint) => {
                    if (!options.json) {
                        console.log(chalk_1.default.gray(`  [checkpoint saved]`));
                    }
                },
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`\n✓ Workflow completed successfully`));
                console.log(chalk_1.default.gray(`  Duration: ${result.duration}ms`));
                console.log(chalk_1.default.gray(`  Phases completed: ${result.phasesCompleted.join(' → ')}`));
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
/**
 * Create the status command
 */
function createStatusCommand() {
    return new commander_1.Command('status')
        .description('Show workflow status')
        .option('--work-id <id>', 'Work item ID to check')
        .option('--verbose', 'Show detailed status')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const stateManager = await (0, sdk_1.getStateManager)();
            if (options.workId) {
                // Status for specific work item
                const status = await stateManager.getWorkflowStatus(options.workId);
                if (options.json) {
                    console.log(JSON.stringify({ status: 'success', data: status }, null, 2));
                }
                else {
                    console.log(chalk_1.default.bold(`Workflow Status: Work Item #${options.workId}`));
                    console.log(`  State: ${getStateColor(status.state)(status.state)}`);
                    console.log(`  Current Phase: ${status.currentPhase || 'N/A'}`);
                    console.log(`  Started: ${status.startedAt || 'N/A'}`);
                    if (status.checkpoint) {
                        console.log(chalk_1.default.gray(`  Last Checkpoint: ${status.checkpoint.savedAt}`));
                    }
                    if (options.verbose && status.phases) {
                        console.log(chalk_1.default.yellow('\nPhase Details:'));
                        status.phases.forEach((phase) => {
                            const icon = phase.complete ? chalk_1.default.green('✓') :
                                phase.current ? chalk_1.default.cyan('→') : chalk_1.default.gray('○');
                            console.log(`  ${icon} ${phase.name} ${phase.duration ? `(${phase.duration}ms)` : ''}`);
                        });
                    }
                }
            }
            else {
                // List all active workflows
                const activeWorkflows = await stateManager.listActiveWorkflows();
                if (options.json) {
                    console.log(JSON.stringify({ status: 'success', data: activeWorkflows }, null, 2));
                }
                else {
                    if (activeWorkflows.length === 0) {
                        console.log(chalk_1.default.yellow('No active workflows'));
                    }
                    else {
                        console.log(chalk_1.default.bold('Active Workflows:'));
                        activeWorkflows.forEach((wf) => {
                            console.log(`  #${wf.workId}: ${wf.currentPhase} [${getStateColor(wf.state)(wf.state)}]`);
                        });
                    }
                }
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
/**
 * Create the plan command
 */
function createPlanCommand() {
    return new commander_1.Command('plan')
        .description('Create or view execution plan')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--output <path>', 'Output plan to file')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workflow = await (0, sdk_1.getWorkflow)();
            // Generate or retrieve plan
            const plan = await workflow.createPlan(options.workId);
            if (options.output) {
                const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
                await fs.writeFile(options.output, JSON.stringify(plan, null, 2));
                if (!options.json) {
                    console.log(chalk_1.default.green(`✓ Plan saved to: ${options.output}`));
                }
            }
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: plan }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold(`Execution Plan: Work Item #${options.workId}`));
                console.log(chalk_1.default.gray(`Generated: ${plan.createdAt}`));
                console.log('');
                // Show phases
                console.log(chalk_1.default.yellow('Phases:'));
                plan.phases.forEach((phase, i) => {
                    console.log(`  ${i + 1}. ${chalk_1.default.cyan(phase.name.toUpperCase())}`);
                    console.log(chalk_1.default.gray(`     ${phase.description}`));
                    if (phase.tasks && phase.tasks.length > 0) {
                        phase.tasks.forEach((task) => {
                            console.log(`       - ${task}`);
                        });
                    }
                });
                // Show dependencies
                if (plan.dependencies && plan.dependencies.length > 0) {
                    console.log(chalk_1.default.yellow('\nDependencies:'));
                    plan.dependencies.forEach((dep) => {
                        console.log(`  - ${dep.name}: ${dep.status}`);
                    });
                }
                // Show estimated effort
                if (plan.estimate) {
                    console.log(chalk_1.default.yellow('\nEstimated Effort:'));
                    console.log(`  Complexity: ${plan.estimate.complexity}`);
                    console.log(`  Risk: ${plan.estimate.risk}`);
                }
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
// Helper functions
function getStateColor(state) {
    switch (state) {
        case 'running':
            return chalk_1.default.cyan;
        case 'completed':
            return chalk_1.default.green;
        case 'failed':
            return chalk_1.default.red;
        case 'paused':
            return chalk_1.default.yellow;
        case 'pending':
            return chalk_1.default.gray;
        default:
            return chalk_1.default.white;
    }
}
// Error handling
function handleWorkflowError(error, options) {
    if (error instanceof sdk_1.SDKNotAvailableError) {
        if (options.json) {
            console.error(JSON.stringify({
                status: 'error',
                error: { code: 'SDK_NOT_AVAILABLE', message: error.message },
            }));
        }
        else {
            console.error(chalk_1.default.red('Error:'), error.message);
        }
        process.exit(9);
    }
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
        console.error(JSON.stringify({
            status: 'error',
            error: { code: 'WORKFLOW_ERROR', message },
        }));
    }
    else {
        console.error(chalk_1.default.red('Error:'), message);
    }
    process.exit(1);
}
//# sourceMappingURL=index.js.map