"use strict";
/**
 * Spec subcommand - Specification management
 *
 * Provides spec create, refine, validate, archive, read, list, update operations via SpecManager SDK.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpecCommand = createSpecCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../../../sdk");
/**
 * Create the spec command tree
 */
function createSpecCommand() {
    const spec = new commander_1.Command('spec')
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
function createSpecCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a new specification')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--template <type>', 'Specification template', 'feature')
        .option('--force', 'Overwrite existing spec')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = await specManager.create({
                workId: options.workId,
                template: options.template,
                force: options.force,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created specification for work item #${options.workId}`));
                console.log(chalk_1.default.gray(`  Path: ${result.path}`));
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecRefineCommand() {
    return new commander_1.Command('refine')
        .description('Refine specification with Q&A')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--prompt <focus>', 'Focus area for refinement')
        .option('--round <n>', 'Refinement round number', '1')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = await specManager.refine({
                workId: options.workId,
                prompt: options.prompt,
                round: parseInt(options.round, 10),
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Refined specification (round ${options.round})`));
                if (result.questions && result.questions.length > 0) {
                    console.log(chalk_1.default.yellow('\nQuestions to address:'));
                    result.questions.forEach((q, i) => {
                        console.log(`  ${i + 1}. ${q}`);
                    });
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecValidateCommand() {
    return new commander_1.Command('validate')
        .description('Validate implementation against spec')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--phase <phase>', 'Specific phase to validate')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = await specManager.validate({
                workId: options.workId,
                phase: options.phase,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                if (result.valid) {
                    console.log(chalk_1.default.green('✓ Specification validation passed'));
                }
                else {
                    console.log(chalk_1.default.red('✗ Specification validation failed'));
                    if (result.errors && result.errors.length > 0) {
                        result.errors.forEach((err) => {
                            console.log(chalk_1.default.red(`  - ${err}`));
                        });
                    }
                }
                if (result.checklist) {
                    console.log(chalk_1.default.yellow('\nChecklist:'));
                    result.checklist.forEach((item) => {
                        const status = item.complete ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                        console.log(`  ${status} ${item.task}`);
                    });
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecArchiveCommand() {
    return new commander_1.Command('archive')
        .description('Archive specification to cloud storage')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--force', 'Force archive even if incomplete')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = await specManager.archive({
                workId: options.workId,
                force: options.force,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Archived specification`));
                if (result.url) {
                    console.log(chalk_1.default.gray(`  URL: ${result.url}`));
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecReadCommand() {
    return new commander_1.Command('read')
        .description('Read a specification')
        .requiredOption('--work-id <id>', 'Work item ID')
        .option('--phase <n>', 'Specific phase to read')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const spec = await specManager.read({
                workId: options.workId,
                phase: options.phase,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: spec }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold(`Specification: ${spec.title || `Work Item #${options.workId}`}`));
                console.log(chalk_1.default.gray(`Status: ${spec.status}`));
                console.log(chalk_1.default.gray(`Last Updated: ${spec.updatedAt}`));
                console.log('\n' + spec.content);
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecListCommand() {
    return new commander_1.Command('list')
        .description('List specifications')
        .option('--status <status>', 'Filter by status (draft, complete, archived)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const specs = await specManager.list({
                status: options.status,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: specs }, null, 2));
            }
            else {
                if (specs.length === 0) {
                    console.log(chalk_1.default.yellow('No specifications found'));
                }
                else {
                    specs.forEach((spec) => {
                        const statusColor = spec.status === 'complete' ? chalk_1.default.green :
                            spec.status === 'archived' ? chalk_1.default.gray : chalk_1.default.yellow;
                        console.log(`#${spec.workId} ${spec.title || '(untitled)'} [${statusColor(spec.status)}]`);
                    });
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecUpdateCommand() {
    return new commander_1.Command('update')
        .description('Update a specification')
        .requiredOption('--work-id <id>', 'Work item ID')
        .requiredOption('--phase <id>', 'Phase ID to update')
        .option('--status <status>', 'New status')
        .option('--check-task <text>', 'Mark a checklist task as complete')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = await specManager.update({
                workId: options.workId,
                phase: options.phase,
                status: options.status,
                checkTask: options.checkTask,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Updated specification`));
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
// Error handling
function handleSpecError(error, options) {
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
            error: { code: 'SPEC_ERROR', message },
        }));
    }
    else {
        console.error(chalk_1.default.red('Error:'), message);
    }
    process.exit(1);
}
//# sourceMappingURL=index.js.map