"use strict";
/**
 * Work subcommand - Work tracking operations
 *
 * Provides issue, comment, label, and milestone operations via @fractary/faber WorkManager.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkCommand = createWorkCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../../../sdk");
/**
 * Create the work command tree
 */
function createWorkCommand() {
    const work = new commander_1.Command('work')
        .description('Work item tracking operations');
    // Issue operations
    const issue = new commander_1.Command('issue')
        .description('Issue operations');
    issue.addCommand(createIssueFetchCommand());
    issue.addCommand(createIssueCreateCommand());
    issue.addCommand(createIssueUpdateCommand());
    issue.addCommand(createIssueCloseCommand());
    issue.addCommand(createIssueSearchCommand());
    // Comment operations
    const comment = new commander_1.Command('comment')
        .description('Comment operations');
    comment.addCommand(createCommentCreateCommand());
    comment.addCommand(createCommentListCommand());
    // Label operations
    const label = new commander_1.Command('label')
        .description('Label operations');
    label.addCommand(createLabelAddCommand());
    label.addCommand(createLabelRemoveCommand());
    label.addCommand(createLabelListCommand());
    // Milestone operations
    const milestone = new commander_1.Command('milestone')
        .description('Milestone operations');
    milestone.addCommand(createMilestoneCreateCommand());
    milestone.addCommand(createMilestoneListCommand());
    milestone.addCommand(createMilestoneSetCommand());
    work.addCommand(issue);
    work.addCommand(comment);
    work.addCommand(label);
    work.addCommand(milestone);
    return work;
}
// Issue Commands
function createIssueFetchCommand() {
    return new commander_1.Command('fetch')
        .description('Fetch a work item by ID')
        .argument('<number>', 'Issue number')
        .option('--json', 'Output as JSON')
        .option('--verbose', 'Show additional details')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issue = await workManager.fetchIssue(parseInt(number, 10));
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: issue }, null, 2));
            }
            else {
                console.log(chalk_1.default.bold(`#${issue.number}: ${issue.title}`));
                console.log(chalk_1.default.gray(`State: ${issue.state}`));
                if (issue.body) {
                    console.log('\n' + issue.body);
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a new work item')
        .requiredOption('--title <title>', 'Issue title')
        .option('--body <body>', 'Issue body')
        .option('--labels <labels>', 'Comma-separated labels')
        .option('--assignees <assignees>', 'Comma-separated assignees')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issue = await workManager.createIssue({
                title: options.title,
                body: options.body,
                labels: options.labels?.split(',').map((l) => l.trim()),
                assignees: options.assignees?.split(',').map((a) => a.trim()),
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: issue }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created issue #${issue.number}: ${issue.title}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueUpdateCommand() {
    return new commander_1.Command('update')
        .description('Update a work item')
        .argument('<number>', 'Issue number')
        .option('--title <title>', 'New title')
        .option('--body <body>', 'New body')
        .option('--state <state>', 'New state (open, closed)')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issue = await workManager.updateIssue(parseInt(number, 10), {
                title: options.title,
                body: options.body,
                state: options.state,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: issue }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Updated issue #${issue.number}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueCloseCommand() {
    return new commander_1.Command('close')
        .description('Close a work item')
        .argument('<number>', 'Issue number')
        .option('--comment <text>', 'Add closing comment')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            // Add comment if provided
            if (options.comment) {
                await workManager.createComment(parseInt(number, 10), options.comment);
            }
            const issue = await workManager.closeIssue(parseInt(number, 10));
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: issue }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Closed issue #${number}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueSearchCommand() {
    return new commander_1.Command('search')
        .description('Search work items')
        .requiredOption('--query <query>', 'Search query')
        .option('--state <state>', 'Filter by state (open, closed, all)', 'open')
        .option('--labels <labels>', 'Filter by labels (comma-separated)')
        .option('--limit <n>', 'Max results', '10')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issues = await workManager.searchIssues(options.query, {
                state: options.state,
                labels: options.labels?.split(',').map((l) => l.trim()),
            });
            // Note: Limit is handled client-side as IssueFilters doesn't support it
            const limitedIssues = options.limit ? issues.slice(0, parseInt(options.limit, 10)) : issues;
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: limitedIssues }, null, 2));
            }
            else {
                if (limitedIssues.length === 0) {
                    console.log(chalk_1.default.yellow('No issues found'));
                }
                else {
                    limitedIssues.forEach((issue) => {
                        console.log(`#${issue.number} ${issue.title} [${issue.state}]`);
                    });
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
// Comment Commands
function createCommentCreateCommand() {
    return new commander_1.Command('create')
        .description('Add a comment to an issue')
        .argument('<issue_number>', 'Issue number')
        .requiredOption('--body <text>', 'Comment body')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const comment = await workManager.createComment(parseInt(issueNumber, 10), options.body);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: comment }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Added comment to issue #${issueNumber}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createCommentListCommand() {
    return new commander_1.Command('list')
        .description('List comments on an issue')
        .argument('<issue_number>', 'Issue number')
        .option('--limit <n>', 'Max results', '20')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const comments = await workManager.listComments(parseInt(issueNumber, 10), {
                limit: parseInt(options.limit, 10),
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: comments }, null, 2));
            }
            else {
                if (comments.length === 0) {
                    console.log(chalk_1.default.yellow('No comments found'));
                }
                else {
                    comments.forEach((comment) => {
                        console.log(chalk_1.default.gray(`[${comment.author}] ${comment.created_at}`));
                        console.log(comment.body);
                        console.log('');
                    });
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
// Label Commands
function createLabelAddCommand() {
    return new commander_1.Command('add')
        .description('Add labels to an issue')
        .argument('<issue_number>', 'Issue number')
        .requiredOption('--label <names>', 'Label name(s), comma-separated')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const labels = options.label.split(',').map((l) => l.trim());
            const result = await workManager.addLabels(parseInt(issueNumber, 10), labels);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Added label(s) to issue #${issueNumber}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createLabelRemoveCommand() {
    return new commander_1.Command('remove')
        .description('Remove labels from an issue')
        .argument('<issue_number>', 'Issue number')
        .requiredOption('--label <names>', 'Label name(s), comma-separated')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const labels = options.label.split(',').map((l) => l.trim());
            await workManager.removeLabels(parseInt(issueNumber, 10), labels);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { removed: labels } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Removed label(s) from issue #${issueNumber}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createLabelListCommand() {
    return new commander_1.Command('list')
        .description('List labels')
        .option('--issue <number>', 'List labels for specific issue')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const labels = options.issue
                ? await workManager.listLabels(parseInt(options.issue, 10))
                : await workManager.listLabels();
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: labels }, null, 2));
            }
            else {
                if (labels.length === 0) {
                    console.log(chalk_1.default.yellow('No labels found'));
                }
                else {
                    labels.forEach((label) => {
                        console.log(`- ${label.name}`);
                    });
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
// Milestone Commands
function createMilestoneCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a milestone')
        .requiredOption('--title <title>', 'Milestone title')
        .option('--description <text>', 'Milestone description')
        .option('--due-on <date>', 'Due date (ISO format)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const milestone = await workManager.createMilestone({
                title: options.title,
                description: options.description,
                due_on: options.dueOn,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: milestone }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created milestone: ${milestone.title}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createMilestoneListCommand() {
    return new commander_1.Command('list')
        .description('List milestones')
        .option('--state <state>', 'Filter by state (open, closed, all)', 'open')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const milestones = await workManager.listMilestones(options.state);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: milestones }, null, 2));
            }
            else {
                if (milestones.length === 0) {
                    console.log(chalk_1.default.yellow('No milestones found'));
                }
                else {
                    milestones.forEach((ms) => {
                        console.log(`${ms.title} [${ms.state}]`);
                    });
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createMilestoneSetCommand() {
    return new commander_1.Command('set')
        .description('Set milestone on an issue')
        .argument('<issue_number>', 'Issue number')
        .requiredOption('--milestone <title>', 'Milestone title')
        .option('--json', 'Output as JSON')
        .action(async (issueNumber, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issue = await workManager.setMilestone(parseInt(issueNumber, 10), options.milestone);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: issue }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Set milestone '${options.milestone}' on issue #${issueNumber}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
// Error handling
function handleWorkError(error, options) {
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
            error: { code: 'WORK_ERROR', message },
        }));
    }
    else {
        console.error(chalk_1.default.red('Error:'), message);
    }
    process.exit(1);
}
//# sourceMappingURL=index.js.map