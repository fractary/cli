"use strict";
/**
 * Spec subcommand - Specification management
 *
 * Provides spec operations via @fractary/faber SpecManager.
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
    spec.addCommand(createSpecGetCommand());
    spec.addCommand(createSpecListCommand());
    spec.addCommand(createSpecUpdateCommand());
    spec.addCommand(createSpecValidateCommand());
    spec.addCommand(createSpecRefineCommand());
    spec.addCommand(createSpecDeleteCommand());
    spec.addCommand(createSpecTemplatesCommand());
    return spec;
}
function createSpecCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a new specification')
        .argument('<title>', 'Specification title')
        .option('--template <type>', 'Specification template (feature, bugfix, refactor)', 'feature')
        .option('--work-id <id>', 'Associated work item ID')
        .option('--json', 'Output as JSON')
        .action(async (title, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const spec = specManager.createSpec(title, {
                template: options.template,
                workId: options.workId,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: spec }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created specification: ${spec.title}`));
                console.log(chalk_1.default.gray(`  ID: ${spec.id}`));
                console.log(chalk_1.default.gray(`  Path: ${spec.path}`));
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecGetCommand() {
    return new commander_1.Command('get')
        .description('Get a specification by ID or path')
        .argument('<id>', 'Specification ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const spec = specManager.getSpec(id);
            if (!spec) {
                if (options.json) {
                    console.error(JSON.stringify({
                        status: 'error',
                        error: { code: 'SPEC_NOT_FOUND', message: `Specification not found: ${id}` },
                    }));
                }
                else {
                    console.error(chalk_1.default.red(`Specification not found: ${id}`));
                }
                process.exit(5);
            }
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: spec }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold(`${spec.title}`));
                console.log(chalk_1.default.gray(`ID: ${spec.id}`));
                console.log(chalk_1.default.gray(`Status: ${spec.metadata.validation_status || 'not_validated'}`));
                console.log(chalk_1.default.gray(`Work ID: ${spec.workId || 'N/A'}`));
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
        .option('--status <status>', 'Filter by status (draft, validated, needs_revision)')
        .option('--work-id <id>', 'Filter by work item ID')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const specs = specManager.listSpecs({
                status: options.status,
                workId: options.workId,
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
                        const status = spec.metadata.validation_status || 'not_validated';
                        const statusColor = status === 'complete' ? chalk_1.default.green :
                            status === 'failed' ? chalk_1.default.red :
                                status === 'partial' ? chalk_1.default.yellow : chalk_1.default.gray;
                        console.log(`${spec.id} ${spec.title} [${statusColor(status)}]`);
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
        .argument('<id>', 'Specification ID or path')
        .option('--title <title>', 'New title')
        .option('--content <content>', 'New content')
        .option('--work-id <id>', 'Associated work item ID')
        .option('--status <status>', 'Validation status')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const spec = specManager.updateSpec(id, {
                title: options.title,
                content: options.content,
                workId: options.workId,
                validationStatus: options.status,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: spec }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Updated specification: ${spec.title}`));
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecValidateCommand() {
    return new commander_1.Command('validate')
        .description('Validate a specification')
        .argument('<id>', 'Specification ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const result = specManager.validateSpec(id);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                const statusColor = result.status === 'pass' ? chalk_1.default.green :
                    result.status === 'fail' ? chalk_1.default.red : chalk_1.default.yellow;
                console.log(`Validation: ${statusColor(result.status.toUpperCase())}`);
                console.log(chalk_1.default.gray(`  Score: ${result.score}%`));
                // Show check results
                console.log(chalk_1.default.yellow('\nChecks:'));
                const { requirements, acceptanceCriteria } = result.checks;
                console.log(`  Requirements: ${requirements.completed}/${requirements.total} [${requirements.status}]`);
                console.log(`  Acceptance Criteria: ${acceptanceCriteria.met}/${acceptanceCriteria.total} [${acceptanceCriteria.status}]`);
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecRefineCommand() {
    return new commander_1.Command('refine')
        .description('Generate refinement questions for a specification')
        .argument('<id>', 'Specification ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const questions = specManager.generateRefinementQuestions(id);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: questions }, null, 2));
            }
            else {
                if (questions.length === 0) {
                    console.log(chalk_1.default.green('✓ Specification appears complete, no refinement questions'));
                }
                else {
                    console.log(chalk_1.default.yellow('Refinement Questions:'));
                    questions.forEach((q, i) => {
                        const priorityColor = q.priority === 'high' ? chalk_1.default.red :
                            q.priority === 'medium' ? chalk_1.default.yellow : chalk_1.default.gray;
                        console.log(`\n${i + 1}. [${priorityColor(q.priority)}] ${q.category}`);
                        console.log(`   ${q.question}`);
                    });
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecDeleteCommand() {
    return new commander_1.Command('delete')
        .description('Delete a specification')
        .argument('<id>', 'Specification ID or path')
        .option('--json', 'Output as JSON')
        .action(async (id, options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const deleted = specManager.deleteSpec(id);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { deleted } }, null, 2));
            }
            else {
                if (deleted) {
                    console.log(chalk_1.default.green(`✓ Deleted specification: ${id}`));
                }
                else {
                    console.log(chalk_1.default.yellow(`Specification not found: ${id}`));
                }
            }
        }
        catch (error) {
            handleSpecError(error, options);
        }
    });
}
function createSpecTemplatesCommand() {
    return new commander_1.Command('templates')
        .description('List available specification templates')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const specManager = await (0, sdk_1.getSpecManager)();
            const templates = specManager.getTemplates();
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: templates }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold('Available Templates:'));
                templates.forEach((t) => {
                    console.log(`  ${chalk_1.default.cyan(t.id)} - ${t.name}`);
                    console.log(chalk_1.default.gray(`    ${t.description}`));
                });
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