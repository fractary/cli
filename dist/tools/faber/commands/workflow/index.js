"use strict";
/**
 * Workflow commands - FABER workflow execution
 *
 * Provides run, status, resume, pause commands via FaberWorkflow SDK.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRunCommand = createRunCommand;
exports.createStatusCommand = createStatusCommand;
exports.createResumeCommand = createResumeCommand;
exports.createPauseCommand = createPauseCommand;
exports.createRecoverCommand = createRecoverCommand;
exports.createCleanupCommand = createCleanupCommand;
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
        .option('--autonomy <level>', 'Autonomy level: supervised|assisted|autonomous', 'supervised')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workflow = await (0, sdk_1.getWorkflow)();
            if (!options.json) {
                console.log(chalk_1.default.blue(`Starting FABER workflow for work item #${options.workId}`));
                console.log(chalk_1.default.gray(`Autonomy: ${options.autonomy}`));
            }
            // Add event listener for progress updates
            workflow.addEventListener((event, data) => {
                if (options.json)
                    return;
                switch (event) {
                    case 'phase:start':
                        console.log(chalk_1.default.cyan(`\n→ Starting phase: ${String(data.phase || '').toUpperCase()}`));
                        break;
                    case 'phase:complete':
                        console.log(chalk_1.default.green(`  ✓ Completed phase: ${data.phase}`));
                        break;
                    case 'workflow:fail':
                    case 'phase:fail':
                        console.error(chalk_1.default.red(`  ✗ Error: ${data.error || 'Unknown error'}`));
                        break;
                }
            });
            const result = await workflow.run({
                workId: options.workId,
                autonomy: options.autonomy,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`\n✓ Workflow ${result.status}`));
                console.log(chalk_1.default.gray(`  Workflow ID: ${result.workflow_id}`));
                console.log(chalk_1.default.gray(`  Duration: ${result.duration_ms}ms`));
                console.log(chalk_1.default.gray(`  Phases: ${result.phases.map(p => p.phase).join(' → ')}`));
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
        .option('--workflow-id <id>', 'Workflow ID to check')
        .option('--verbose', 'Show detailed status')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const stateManager = await (0, sdk_1.getStateManager)();
            if (options.workflowId) {
                // Status for specific workflow by ID
                const workflow = await (0, sdk_1.getWorkflow)();
                const status = workflow.getStatus(options.workflowId);
                if (options.json) {
                    console.log(JSON.stringify({ status: 'success', data: status }, null, 2));
                }
                else {
                    console.log(chalk_1.default.bold(`Workflow Status: ${options.workflowId}`));
                    console.log(`  Current Phase: ${status.currentPhase || 'N/A'}`);
                    console.log(`  Progress: ${status.progress}%`);
                }
            }
            else if (options.workId) {
                // Status for work item's active workflow
                const state = stateManager.getActiveWorkflow(options.workId);
                if (!state) {
                    if (options.json) {
                        console.log(JSON.stringify({
                            status: 'success',
                            data: { active: false, message: 'No active workflow' },
                        }, null, 2));
                    }
                    else {
                        console.log(chalk_1.default.yellow(`No active workflow for work item #${options.workId}`));
                    }
                    return;
                }
                if (options.json) {
                    console.log(JSON.stringify({ status: 'success', data: state }, null, 2));
                }
                else {
                    console.log(chalk_1.default.bold(`Workflow Status: Work Item #${options.workId}`));
                    console.log(`  Workflow ID: ${state.workflow_id}`);
                    console.log(`  State: ${getStateColor(state.status)(state.status)}`);
                    console.log(`  Current Phase: ${state.current_phase || 'N/A'}`);
                    console.log(`  Started: ${state.started_at || 'N/A'}`);
                    if (options.verbose && state.phase_states) {
                        console.log(chalk_1.default.yellow('\nPhase Details:'));
                        Object.entries(state.phase_states).forEach(([phase, phaseState]) => {
                            const ps = phaseState;
                            const icon = ps.status === 'completed' ? chalk_1.default.green('✓') :
                                ps.status === 'in_progress' ? chalk_1.default.cyan('→') :
                                    ps.status === 'failed' ? chalk_1.default.red('✗') : chalk_1.default.gray('○');
                            console.log(`  ${icon} ${phase}`);
                        });
                    }
                }
            }
            else {
                // List all workflows
                const workflows = stateManager.listWorkflows();
                if (options.json) {
                    console.log(JSON.stringify({ status: 'success', data: workflows }, null, 2));
                }
                else {
                    if (workflows.length === 0) {
                        console.log(chalk_1.default.yellow('No workflows found'));
                    }
                    else {
                        console.log(chalk_1.default.bold('Workflows:'));
                        workflows.forEach((wf) => {
                            const stateColor = getStateColor(wf.status);
                            console.log(`  ${wf.workflow_id}: work #${wf.work_id} - ${wf.current_phase || 'N/A'} [${stateColor(wf.status)}]`);
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
 * Create the resume command
 */
