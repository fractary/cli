/**
 * Workflow commands - FABER workflow execution
 *
 * Provides run, status, plan commands via FaberWorkflow SDK.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getWorkflow, getStateManager, SDKNotAvailableError } from '../../../../sdk';

/**
 * Create the run command
 */
export function createRunCommand(): Command {
  return new Command('run')
    .description('Run FABER workflow')
    .requiredOption('--work-id <id>', 'Work item ID to process')
    .option('--autonomy <level>', 'Autonomy level: dry-run|assist|guarded|autonomous', 'guarded')
    .option('--phase <phase>', 'Start from specific phase: frame|architect|build|evaluate|release')
    .option('--resume', 'Resume from last checkpoint')
    .option('--skip-frame', 'Skip frame phase (reuse existing context)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const workflow = await getWorkflow();

        console.log(chalk.blue(`Starting FABER workflow for work item #${options.workId}`));
        console.log(chalk.gray(`Autonomy: ${options.autonomy}`));

        if (options.phase) {
          console.log(chalk.gray(`Starting from phase: ${options.phase}`));
        }

        const result = await workflow.run({
          workId: options.workId,
          autonomy: options.autonomy,
          startPhase: options.phase,
          resume: options.resume,
          skipFrame: options.skipFrame,
          onPhaseStart: (phase: string) => {
            if (!options.json) {
              console.log(chalk.cyan(`\n→ Starting phase: ${phase.toUpperCase()}`));
            }
          },
          onPhaseComplete: (phase: string, result: any) => {
            if (!options.json) {
              console.log(chalk.green(`  ✓ Completed phase: ${phase}`));
            }
          },
          onCheckpoint: (checkpoint: any) => {
            if (!options.json) {
              console.log(chalk.gray(`  [checkpoint saved]`));
            }
          },
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`\n✓ Workflow completed successfully`));
          console.log(chalk.gray(`  Duration: ${result.duration}ms`));
          console.log(chalk.gray(`  Phases completed: ${result.phasesCompleted.join(' → ')}`));
        }
      } catch (error) {
        handleWorkflowError(error, options);
      }
    });
}

/**
 * Create the status command
 */
export function createStatusCommand(): Command {
  return new Command('status')
    .description('Show workflow status')
    .option('--work-id <id>', 'Work item ID to check')
    .option('--verbose', 'Show detailed status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const stateManager = await getStateManager();

        if (options.workId) {
          // Status for specific work item
          const status = await stateManager.getWorkflowStatus(options.workId);

          if (options.json) {
            console.log(JSON.stringify({ status: 'success', data: status }, null, 2));
          } else {
            console.log(chalk.bold(`Workflow Status: Work Item #${options.workId}`));
            console.log(`  State: ${getStateColor(status.state)(status.state)}`);
            console.log(`  Current Phase: ${status.currentPhase || 'N/A'}`);
            console.log(`  Started: ${status.startedAt || 'N/A'}`);

            if (status.checkpoint) {
              console.log(chalk.gray(`  Last Checkpoint: ${status.checkpoint.savedAt}`));
            }

            if (options.verbose && status.phases) {
              console.log(chalk.yellow('\nPhase Details:'));
              status.phases.forEach((phase: any) => {
                const icon = phase.complete ? chalk.green('✓') :
                             phase.current ? chalk.cyan('→') : chalk.gray('○');
                console.log(`  ${icon} ${phase.name} ${phase.duration ? `(${phase.duration}ms)` : ''}`);
              });
            }
          }
        } else {
          // List all active workflows
          const activeWorkflows = await stateManager.listActiveWorkflows();

          if (options.json) {
            console.log(JSON.stringify({ status: 'success', data: activeWorkflows }, null, 2));
          } else {
            if (activeWorkflows.length === 0) {
              console.log(chalk.yellow('No active workflows'));
            } else {
              console.log(chalk.bold('Active Workflows:'));
              activeWorkflows.forEach((wf: any) => {
                console.log(`  #${wf.workId}: ${wf.currentPhase} [${getStateColor(wf.state)(wf.state)}]`);
              });
            }
          }
        }
      } catch (error) {
        handleWorkflowError(error, options);
      }
    });
}

/**
 * Create the plan command
 */
export function createPlanCommand(): Command {
  return new Command('plan')
    .description('Create or view execution plan')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--output <path>', 'Output plan to file')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const workflow = await getWorkflow();

        // Generate or retrieve plan
        const plan = await workflow.createPlan(options.workId);

        if (options.output) {
          const fs = await import('fs/promises');
          await fs.writeFile(options.output, JSON.stringify(plan, null, 2));

          if (!options.json) {
            console.log(chalk.green(`✓ Plan saved to: ${options.output}`));
          }
        }

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: plan }, null, 2));
        } else {
          console.log(chalk.bold(`Execution Plan: Work Item #${options.workId}`));
          console.log(chalk.gray(`Generated: ${plan.createdAt}`));
          console.log('');

          // Show phases
          console.log(chalk.yellow('Phases:'));
          plan.phases.forEach((phase: any, i: number) => {
            console.log(`  ${i + 1}. ${chalk.cyan(phase.name.toUpperCase())}`);
            console.log(chalk.gray(`     ${phase.description}`));

            if (phase.tasks && phase.tasks.length > 0) {
              phase.tasks.forEach((task: string) => {
                console.log(`       - ${task}`);
              });
            }
          });

          // Show dependencies
          if (plan.dependencies && plan.dependencies.length > 0) {
            console.log(chalk.yellow('\nDependencies:'));
            plan.dependencies.forEach((dep: any) => {
              console.log(`  - ${dep.name}: ${dep.status}`);
            });
          }

          // Show estimated effort
          if (plan.estimate) {
            console.log(chalk.yellow('\nEstimated Effort:'));
            console.log(`  Complexity: ${plan.estimate.complexity}`);
            console.log(`  Risk: ${plan.estimate.risk}`);
          }
        }
      } catch (error) {
        handleWorkflowError(error, options);
      }
    });
}

// Helper functions

function getStateColor(state: string): (text: string) => string {
  switch (state) {
    case 'running':
      return chalk.cyan;
    case 'completed':
      return chalk.green;
    case 'failed':
      return chalk.red;
    case 'paused':
      return chalk.yellow;
    case 'pending':
      return chalk.gray;
    default:
      return chalk.white;
  }
}

// Error handling

function handleWorkflowError(error: unknown, options: { json?: boolean }): void {
  if (error instanceof SDKNotAvailableError) {
    if (options.json) {
      console.error(JSON.stringify({
        status: 'error',
        error: { code: 'SDK_NOT_AVAILABLE', message: error.message },
      }));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }
    process.exit(9);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (options.json) {
    console.error(JSON.stringify({
      status: 'error',
      error: { code: 'WORKFLOW_ERROR', message },
    }));
  } else {
    console.error(chalk.red('Error:'), message);
  }
  process.exit(1);
}
