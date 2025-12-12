# SDK Integration Guide

This guide explains how external projects (like `fractary/claude-plugins`) can integrate with the Fractary CLI to replace custom implementations with standardized SDK access.

## Overview

The Fractary CLI provides a unified interface to the `@fractary/faber` SDK through:
1. **Factory functions** - Lazy-loaded manager instances
2. **Type re-exports** - All SDK types available from CLI package
3. **CLI commands** - Command-line interface with `--json` output

## Installation

```bash
npm install @fractary/cli
```

The CLI will automatically install `@fractary/faber` as a dependency.

## Integration Options

### Option 1: Programmatic SDK Access (Recommended)

Import factory functions and types directly from `@fractary/cli`:

```typescript
import {
  // Factory functions
  getWorkManager,
  getRepoManager,
  getSpecManager,
  getLogManager,
  getStateManager,
  getWorkflow,

  // Utility functions
  isFaberAvailable,
  clearInstances,

  // Types
  Issue,
  PullRequest,
  Specification,
  WorkflowOptions,
} from '@fractary/cli';
```

### Option 2: CLI Commands with JSON Output

Use CLI commands with `--json` flag for shell integration:

```bash
# Get issues as JSON
fractary faber work issue list --json

# Parse in your script
ISSUES=$(fractary faber work issue list --json)
```

## Factory Functions Reference

### Work Manager

Manages work items (issues, comments, labels, milestones):

```typescript
import { getWorkManager, Issue, Comment, Label, Milestone } from '@fractary/cli';

const work = await getWorkManager();

// Issue operations
const issue = await work.createIssue({
  title: 'Bug fix needed',
  body: 'Description here',
  labels: ['bug', 'priority-high'],
});

const issues = await work.listIssues({ state: 'open' });
const found = await work.getIssue(123);
await work.updateIssue(123, { state: 'closed' });

// Comment operations
const comment = await work.createComment(123, 'Progress update');
const comments = await work.listComments(123);

// Label operations
await work.addLabels(123, ['in-progress']);
await work.removeLabels(123, ['needs-triage']);

// Milestone operations
const milestone = await work.createMilestone({
  title: 'v1.0.0',
  due_on: '2025-01-31',
});
```

### Repo Manager

Manages repository operations (branches, commits, PRs, tags, worktrees):

```typescript
import { getRepoManager, Branch, Commit, PullRequest, Tag } from '@fractary/cli';

const repo = await getRepoManager();

// Branch operations
const branch = await repo.createBranch({
  name: 'feature/new-feature',
  from: 'main',
});
const branches = await repo.listBranches();
await repo.deleteBranch('feature/old-feature');

// Commit operations
const commit = await repo.createCommit({
  message: 'feat: add new feature',
  files: ['src/feature.ts'],
});
const commits = await repo.listCommits({ branch: 'main', limit: 10 });

// Push/Pull operations
await repo.push({ branch: 'feature/new-feature', setUpstream: true });
await repo.pull({ branch: 'main', rebase: true });

// Pull Request operations
const pr = await repo.createPR({
  title: 'Add new feature',
  body: 'Description of changes',
  head: 'feature/new-feature',
  base: 'main',
});
const prs = await repo.listPRs({ state: 'open' });
await repo.mergePR(42, { strategy: 'squash', deleteSourceBranch: true });

// Tag operations
const tag = await repo.createTag({
  name: 'v1.0.0',
  message: 'Release v1.0.0',
});

// Worktree operations
const worktree = await repo.createWorktree({
  branch: 'feature/parallel-work',
  path: '../worktrees/parallel-work',
});
```

### Spec Manager

Manages specification lifecycle:

```typescript
import { getSpecManager, Specification, SpecMetadata } from '@fractary/cli';

const spec = await getSpecManager();

// Create specification
const newSpec = await spec.create({
  id: 'SPEC-0001',
  title: 'Feature Specification',
  content: '# Overview\n...',
});

// List and get
const specs = await spec.list({ status: 'draft' });
const found = await spec.get('SPEC-0001');

// Validate
const result = await spec.validate('SPEC-0001');
if (!result.valid) {
  console.log('Issues:', result.issues);
}

// Refine with AI
const refined = await spec.refine('SPEC-0001', {
  prompt: 'Add error handling section',
});

// Archive
await spec.archive('SPEC-0001');
```

### Log Manager

Manages session logs and capture:

```typescript
import { getLogManager, LogEntry, CaptureSession } from '@fractary/cli';

const logs = await getLogManager();

// Write log entry
await logs.write({
  level: 'info',
  message: 'Operation started',
  context: { operation: 'build' },
});

// List logs
const entries = await logs.list({ limit: 50, since: '2025-01-01' });

// Capture session
const session = await logs.startCapture({
  work_id: 'ISSUE-123',
  description: 'Implementing feature',
});

// During work...
await logs.append(session.id, 'Completed step 1');
await logs.append(session.id, 'Completed step 2');

// End capture
const result = await logs.endCapture(session.id);

// Search logs
const found = await logs.search({ query: 'error', limit: 20 });

// Archive old logs
await logs.archive({ before: '2025-01-01' });
```

### State Manager

Manages workflow state persistence:

```typescript
import { getStateManager, WorkflowState, Checkpoint } from '@fractary/cli';

const state = await getStateManager();

// Get current state
const current = await state.get('ISSUE-123');

// Update state
await state.update('ISSUE-123', {
  current_phase: 'build',
  status: 'in_progress',
});

// Create checkpoint
const checkpoint = await state.createCheckpoint('ISSUE-123');

// Recover from checkpoint
await state.recover('ISSUE-123', { checkpoint: checkpoint.id });

// List checkpoints
const checkpoints = await state.listCheckpoints('ISSUE-123');

// Cleanup old states
await state.cleanup({ olderThan: 30 });
```

