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
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
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
    issue.addCommand(createIssueReopenCommand());
    issue.addCommand(createIssueAssignCommand());
    issue.addCommand(createIssueClassifyCommand());
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
    work.addCommand(createInitCommand());
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
function createIssueReopenCommand() {
    return new commander_1.Command('reopen')
        .description('Reopen a closed work item')
        .argument('<number>', 'Issue number')
        .option('--comment <text>', 'Add comment when reopening')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            // Add comment if provided
            if (options.comment) {
                await workManager.createComment(parseInt(number, 10), options.comment);
            }
            // Reopen using SDK method
            const issue = await workManager.reopenIssue(parseInt(number, 10));
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'success',
                    data: {
                        number: issue.number,
                        state: issue.state,
                        url: issue.url,
                    },
                }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Reopened issue #${number}`));
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueAssignCommand() {
    return new commander_1.Command('assign')
        .description('Assign or unassign a work item')
        .argument('<number>', 'Issue number')
        .option('--user <username>', 'User to assign (use @me for self, omit to unassign)')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            let issue;
            if (options.user) {
                // Assign using SDK method
                issue = await workManager.assignIssue(parseInt(number, 10), options.user);
            }
            else {
                // Unassign using SDK method
                issue = await workManager.unassignIssue(parseInt(number, 10));
            }
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'success',
                    data: {
                        number: issue.number,
                        assignees: issue.assignees || [],
                        url: issue.url,
                    },
                }, null, 2));
            }
            else {
                if (options.user) {
                    console.log(chalk_1.default.green(`✓ Assigned issue #${number} to ${options.user}`));
                }
                else {
                    console.log(chalk_1.default.green(`✓ Unassigned issue #${number}`));
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function createIssueClassifyCommand() {
    return new commander_1.Command('classify')
        .description('Classify work item type (feature, bug, chore, patch)')
        .argument('<number>', 'Issue number')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const workManager = await (0, sdk_1.getWorkManager)();
            const issue = await workManager.fetchIssue(parseInt(number, 10));
            // Classify based on labels, title keywords, and other signals
            const result = classifyWorkType(issue);
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'success',
                    data: {
                        number: parseInt(number, 10),
                        work_type: result.work_type,
                        confidence: result.confidence,
                        signals: result.signals,
                    },
                }, null, 2));
            }
            else {
                // Always return best guess - never return "unknown"
                console.log(result.work_type);
                // Show confidence warnings at different thresholds
                if (result.confidence < 0.5) {
                    console.log(chalk_1.default.red(`⚠ LOW CONFIDENCE: ${Math.round(result.confidence * 100)}% - review manually`));
                }
                else if (result.confidence < 0.8) {
                    console.log(chalk_1.default.yellow(`(confidence: ${Math.round(result.confidence * 100)}%)`));
                }
            }
        }
        catch (error) {
            handleWorkError(error, options);
        }
    });
}
function classifyWorkType(issue) {
    const title = (issue.title || '').toLowerCase();
    const labels = (issue.labels || []).map((l) => typeof l === 'string' ? l.toLowerCase() : l.name.toLowerCase());
    const signals = {
        labels: labels,
        title_keywords: [],
        has_bug_markers: false,
    };
    // Label-based classification (highest priority)
    const labelScores = {
        'bug': { type: 'bug', score: 0.95 },
        'defect': { type: 'bug', score: 0.95 },
        'regression': { type: 'bug', score: 0.9 },
        'enhancement': { type: 'feature', score: 0.9 },
        'feature': { type: 'feature', score: 0.95 },
        'new feature': { type: 'feature', score: 0.95 },
        'chore': { type: 'chore', score: 0.9 },
        'maintenance': { type: 'chore', score: 0.85 },
        'dependencies': { type: 'chore', score: 0.8 },
        'hotfix': { type: 'patch', score: 0.95 },
        'urgent': { type: 'patch', score: 0.7 },
        'security': { type: 'patch', score: 0.85 },
        'critical': { type: 'patch', score: 0.8 },
    };
    // Check labels first
    for (const label of labels) {
        if (labelScores[label]) {
            return {
                work_type: labelScores[label].type,
                confidence: labelScores[label].score,
                signals,
            };
        }
    }
    // Title keyword analysis
    const bugKeywords = ['fix', 'bug', 'error', 'crash', 'broken', 'issue', 'problem'];
    const featureKeywords = ['add', 'implement', 'new', 'create', 'feature', 'support'];
    const choreKeywords = ['update', 'upgrade', 'refactor', 'clean', 'remove', 'deprecate', 'migrate'];
    const patchKeywords = ['hotfix', 'urgent', 'critical', 'security'];
    let workType = 'feature';
    let confidence = 0.5;
    // Check for bug markers
    for (const keyword of bugKeywords) {
        if (title.includes(keyword)) {
            signals.title_keywords.push(keyword);
            signals.has_bug_markers = true;
            workType = 'bug';
            confidence = 0.7;
            break;
        }
    }
    // Check for patch markers (higher priority than bug)
    for (const keyword of patchKeywords) {
        if (title.includes(keyword)) {
            signals.title_keywords.push(keyword);
            workType = 'patch';
            confidence = 0.75;
            break;
        }
    }
    // Check for feature markers
    if (workType !== 'patch') {
        for (const keyword of featureKeywords) {
            if (title.includes(keyword)) {
                signals.title_keywords.push(keyword);
                if (!signals.has_bug_markers) {
                    workType = 'feature';
                    confidence = 0.7;
                }
                break;
            }
        }
    }
    // Check for chore markers
    for (const keyword of choreKeywords) {
        if (title.includes(keyword)) {
            signals.title_keywords.push(keyword);
            if (!signals.has_bug_markers && workType !== 'patch') {
                workType = 'chore';
                confidence = 0.65;
            }
            break;
        }
    }
    return {
        work_type: workType,
        confidence,
        signals,
    };
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
function createInitCommand() {
    return new commander_1.Command('init')
        .description('Initialize work tracking configuration')
        .option('--platform <name>', 'Platform: github, jira, linear (auto-detect if not specified)')
        .option('--token <value>', 'API token (or use env var)')
        .option('--project <key>', 'Project key for Jira/Linear')
        .option('--yes', 'Accept defaults without prompting')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            // Standalone initialization - no WorkManager dependency
            const platform = options.platform || await detectPlatformFromGit();
            const config = await buildWorkConfig(platform, options);
            const configPath = await writeWorkConfig(config);
            if (options.json) {
                console.log(JSON.stringify({
                    status: 'success',
                    data: {
                        platform: config.work.platform,
                        config_path: configPath,
                        repository: config.work.repository
                            ? `${config.work.repository.owner}/${config.work.repository.name}`
                            : config.work.project,
                    },
                }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Work tracking initialized`));
                console.log(chalk_1.default.gray(`Platform: ${config.work.platform}`));
                console.log(chalk_1.default.gray(`Config: ${configPath}`));
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
 * Detect platform from git remote URL
 */
async function detectPlatformFromGit() {
    try {
        const gitConfigPath = path_1.default.join(process.cwd(), '.git', 'config');
        const gitConfig = await fs_1.promises.readFile(gitConfigPath, 'utf-8');
        // Parse remote URL from git config
        const remoteMatch = gitConfig.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
        if (!remoteMatch) {
            throw new Error('No origin remote found');
        }
        const remoteUrl = remoteMatch[1].trim();
        // Detect platform from hostname
        if (remoteUrl.includes('github.com')) {
            return 'github';
        }
        else if (remoteUrl.includes('gitlab.com')) {
            return 'gitlab';
        }
        else if (remoteUrl.includes('bitbucket.org')) {
            return 'bitbucket';
        }
        else if (remoteUrl.includes('atlassian.net')) {
            return 'jira';
        }
        // Default to github
        return 'github';
    }
    catch {
        // Default to github if detection fails
        return 'github';
    }
}
/**
 * Parse git remote URL to extract owner and repo
 */
function parseGitRemote(url) {
    // SSH format: git@github.com:owner/repo.git
    const sshMatch = url.match(/@[^:]+:([^/]+)\/([^.]+)/);
    if (sshMatch) {
        return { owner: sshMatch[1], name: sshMatch[2] };
    }
    // HTTPS format: https://github.com/owner/repo.git
    const httpsMatch = url.match(/https?:\/\/[^/]+\/([^/]+)\/([^/.]+)/);
    if (httpsMatch) {
        return { owner: httpsMatch[1], name: httpsMatch[2] };
    }
    return null;
}
/**
 * Build work configuration
 */
async function buildWorkConfig(platform, options) {
    const config = {
        work: {
            platform,
        },
    };
    if (platform === 'github' || platform === 'gitlab' || platform === 'bitbucket') {
        // Try to get repository info from git remote
        try {
            const gitConfigPath = path_1.default.join(process.cwd(), '.git', 'config');
            const gitConfig = await fs_1.promises.readFile(gitConfigPath, 'utf-8');
            const remoteMatch = gitConfig.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);
            if (remoteMatch) {
                const repoInfo = parseGitRemote(remoteMatch[1].trim());
                if (repoInfo) {
                    config.work.repository = repoInfo;
                }
            }
        }
        catch {
            // Ignore errors, repository info is optional
        }
    }
    else if (platform === 'jira' || platform === 'linear') {
        if (options.project) {
            config.work.project = options.project;
        }
    }
    return config;
}
/**
 * Write work configuration to file
 */
async function writeWorkConfig(config) {
    const configDir = path_1.default.join(process.cwd(), '.fractary', 'faber');
    const configPath = path_1.default.join(configDir, 'config.json');
    // Ensure directory exists
    await fs_1.promises.mkdir(configDir, { recursive: true });
    // Read existing config if present
    let existingConfig = {};
    try {
        const existing = await fs_1.promises.readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(existing);
    }
    catch {
        // No existing config, that's fine
    }
    // Merge with existing config
    const mergedConfig = {
        ...existingConfig,
        ...config,
    };
    // Write config
    await fs_1.promises.writeFile(configPath, JSON.stringify(mergedConfig, null, 2) + '\n');
    return configPath;
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