function createResumeCommand() {
    return new commander_1.Command('resume')
        .description('Resume a paused workflow')
        .argument('<workflow_id>', 'Workflow ID to resume')
        .option('--json', 'Output as JSON')
        .action(async (workflowId, options) => {
        try {
            const workflow = await (0, sdk_1.getWorkflow)();
            if (!options.json) {
                console.log(chalk_1.default.blue(`Resuming workflow: ${workflowId}`));
            }
            const result = await workflow.resume(workflowId);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`\n✓ Workflow ${result.status}`));
                console.log(chalk_1.default.gray(`  Duration: ${result.duration_ms}ms`));
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
/**
 * Create the pause command
 */
function createPauseCommand() {
    return new commander_1.Command('pause')
        .description('Pause a running workflow')
        .argument('<workflow_id>', 'Workflow ID to pause')
        .option('--json', 'Output as JSON')
        .action(async (workflowId, options) => {
        try {
            const workflow = await (0, sdk_1.getWorkflow)();
            workflow.pause(workflowId);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { paused: workflowId } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Paused workflow: ${workflowId}`));
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
/**
 * Create the recover command
 */
function createRecoverCommand() {
    return new commander_1.Command('recover')
        .description('Recover a workflow from checkpoint')
        .argument('<workflow_id>', 'Workflow ID to recover')
        .option('--checkpoint <id>', 'Specific checkpoint ID to recover from')
        .option('--phase <phase>', 'Recover to specific phase')
        .option('--json', 'Output as JSON')
        .action(async (workflowId, options) => {
        try {
            const stateManager = await (0, sdk_1.getStateManager)();
            const state = stateManager.recoverWorkflow(workflowId, {
                checkpointId: options.checkpoint,
                fromPhase: options.phase,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: state }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Recovered workflow: ${workflowId}`));
                console.log(chalk_1.default.gray(`  Current phase: ${state.current_phase}`));
                console.log(chalk_1.default.gray(`  Status: ${state.status}`));
            }
        }
        catch (error) {
            handleWorkflowError(error, options);
        }
    });
}
/**
 * Create the cleanup command
 */
function createCleanupCommand() {
    return new commander_1.Command('cleanup')
        .description('Clean up old workflow states')
        .option('--max-age <days>', 'Delete workflows older than N days', '30')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const stateManager = await (0, sdk_1.getStateManager)();
            const result = stateManager.cleanup(parseInt(options.maxAge, 10));
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                if (result.deleted === 0) {
                    console.log(chalk_1.default.yellow('No workflows to clean up'));
                }
                else {
                    console.log(chalk_1.default.green(`✓ Cleaned up ${result.deleted} workflow(s)`));
                }
                if (result.errors.length > 0) {
                    console.log(chalk_1.default.yellow(`\nErrors (${result.errors.length}):`));
                    result.errors.forEach((err) => {
                        console.log(chalk_1.default.red(`  - ${err}`));
                    });
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
        case 'idle':
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