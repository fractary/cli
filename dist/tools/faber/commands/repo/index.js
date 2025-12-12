"use strict";
/**
 * Repo subcommand - Repository operations
 *
 * Provides branch, commit, pr, tag, and worktree operations via @fractary/faber RepoManager.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRepoCommand = createRepoCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sdk_1 = require("../../../../sdk");
/**
 * Create the repo command tree
 */
function createRepoCommand() {
    const repo = new commander_1.Command('repo')
        .description('Repository operations');
    // Branch operations
    const branch = new commander_1.Command('branch')
        .description('Branch operations');
    branch.addCommand(createBranchCreateCommand());
    branch.addCommand(createBranchDeleteCommand());
    branch.addCommand(createBranchListCommand());
    // Commit operations
    repo.addCommand(createCommitCommand());
    // Pull request operations
    const pr = new commander_1.Command('pr')
        .description('Pull request operations');
    pr.addCommand(createPRCreateCommand());
    pr.addCommand(createPRListCommand());
    pr.addCommand(createPRMergeCommand());
    pr.addCommand(createPRReviewCommand());
    // Tag operations
    const tag = new commander_1.Command('tag')
        .description('Tag operations');
    tag.addCommand(createTagCreateCommand());
    tag.addCommand(createTagPushCommand());
    tag.addCommand(createTagListCommand());
    // Worktree operations
    const worktree = new commander_1.Command('worktree')
        .description('Worktree operations');
    worktree.addCommand(createWorktreeCreateCommand());
    worktree.addCommand(createWorktreeListCommand());
    worktree.addCommand(createWorktreeRemoveCommand());
    worktree.addCommand(createWorktreeCleanupCommand());
    // Push/Pull operations
    repo.addCommand(createPushCommand());
    repo.addCommand(createPullCommand());
    repo.addCommand(createStatusCommand());
    repo.addCommand(branch);
    repo.addCommand(pr);
    repo.addCommand(tag);
    repo.addCommand(worktree);
    return repo;
}
// Branch Commands
function createBranchCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a new branch')
        .argument('<name>', 'Branch name')
        .option('--base <branch>', 'Base branch')
        .option('--checkout', 'Checkout after creation')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const branch = await repoManager.createBranch(name, {
                baseBranch: options.base,
                checkout: options.checkout,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: branch }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created branch: ${branch.name}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createBranchDeleteCommand() {
    return new commander_1.Command('delete')
        .description('Delete a branch')
        .argument('<name>', 'Branch name')
        .option('--location <where>', 'Delete location: local|remote|both', 'local')
        .option('--force', 'Force delete even if not merged')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            await repoManager.deleteBranch(name, {
                location: options.location,
                force: options.force,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { deleted: name } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Deleted branch: ${name}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createBranchListCommand() {
    return new commander_1.Command('list')
        .description('List branches')
        .option('--merged', 'Show only merged branches')
        .option('--stale', 'Show stale branches')
        .option('--pattern <glob>', 'Filter by pattern')
        .option('--limit <n>', 'Limit results')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const branches = await repoManager.listBranches({
                merged: options.merged,
                stale: options.stale,
                pattern: options.pattern,
                limit: options.limit ? parseInt(options.limit, 10) : undefined,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: branches }, null, 2));
            }
            else {
                if (branches.length === 0) {
                    console.log(chalk_1.default.yellow('No branches found'));
                }
                else {
                    branches.forEach((branch) => {
                        const prefix = branch.isDefault ? chalk_1.default.green('* ') : '  ';
                        const protection = branch.isProtected ? chalk_1.default.yellow(' [protected]') : '';
                        console.log(`${prefix}${branch.name}${protection}`);
                    });
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// Commit Command
function createCommitCommand() {
    return new commander_1.Command('commit')
        .description('Create a commit')
        .requiredOption('--message <msg>', 'Commit message')
        .option('--type <type>', 'Commit type (feat, fix, chore, etc.)', 'feat')
        .option('--scope <scope>', 'Commit scope')
        .option('--work-id <id>', 'Associated work item ID')
        .option('--breaking', 'Mark as breaking change')
        .option('--all', 'Stage all changes before committing')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            // Stage all changes if requested
            if (options.all) {
                repoManager.stageAll();
            }
            const commit = repoManager.commit({
                message: options.message,
                type: options.type,
                scope: options.scope,
                workId: options.workId,
                breaking: options.breaking,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: commit }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created commit: ${commit.sha.slice(0, 7)}`));
                console.log(chalk_1.default.gray(`  ${commit.message}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// PR Commands
function createPRCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a pull request')
        .requiredOption('--title <title>', 'PR title')
        .option('--body <text>', 'PR body')
        .option('--base <branch>', 'Base branch', 'main')
        .option('--head <branch>', 'Head branch (current by default)')
        .option('--draft', 'Create as draft')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const pr = await repoManager.createPR({
                title: options.title,
                body: options.body,
                base: options.base,
                head: options.head,
                draft: options.draft,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: pr }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created PR #${pr.number}: ${pr.title}`));
                console.log(chalk_1.default.gray(`  ${pr.url}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createPRListCommand() {
    return new commander_1.Command('list')
        .description('List pull requests')
        .option('--state <state>', 'Filter by state (open, closed, all)', 'open')
        .option('--author <user>', 'Filter by author')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const prs = await repoManager.listPRs({
                state: options.state,
                author: options.author,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: prs }, null, 2));
            }
            else {
                if (prs.length === 0) {
                    console.log(chalk_1.default.yellow('No pull requests found'));
                }
                else {
                    prs.forEach((pr) => {
                        console.log(`#${pr.number} ${pr.title} [${pr.state}]`);
                    });
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createPRMergeCommand() {
    return new commander_1.Command('merge')
        .description('Merge a pull request')
        .argument('<number>', 'PR number')
        .option('--strategy <strategy>', 'Merge strategy (merge, squash, rebase)', 'squash')
        .option('--delete-branch', 'Delete branch after merge')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const pr = await repoManager.mergePR(parseInt(number, 10), {
                strategy: options.strategy,
                deleteBranch: options.deleteBranch,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: pr }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Merged PR #${number}`));
                if (options.deleteBranch) {
                    console.log(chalk_1.default.gray('  Branch deleted'));
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createPRReviewCommand() {
    return new commander_1.Command('review')
        .description('Review a pull request')
        .argument('<number>', 'PR number')
        .option('--approve', 'Approve the PR')
        .option('--request-changes', 'Request changes')
        .option('--comment <text>', 'Review comment')
        .option('--json', 'Output as JSON')
        .action(async (number, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const action = options.approve ? 'approve' :
                options.requestChanges ? 'request_changes' : 'comment';
            await repoManager.reviewPR(parseInt(number, 10), {
                action,
                comment: options.comment,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { reviewed: number } }, null, 2));
            }
            else {
                const action = options.approve ? 'Approved' : options.requestChanges ? 'Requested changes on' : 'Commented on';
                console.log(chalk_1.default.green(`✓ ${action} PR #${number}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// Tag Commands
function createTagCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a tag')
        .argument('<name>', 'Tag name')
        .option('--message <text>', 'Tag message')
        .option('--sign', 'Sign the tag')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            repoManager.createTag(name, {
                name,
                message: options.message,
                sign: options.sign,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { name } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created tag: ${name}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createTagPushCommand() {
    return new commander_1.Command('push')
        .description('Push tag(s) to remote')
        .argument('<name>', 'Tag name or "all"')
        .option('--remote <name>', 'Remote name', 'origin')
        .option('--json', 'Output as JSON')
        .action(async (name, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            repoManager.pushTag(name, options.remote);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { pushed: name } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Pushed tag: ${name}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createTagListCommand() {
    return new commander_1.Command('list')
        .description('List tags')
        .option('--pattern <glob>', 'Filter by pattern')
        .option('--latest <n>', 'Show only latest N tags')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const tags = repoManager.listTags({
                pattern: options.pattern,
                latest: options.latest ? parseInt(options.latest, 10) : undefined,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: tags }, null, 2));
            }
            else {
                if (tags.length === 0) {
                    console.log(chalk_1.default.yellow('No tags found'));
                }
                else {
                    tags.forEach((tag) => {
                        console.log(tag.name);
                    });
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// Worktree Commands
function createWorktreeCreateCommand() {
    return new commander_1.Command('create')
        .description('Create a worktree')
        .argument('<branch>', 'Branch name')
        .option('--path <path>', 'Worktree path')
        .option('--work-id <id>', 'Associated work item ID')
        .option('--json', 'Output as JSON')
        .action(async (branch, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const worktree = repoManager.createWorktree({
                branch,
                path: options.path,
                workId: options.workId,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: worktree }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Created worktree: ${worktree.path}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createWorktreeListCommand() {
    return new commander_1.Command('list')
        .description('List worktrees')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const worktrees = repoManager.listWorktrees();
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: worktrees }, null, 2));
            }
            else {
                if (worktrees.length === 0) {
                    console.log(chalk_1.default.yellow('No worktrees found'));
                }
                else {
                    worktrees.forEach((wt) => {
                        console.log(`${wt.branch} → ${wt.path}`);
                    });
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createWorktreeRemoveCommand() {
    return new commander_1.Command('remove')
        .description('Remove a worktree')
        .argument('<path>', 'Worktree path')
        .option('--force', 'Force removal')
        .option('--json', 'Output as JSON')
        .action(async (path, options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            repoManager.removeWorktree(path, options.force);
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { removed: path } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green(`✓ Removed worktree: ${path}`));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createWorktreeCleanupCommand() {
    return new commander_1.Command('cleanup')
        .description('Clean up worktrees')
        .option('--merged', 'Clean merged worktrees')
        .option('--stale', 'Clean stale worktrees')
        .option('--dry-run', 'Show what would be cleaned')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const result = await repoManager.cleanupWorktrees({
                merged: options.merged,
                stale: options.stale,
                dryRun: options.dryRun,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
            }
            else {
                const prefix = options.dryRun ? 'Would clean' : 'Cleaned';
                if (result.removed.length === 0) {
                    console.log(chalk_1.default.yellow('No worktrees to clean'));
                }
                else {
                    result.removed.forEach((wt) => {
                        console.log(chalk_1.default.green(`✓ ${prefix}: ${wt}`));
                    });
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// Push/Pull Commands
function createPushCommand() {
    return new commander_1.Command('push')
        .description('Push to remote')
        .option('--remote <name>', 'Remote name', 'origin')
        .option('--set-upstream', 'Set upstream tracking')
        .option('--force', 'Force push (use with caution)')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            repoManager.push({
                remote: options.remote,
                setUpstream: options.setUpstream,
                force: options.force,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { pushed: true } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green('✓ Pushed to remote'));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createPullCommand() {
    return new commander_1.Command('pull')
        .description('Pull from remote')
        .option('--rebase', 'Use rebase instead of merge')
        .option('--remote <name>', 'Remote name', 'origin')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            repoManager.pull({
                rebase: options.rebase,
                remote: options.remote,
            });
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { pulled: true } }, null, 2));
            }
            else {
                console.log(chalk_1.default.green('✓ Pulled from remote'));
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
function createStatusCommand() {
    return new commander_1.Command('status')
        .description('Show repository status')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            const repoManager = await (0, sdk_1.getRepoManager)();
            const status = repoManager.getStatus();
            const branch = repoManager.getCurrentBranch();
            if (options.json) {
                console.log(JSON.stringify({ status: 'success', data: { branch, ...status } }, null, 2));
            }
            else {
                const isClean = status.staged.length === 0 &&
                    status.modified.length === 0 &&
                    status.untracked.length === 0 &&
                    status.conflicts.length === 0;
                console.log(chalk_1.default.bold(`Branch: ${branch}`));
                console.log(`Clean: ${isClean ? chalk_1.default.green('yes') : chalk_1.default.yellow('no')}`);
                if (status.ahead > 0) {
                    console.log(chalk_1.default.cyan(`Ahead: ${status.ahead} commit(s)`));
                }
                if (status.behind > 0) {
                    console.log(chalk_1.default.yellow(`Behind: ${status.behind} commit(s)`));
                }
                if (status.staged.length > 0) {
                    console.log(chalk_1.default.green(`Staged: ${status.staged.length} file(s)`));
                }
                if (status.modified.length > 0) {
                    console.log(chalk_1.default.yellow(`Modified: ${status.modified.length} file(s)`));
                }
                if (status.untracked.length > 0) {
                    console.log(chalk_1.default.gray(`Untracked: ${status.untracked.length} file(s)`));
                }
                if (status.conflicts.length > 0) {
                    console.log(chalk_1.default.red(`Conflicts: ${status.conflicts.length} file(s)`));
                }
            }
        }
        catch (error) {
            handleRepoError(error, options);
        }
    });
}
// Error handling
function handleRepoError(error, options) {
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
            error: { code: 'REPO_ERROR', message },
        }));
    }
    else {
        console.error(chalk_1.default.red('Error:'), message);
    }
    process.exit(1);
}
//# sourceMappingURL=index.js.map