### FABER Workflow

Orchestrates the complete FABER workflow:

```typescript
import { getWorkflow, WorkflowOptions, WorkflowResult } from '@fractary/cli';

const workflow = await getWorkflow();

// Run full workflow
const result = await workflow.run({
  work_id: 'ISSUE-123',
  initial_phase: 'frame',
  config: {
    autonomy: 'assisted',  // 'full', 'assisted', 'manual'
    checkpoints: true,
  },
  events: {
    onPhaseStart: (phase) => console.log(`Starting ${phase}`),
    onPhaseComplete: (phase, result) => console.log(`Completed ${phase}`),
    onError: (error) => console.error(error),
  },
});

// Get status
const status = await workflow.status('ISSUE-123');

// Pause/Resume
await workflow.pause('ISSUE-123');
await workflow.resume('ISSUE-123');

// Recover from failure
await workflow.recover('ISSUE-123', { fromCheckpoint: 'latest' });
```

## Configuration

### Automatic Configuration Loading

Factory functions automatically load configuration from `.fractary/faber/config.json`:

```json
{
  "work": {
    "provider": "github",
    "owner": "fractary",
    "repo": "my-project"
  },
  "repo": {
    "provider": "github",
    "owner": "fractary",
    "repo": "my-project"
  },
  "workflow": {
    "autonomy": "assisted",
    "checkpoints": true,
    "state_directory": ".fractary/faber/state"
  }
}
```

### Custom Configuration

Pass configuration to factory functions:

```typescript
const work = await getWorkManager({
  provider: 'linear',
  team_id: 'TEAM-ID',
  api_key: process.env.LINEAR_API_KEY,
});

const repo = await getRepoManager({
  provider: 'gitlab',
  project_id: 12345,
});
```

## Migration from Custom Code

### Before: Custom Implementation

```typescript
// Old approach: Direct API calls or custom wrappers
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function createIssue(title: string, body: string) {
  const { data } = await octokit.issues.create({
    owner: 'fractary',
    repo: 'my-project',
    title,
    body,
  });
  return data;
}

async function createBranch(name: string) {
  // Custom branch creation logic...
}

async function createPR(title: string, branch: string) {
  // Custom PR creation logic...
}
```

### After: CLI SDK Integration

```typescript
// New approach: Use CLI SDK
import { getWorkManager, getRepoManager } from '@fractary/cli';

async function createIssue(title: string, body: string) {
  const work = await getWorkManager();
  return work.createIssue({ title, body });
}

async function createBranch(name: string) {
  const repo = await getRepoManager();
  return repo.createBranch({ name });
}

async function createPR(title: string, branch: string) {
  const repo = await getRepoManager();
  return repo.createPR({ title, head: branch, base: 'main' });
}
```

### Benefits of Migration

1. **Consistent API**: Same interface regardless of underlying platform
2. **Platform Abstraction**: Switch between GitHub/GitLab/Linear without code changes
3. **Configuration Management**: Centralized config in `.fractary/faber/`
4. **Type Safety**: Full TypeScript types from SDK
5. **Error Handling**: Consistent error types across operations
6. **Lazy Loading**: Manager instances created only when needed

## Error Handling

```typescript
import { getWorkManager, SDKNotAvailableError } from '@fractary/cli';

try {
  const work = await getWorkManager();
  const issue = await work.createIssue({ title: 'Test' });
} catch (error) {
  if (error instanceof SDKNotAvailableError) {
    console.error('SDK not installed:', error.sdk);
    console.error('Install with:', `npm install @fractary/${error.sdk}`);
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Testing

### Clear Instances for Tests

```typescript
import { clearInstances, getWorkManager } from '@fractary/cli';

describe('My feature', () => {
  beforeEach(() => {
    clearInstances(); // Reset cached instances
  });

  it('should create issue', async () => {
    const work = await getWorkManager({
      provider: 'mock', // Use mock provider in tests
    });
    // ...
  });
});
```

### Check SDK Availability

```typescript
import { isFaberAvailable } from '@fractary/cli';

if (await isFaberAvailable()) {
  // SDK operations available
} else {
  // Fallback behavior
}
```

## CLI Command Reference

All commands support `--json` output:

```bash
# Work commands
fractary faber work issue create "Title" --body "Body" --json
fractary faber work issue list --state open --json
fractary faber work issue get 123 --json

# Repo commands
fractary faber repo branch create feature/name --json
fractary faber repo commit "message" --json
fractary faber repo pr create "Title" --body "Body" --json
fractary faber repo pr list --state open --json

# Spec commands
fractary faber spec create SPEC-001 --title "Title" --json
fractary faber spec list --json
fractary faber spec validate SPEC-001 --json

# Workflow commands
fractary faber run --work-id ISSUE-123 --json
fractary faber status --json
```

## Version Compatibility

| CLI Version | SDK Version | Breaking Changes |
|-------------|-------------|------------------|
| 0.3.x | ^1.0.1 | N/A (current) |
| 0.2.x | Stubs | Stub-only, no real operations |

## Support

- **Issues**: [GitHub Issues](https://github.com/fractary/cli/issues)
- **Documentation**: [CLI Docs](https://github.com/fractary/cli/tree/main/docs)
- **SDK Docs**: [Faber SDK](https://github.com/fractary/faber)
