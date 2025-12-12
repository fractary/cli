/**
 * Repo subcommand - Repository operations
 *
 * Provides branch, commit, pr, tag, and worktree operations via RepoManager SDK.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getRepoManager, SDKNotAvailableError } from '../../../../sdk';

/**
 * Create the repo command tree
 */
export function createRepoCommand(): Command {
  const repo = new Command('repo')
    .description('Repository operations');

  // Branch operations
  const branch = new Command('branch')
    .description('Branch operations');

  branch.addCommand(createBranchCreateCommand());
  branch.addCommand(createBranchDeleteCommand());
  branch.addCommand(createBranchListCommand());

  // Commit operations
  const commit = new Command('commit')
    .description('Commit operations');

  commit.addCommand(createCommitCreateCommand());
  commit.addCommand(createCommitAndPushCommand());

  // Pull request operations
  const pr = new Command('pr')
    .description('Pull request operations');

  pr.addCommand(createPRCreateCommand());
  pr.addCommand(createPRReviewCommand());
  pr.addCommand(createPRMergeCommand());
  pr.addCommand(createPRListCommand());

  // Tag operations
  const tag = new Command('tag')
    .description('Tag operations');

  tag.addCommand(createTagCreateCommand());
  tag.addCommand(createTagPushCommand());
  tag.addCommand(createTagListCommand());

  // Worktree operations
  const worktree = new Command('worktree')
    .description('Worktree operations');

  worktree.addCommand(createWorktreeCreateCommand());
  worktree.addCommand(createWorktreeListCommand());
  worktree.addCommand(createWorktreeRemoveCommand());
  worktree.addCommand(createWorktreeCleanupCommand());

  // Push/Pull operations
  repo.addCommand(createPushCommand());
  repo.addCommand(createPullCommand());

  repo.addCommand(branch);
  repo.addCommand(commit);
  repo.addCommand(pr);
  repo.addCommand(tag);
  repo.addCommand(worktree);

  return repo;
}

// Branch Commands

