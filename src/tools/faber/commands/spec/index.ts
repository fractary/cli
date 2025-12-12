/**
 * Spec subcommand - Specification management
 *
 * Provides spec create, refine, validate, archive, read, list, update operations via SpecManager SDK.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getSpecManager, SDKNotAvailableError } from '../../../../sdk';

/**
 * Create the spec command tree
 */
export function createSpecCommand(): Command {
  const spec = new Command('spec')
    .description('Specification management');

  spec.addCommand(createSpecCreateCommand());
  spec.addCommand(createSpecRefineCommand());
  spec.addCommand(createSpecValidateCommand());
  spec.addCommand(createSpecArchiveCommand());
  spec.addCommand(createSpecReadCommand());
  spec.addCommand(createSpecListCommand());
  spec.addCommand(createSpecUpdateCommand());

  return spec;
}

function createSpecCreateCommand(): Command {
  return new Command('create')
    .description('Create a new specification')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--template <type>', 'Specification template', 'feature')
    .option('--force', 'Overwrite existing spec')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const result = await specManager.create({
          workId: options.workId,
          template: options.template,
          force: options.force,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created specification for work item #${options.workId}`));
          console.log(chalk.gray(`  Path: ${result.path}`));
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecRefineCommand(): Command {
  return new Command('refine')
    .description('Refine specification with Q&A')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--prompt <focus>', 'Focus area for refinement')
    .option('--round <n>', 'Refinement round number', '1')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const result = await specManager.refine({
          workId: options.workId,
          prompt: options.prompt,
          round: parseInt(options.round, 10),
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Refined specification (round ${options.round})`));
          if (result.questions && result.questions.length > 0) {
            console.log(chalk.yellow('\nQuestions to address:'));
            result.questions.forEach((q: string, i: number) => {
              console.log(`  ${i + 1}. ${q}`);
            });
          }
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecValidateCommand(): Command {
  return new Command('validate')
    .description('Validate implementation against spec')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--phase <phase>', 'Specific phase to validate')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const result = await specManager.validate({
          workId: options.workId,
          phase: options.phase,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          if (result.valid) {
            console.log(chalk.green('✓ Specification validation passed'));
          } else {
            console.log(chalk.red('✗ Specification validation failed'));
            if (result.errors && result.errors.length > 0) {
              result.errors.forEach((err: string) => {
                console.log(chalk.red(`  - ${err}`));
              });
            }
          }

          if (result.checklist) {
            console.log(chalk.yellow('\nChecklist:'));
            result.checklist.forEach((item: any) => {
              const status = item.complete ? chalk.green('✓') : chalk.red('✗');
              console.log(`  ${status} ${item.task}`);
            });
          }
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecArchiveCommand(): Command {
  return new Command('archive')
    .description('Archive specification to cloud storage')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--force', 'Force archive even if incomplete')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const result = await specManager.archive({
          workId: options.workId,
          force: options.force,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Archived specification`));
          if (result.url) {
            console.log(chalk.gray(`  URL: ${result.url}`));
          }
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecReadCommand(): Command {
  return new Command('read')
    .description('Read a specification')
    .requiredOption('--work-id <id>', 'Work item ID')
    .option('--phase <n>', 'Specific phase to read')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const spec = await specManager.read({
          workId: options.workId,
          phase: options.phase,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: spec }, null, 2));
        } else {
          console.log(chalk.bold(`Specification: ${spec.title || `Work Item #${options.workId}`}`));
          console.log(chalk.gray(`Status: ${spec.status}`));
          console.log(chalk.gray(`Last Updated: ${spec.updatedAt}`));
          console.log('\n' + spec.content);
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecListCommand(): Command {
  return new Command('list')
    .description('List specifications')
    .option('--status <status>', 'Filter by status (draft, complete, archived)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const specs = await specManager.list({
          status: options.status,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: specs }, null, 2));
        } else {
          if (specs.length === 0) {
            console.log(chalk.yellow('No specifications found'));
          } else {
            specs.forEach((spec: any) => {
              const statusColor = spec.status === 'complete' ? chalk.green :
                                  spec.status === 'archived' ? chalk.gray : chalk.yellow;
              console.log(`#${spec.workId} ${spec.title || '(untitled)'} [${statusColor(spec.status)}]`);
            });
          }
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

function createSpecUpdateCommand(): Command {
  return new Command('update')
    .description('Update a specification')
    .requiredOption('--work-id <id>', 'Work item ID')
    .requiredOption('--phase <id>', 'Phase ID to update')
    .option('--status <status>', 'New status')
    .option('--check-task <text>', 'Mark a checklist task as complete')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const specManager = await getSpecManager();
        const result = await specManager.update({
          workId: options.workId,
          phase: options.phase,
          status: options.status,
          checkTask: options.checkTask,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Updated specification`));
        }
      } catch (error) {
        handleSpecError(error, options);
      }
    });
}

// Error handling

function handleSpecError(error: unknown, options: { json?: boolean }): void {
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
      error: { code: 'SPEC_ERROR', message },
    }));
  } else {
    console.error(chalk.red('Error:'), message);
  }
  process.exit(1);
}