function createBranchCreateCommand(): Command {
  return new Command('create')
    .description('Create a new branch')
    .requiredOption('--description <desc>', 'Branch description for naming')
    .option('--work-id <id>', 'Associated work item ID')
    .option('--base <branch>', 'Base branch', 'main')
    .option('--worktree', 'Also create a worktree')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.createBranch({
          description: options.description,
          workId: options.workId,
          baseBranch: options.base,
          createWorktree: options.worktree,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created branch: ${result.branchName}`));
          if (result.worktreePath) {
            console.log(chalk.gray(`  Worktree: ${result.worktreePath}`));
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createBranchDeleteCommand(): Command {
  return new Command('delete')
    .description('Delete a branch')
    .argument('<name>', 'Branch name')
    .option('--location <where>', 'Where to delete (local, remote, both)', 'local')
    .option('--force', 'Force delete even if not merged')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      try {
        const repoManager = await getRepoManager();
        await repoManager.deleteBranch(name, {
          location: options.location,
          force: options.force,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: { deleted: name } }, null, 2));
        } else {
          console.log(chalk.green(`✓ Deleted branch: ${name}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createBranchListCommand(): Command {
  return new Command('list')
    .description('List branches')
    .option('--stale', 'Show only stale branches')
    .option('--merged', 'Show only merged branches')
    .option('--pattern <glob>', 'Filter by pattern')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const branches = await repoManager.listBranches({
          stale: options.stale,
          merged: options.merged,
          pattern: options.pattern,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: branches }, null, 2));
        } else {
          if (branches.length === 0) {
            console.log(chalk.yellow('No branches found'));
          } else {
            branches.forEach((branch: any) => {
              const current = branch.current ? chalk.green('* ') : '  ';
              console.log(`${current}${branch.name}`);
            });
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// Commit Commands

function createCommitCreateCommand(): Command {
  return new Command('create')
    .description('Create a commit')
    .requiredOption('--message <msg>', 'Commit message')
    .option('--type <type>', 'Commit type (feat, fix, chore, etc.)', 'feat')
    .option('--scope <scope>', 'Commit scope')
    .option('--work-id <id>', 'Associated work item ID')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.createCommit({
          message: options.message,
          type: options.type,
          scope: options.scope,
          workId: options.workId,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created commit: ${result.sha.slice(0, 7)}`));
          console.log(chalk.gray(`  ${result.message}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createCommitAndPushCommand(): Command {
  return new Command('commit-and-push')
    .description('Create a commit and push')
    .requiredOption('--message <msg>', 'Commit message')
    .option('--type <type>', 'Commit type (feat, fix, chore, etc.)', 'feat')
    .option('--set-upstream', 'Set upstream tracking')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.commitAndPush({
          message: options.message,
          type: options.type,
          setUpstream: options.setUpstream,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created and pushed commit: ${result.sha.slice(0, 7)}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// PR Commands

function createPRCreateCommand(): Command {
  return new Command('create')
    .description('Create a pull request')
    .requiredOption('--title <title>', 'PR title')
    .option('--body <text>', 'PR body')
    .option('--base <branch>', 'Base branch', 'main')
    .option('--draft', 'Create as draft')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.createPR({
          title: options.title,
          body: options.body,
          baseBranch: options.base,
          draft: options.draft,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created PR #${result.number}: ${result.title}`));
          console.log(chalk.gray(`  ${result.url}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createPRReviewCommand(): Command {
  return new Command('review')
    .description('Review a pull request')
    .argument('<number>', 'PR number')
    .option('--action <action>', 'Review action (approve, request_changes, comment)', 'approve')
    .option('--comment <text>', 'Review comment')
    .option('--json', 'Output as JSON')
    .action(async (number: string, options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.reviewPR(parseInt(number, 10), {
          action: options.action,
          comment: options.comment,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Submitted review for PR #${number}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createPRMergeCommand(): Command {
  return new Command('merge')
    .description('Merge a pull request')
    .argument('<number>', 'PR number')
    .option('--strategy <strategy>', 'Merge strategy (merge, squash, rebase)', 'squash')
    .option('--delete-branch', 'Delete branch after merge')
    .option('--json', 'Output as JSON')
    .action(async (number: string, options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.mergePR(parseInt(number, 10), {
          strategy: options.strategy,
          deleteBranch: options.deleteBranch,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Merged PR #${number}`));
          if (options.deleteBranch) {
            console.log(chalk.gray('  Branch deleted'));
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createPRListCommand(): Command {
  return new Command('list')
    .description('List pull requests')
    .option('--state <state>', 'Filter by state (open, closed, all)', 'open')
    .option('--author <user>', 'Filter by author')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const prs = await repoManager.listPRs({
          state: options.state,
          author: options.author,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: prs }, null, 2));
        } else {
          if (prs.length === 0) {
            console.log(chalk.yellow('No pull requests found'));
          } else {
            prs.forEach((pr: any) => {
              console.log(`#${pr.number} ${pr.title} [${pr.state}]`);
            });
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// Tag Commands

function createTagCreateCommand(): Command {
  return new Command('create')
    .description('Create a tag')
    .argument('<name>', 'Tag name')
    .option('--message <text>', 'Tag message')
    .option('--sign', 'Sign the tag')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.createTag(name, {
          message: options.message,
          sign: options.sign,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created tag: ${name}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createTagPushCommand(): Command {
  return new Command('push')
    .description('Push tag(s) to remote')
    .argument('<name>', 'Tag name or "all"')
    .option('--remote <name>', 'Remote name', 'origin')
    .option('--json', 'Output as JSON')
    .action(async (name: string, options) => {
      try {
        const repoManager = await getRepoManager();
        await repoManager.pushTag(name, { remote: options.remote });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: { pushed: name } }, null, 2));
        } else {
          console.log(chalk.green(`✓ Pushed tag: ${name}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createTagListCommand(): Command {
  return new Command('list')
    .description('List tags')
    .option('--pattern <glob>', 'Filter by pattern')
    .option('--latest <n>', 'Show only latest N tags')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const tags = await repoManager.listTags({
          pattern: options.pattern,
          latest: options.latest ? parseInt(options.latest, 10) : undefined,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: tags }, null, 2));
        } else {
          if (tags.length === 0) {
            console.log(chalk.yellow('No tags found'));
          } else {
            tags.forEach((tag: any) => {
              console.log(tag.name);
            });
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// Worktree Commands

function createWorktreeCreateCommand(): Command {
  return new Command('create')
    .description('Create a worktree')
    .argument('<branch>', 'Branch name')
    .option('--work-id <id>', 'Associated work item ID')
    .option('--json', 'Output as JSON')
    .action(async (branch: string, options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.createWorktree(branch, {
          workId: options.workId,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green(`✓ Created worktree: ${result.path}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createWorktreeListCommand(): Command {
  return new Command('list')
    .description('List worktrees')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const worktrees = await repoManager.listWorktrees();

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: worktrees }, null, 2));
        } else {
          if (worktrees.length === 0) {
            console.log(chalk.yellow('No worktrees found'));
          } else {
            worktrees.forEach((wt: any) => {
              console.log(`${wt.branch} → ${wt.path}`);
            });
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createWorktreeRemoveCommand(): Command {
  return new Command('remove')
    .description('Remove a worktree')
    .argument('<branch>', 'Branch name')
    .option('--force', 'Force removal')
    .option('--json', 'Output as JSON')
    .action(async (branch: string, options) => {
      try {
        const repoManager = await getRepoManager();
        await repoManager.removeWorktree(branch, { force: options.force });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: { removed: branch } }, null, 2));
        } else {
          console.log(chalk.green(`✓ Removed worktree: ${branch}`));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createWorktreeCleanupCommand(): Command {
  return new Command('cleanup')
    .description('Clean up worktrees')
    .option('--merged', 'Clean merged worktrees')
    .option('--stale', 'Clean stale worktrees')
    .option('--dry-run', 'Show what would be cleaned')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.cleanupWorktrees({
          merged: options.merged,
          stale: options.stale,
          dryRun: options.dryRun,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          if (result.cleaned.length === 0) {
            console.log(chalk.yellow('No worktrees to clean'));
          } else {
            const prefix = options.dryRun ? 'Would clean' : 'Cleaned';
            result.cleaned.forEach((wt: string) => {
              console.log(chalk.green(`✓ ${prefix}: ${wt}`));
            });
          }
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// Push/Pull Commands

function createPushCommand(): Command {
  return new Command('push')
    .description('Push to remote')
    .option('--remote <name>', 'Remote name', 'origin')
    .option('--set-upstream', 'Set upstream tracking')
    .option('--force', 'Force push (use with caution)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.push({
          remote: options.remote,
          setUpstream: options.setUpstream,
          force: options.force,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green('✓ Pushed to remote'));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

function createPullCommand(): Command {
  return new Command('pull')
    .description('Pull from remote')
    .option('--rebase', 'Use rebase instead of merge')
    .option('--strategy <strategy>', 'Pull strategy (merge, rebase, ff-only)', 'merge')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const repoManager = await getRepoManager();
        const result = await repoManager.pull({
          rebase: options.rebase,
          strategy: options.strategy,
        });

        if (options.json) {
          console.log(JSON.stringify({ status: 'success', data: result }, null, 2));
        } else {
          console.log(chalk.green('✓ Pulled from remote'));
        }
      } catch (error) {
        handleRepoError(error, options);
      }
    });
}

// Error handling

function handleRepoError(error: unknown, options: { json?: boolean }): void {
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
      error: { code: 'REPO_ERROR', message },
    }));
  } else {
    console.error(chalk.red('Error:'), message);
  }
  process.exit(1);
}
