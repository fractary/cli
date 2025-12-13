---
spec_id: WORK-00003-implement-missing-work-commands
issue_number: 3
issue_url: https://github.com/fractary/cli/issues/3
title: Implement Missing Work Commands
type: feature
status: draft
created: 2025-12-13
author: Claude (with human direction)
validated: false
requirements_spec: WORK-00356-1-missing-cli-work-commands
changelog:
  - date: 2025-12-13
    round: 1
    changes:
      - "Clarified init command should be standalone (no WorkManager dependency)"
      - "Specified assign command replaces all existing assignees"
      - "Defined low confidence behavior for classify command"
      - "Kept SDK fallback strategy abstract (defer to implementation)"
---

# Implementation Plan: Missing Work Commands

**Issue**: [#3](https://github.com/fractary/cli/issues/3)
**Requirements Spec**: [WORK-00356-1-missing-cli-work-commands](./WORK-00356-1-missing-cli-work-commands.md)
**Type**: Feature (CLI Enhancement)
**Status**: Draft
**Created**: 2025-12-13

## Summary

This implementation plan details how to add 4 missing CLI commands to the `fractary work` module to complete the plugin-to-CLI migration:

1. `fractary work issue assign` - High Priority
2. `fractary work issue reopen` - High Priority
3. `fractary work init` - Medium Priority
4. `fractary work issue classify` - Medium Priority

## Current Architecture

### File Structure
```
src/tools/faber/commands/work/
└── index.ts              # Contains all work command implementations
```

### Pattern Analysis
The existing work commands follow a consistent pattern:
- Use `commander` for CLI argument parsing
- Call `getWorkManager()` from `../../../../sdk` for SDK access
- Support `--json` flag for JSON output
- Use `handleWorkError()` for error handling
- Output human-readable messages by default, JSON when requested

### SDK Interface
The commands depend on `@fractary/faber` SDK's `WorkManager` which provides:
- `fetchIssue(number)` - Fetch issue details
- `createIssue(data)` - Create new issue
- `updateIssue(number, data)` - Update issue
- `closeIssue(number)` - Close issue (sets state to closed)
- `searchIssues(query, filters)` - Search issues
- `createComment(number, body)` - Add comment
- `listComments(number, options)` - List comments
- `addLabels(number, labels)` - Add labels
- `removeLabels(number, labels)` - Remove labels
- `listLabels(number?)` - List labels

## Implementation Plan

### Phase 1: Issue Assign Command (High Priority)

**File**: `src/tools/faber/commands/work/index.ts`

**Changes**:
1. Add `createIssueAssignCommand()` function
2. Register with `issue.addCommand(createIssueAssignCommand())`

**Implementation**:
```typescript
function createIssueAssignCommand(): Command {
  return new Command('assign')
    .description('Assign or unassign a work item')
    .argument('<number>', 'Issue number')
    .option('--user <username>', 'User to assign (use @me for self, omit to unassign)')
    .option('--json', 'Output as JSON')
    .action(async (number: string, options) => {
      try {
        const workManager = await getWorkManager();
        const issue = await workManager.assignIssue(parseInt(number, 10), options.user);

        if (options.json) {
          console.log(JSON.stringify({
            status: 'success',
            data: {
              number: issue.number,
              assignees: issue.assignees,
              url: issue.url
            }
          }, null, 2));
        } else {
          if (options.user) {
            console.log(chalk.green(`✓ Assigned issue #${number} to ${options.user}`));
          } else {
            console.log(chalk.green(`✓ Unassigned issue #${number}`));
          }
        }
      } catch (error) {
        handleWorkError(error, options);
      }
    });
}
```

**SDK Requirement**: `workManager.assignIssue(number: number, user?: string): Promise<Issue>`

**Behavior Note**: When assigning a user, **all existing assignees are replaced** with the new assignee. This matches the behavior of other CLI tools and provides predictable, atomic assignment operations. To add multiple assignees, run the command multiple times or use the SDK directly.

**Platform Mapping**:
| Platform | API Call |
|----------|----------|
| GitHub | `PATCH /repos/{owner}/{repo}/issues/{number}` with `assignees` (replaces all) |
| Jira | `PUT /rest/api/3/issue/{issueIdOrKey}/assignee` (single assignee) |
| Linear | `issueUpdate` mutation with `assigneeId` (single assignee) |

---

### Phase 2: Issue Reopen Command (High Priority)

**File**: `src/tools/faber/commands/work/index.ts`

**Changes**:
1. Add `createIssueReopenCommand()` function
2. Register with `issue.addCommand(createIssueReopenCommand())`

**Implementation**:
```typescript
function createIssueReopenCommand(): Command {
  return new Command('reopen')
    .description('Reopen a closed work item')
    .argument('<number>', 'Issue number')
    .option('--comment <text>', 'Add comment when reopening')
    .option('--json', 'Output as JSON')
    .action(async (number: string, options) => {
      try {
        const workManager = await getWorkManager();

        // Add comment if provided
        if (options.comment) {
          await workManager.createComment(parseInt(number, 10), options.comment);
        }

        const issue = await workManager.reopenIssue(parseInt(number, 10));

        if (options.json) {
          console.log(JSON.stringify({
            status: 'success',
            data: {
              number: issue.number,
              state: issue.state,
              url: issue.url
            }
          }, null, 2));
        } else {
          console.log(chalk.green(`✓ Reopened issue #${number}`));
        }
      } catch (error) {
        handleWorkError(error, options);
      }
    });
}
```

**SDK Requirement**: `workManager.reopenIssue(number: number): Promise<Issue>`

**Alternative**: Could reuse `updateIssue` with `state: 'open'` if SDK doesn't have dedicated method:
```typescript
const issue = await workManager.updateIssue(parseInt(number, 10), { state: 'open' });
```

---

### Phase 3: Init Command (Medium Priority)

**File**: `src/tools/faber/commands/work/index.ts`

**Changes**:
1. Add `createInitCommand()` function
2. Register at work command level: `work.addCommand(createInitCommand())`

**Design Decision**: The `init` command is implemented as a **standalone operation** that does NOT depend on WorkManager. This is because:
- WorkManager requires configuration to exist first (chicken-and-egg problem)
- Init creates the configuration that WorkManager needs
- Direct file operations are simpler and more reliable for bootstrapping

**Implementation**:
```typescript
import { promises as fs } from 'fs';
import path from 'path';

function createInitCommand(): Command {
  return new Command('init')
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
            }
          }, null, 2));
        } else {
          console.log(chalk.green(`✓ Work tracking initialized`));
          console.log(chalk.gray(`Platform: ${config.work.platform}`));
          console.log(chalk.gray(`Config: ${configPath}`));
        }
      } catch (error) {
        handleWorkError(error, options);
      }
    });
}

// Helper functions (to be implemented in CLI, not SDK)
async function detectPlatformFromGit(): Promise<string> {
  // Parse .git/config for remote URL
  // Detect platform from hostname (github.com, gitlab.com, bitbucket.org)
  // Return 'github' | 'jira' | 'linear' | throw error
}

async function buildWorkConfig(platform: string, options: any): Promise<WorkConfig> {
  // Build configuration object based on platform and options
}

async function writeWorkConfig(config: WorkConfig): Promise<string> {
  // Write to .fractary/faber/config.json
  // Return config path
}
```

**Note**: Unlike other commands, `init` does NOT use `getWorkManager()`. It performs direct file operations to create the configuration that WorkManager will later read.

**Configuration Output** (`.fractary/faber/config.json`):
```json
{
  "work": {
    "platform": "github",
    "repository": {
      "owner": "fractary",
      "name": "cli"
    }
  }
}
```

**Auto-detection Logic**:
1. Parse `.git/config` for remote URL
2. Detect platform from hostname (github.com, gitlab.com, bitbucket.org)
3. Extract owner/repo from URL
4. If unable to detect, prompt interactively (unless `--yes`)

---

### Phase 4: Issue Classify Command (Medium Priority)

**File**: `src/tools/faber/commands/work/index.ts`

**Changes**:
1. Add `createIssueClassifyCommand()` function
2. Register with `issue.addCommand(createIssueClassifyCommand())`

**Implementation**:
```typescript
function createIssueClassifyCommand(): Command {
  return new Command('classify')
    .description('Classify work item type (feature, bug, chore, patch)')
    .argument('<number>', 'Issue number')
    .option('--json', 'Output as JSON')
    .action(async (number: string, options) => {
      try {
        const workManager = await getWorkManager();
        const result = await workManager.classifyIssue(parseInt(number, 10));

        if (options.json) {
          console.log(JSON.stringify({
            status: 'success',
            data: {
              number: parseInt(number, 10),
              work_type: result.work_type,
              confidence: result.confidence,
              signals: result.signals
            }
          }, null, 2));
        } else {
          // Always return best guess - never return "unknown"
          console.log(result.work_type);

          // Show confidence warnings at different thresholds
          if (result.confidence < 0.5) {
            console.log(chalk.red(`⚠ LOW CONFIDENCE: ${Math.round(result.confidence * 100)}% - review manually`));
          } else if (result.confidence < 0.8) {
            console.log(chalk.yellow(`(confidence: ${Math.round(result.confidence * 100)}%)`));
          }
        }
      } catch (error) {
        handleWorkError(error, options);
      }
    });
}
```

**SDK Requirement**: `workManager.classifyIssue(number: number): Promise<ClassifyResult>`

**Classification Logic** (in SDK):
```typescript
interface ClassifyResult {
  work_type: 'feature' | 'bug' | 'chore' | 'patch';
  confidence: number;
  signals: {
    labels: string[];
    title_keywords: string[];
    has_bug_markers: boolean;
  };
}

// Priority order:
// 1. Labels (highest): bug, enhancement, chore, hotfix, etc.
// 2. Title keywords: fix, add, implement, update, etc.
// 3. Issue type (Jira/Linear): Story, Bug, Task
```

---

## SDK Dependencies

The following methods need to exist or be added to `@fractary/faber` WorkManager:

| Method | Status | Notes |
|--------|--------|-------|
| `assignIssue(number, user?)` | **Required** | May need SDK addition |
| `reopenIssue(number)` | **Optional** | Can use `updateIssue(number, {state: 'open'})` |
| `init(options)` | **N/A** | Standalone implementation (no SDK dependency) |
| `classifyIssue(number)` | **Required** | May need SDK addition |

### Verification Steps

Before implementation, verify SDK methods exist:
```bash
# Check SDK exports
grep -r "assignIssue\|reopenIssue\|classifyIssue" node_modules/@fractary/faber/
```

**Fallback Strategy**: If SDK methods don't exist, the implementer should choose the appropriate approach:
1. Add methods to SDK first (preferred for long-term maintainability)
2. Implement logic in CLI (acceptable for rapid iteration)
3. Use existing methods creatively (e.g., `updateIssue` for reopen)

The specific fallback implementation is left to the implementer's judgment based on timeline and SDK availability.

---

## Testing Strategy

### Unit Tests

Each command needs tests for:
1. Argument parsing (valid and invalid inputs)
2. Option handling (--json, --user, etc.)
3. Error cases (SDK errors, network errors)

**Test file**: `test/commands/work.test.ts`

```typescript
describe('work issue assign', () => {
  it('assigns issue to user', async () => {
    // Mock workManager.assignIssue
    // Execute command
    // Verify output
  });

  it('unassigns issue when no user provided', async () => {
    // ...
  });

  it('outputs JSON when --json flag provided', async () => {
    // ...
  });
});
```

### Integration Tests

Test against mock API responses:
```typescript
describe('work commands integration', () => {
  it('issue assign -> fetch shows new assignee', async () => {
    // Assign
    // Fetch
    // Verify assignee
  });
});
```

### E2E Tests

Test against real GitHub (test repository):
```bash
# Setup
export GITHUB_TOKEN=...
export TEST_REPO=fractary/cli-test

# Run
npm run test:e2e -- --grep "work commands"
```

---

## Implementation Order

```
1. [High] issue assign    -> Depends on: SDK assignIssue method
2. [High] issue reopen    -> Can use existing updateIssue
3. [Med]  init            -> Depends on: SDK init method
4. [Med]  issue classify  -> Depends on: SDK classifyIssue method
```

### Suggested Order with SDK Work

If SDK methods don't exist:

**Sprint 1**: Implement with CLI-side logic
- `issue reopen` - Use existing `updateIssue`
- `issue assign` - Implement via direct API call (temporary)

**Sprint 2**: SDK integration
- Add `assignIssue`, `init`, `classifyIssue` to SDK
- Refactor CLI to use SDK methods

**Sprint 3**: Testing & Polish
- Add comprehensive tests
- Update documentation
- Handle edge cases

---

## Acceptance Criteria

From issue #3:

- [ ] `fractary work issue assign` implemented with `--user` and `--json` options
- [ ] `fractary work issue reopen` implemented with `--comment` and `--json` options
- [ ] `fractary work init` implemented with platform auto-detection
- [ ] `fractary work issue classify` implemented with confidence scoring
- [ ] All commands have unit tests
- [ ] All commands have integration tests
- [ ] Documentation updated

---

## Related Documents

- **Requirements Spec**: [WORK-00356-1-missing-cli-work-commands.md](./WORK-00356-1-missing-cli-work-commands.md)
- **Parent Issue** (claude-plugins): [fractary/claude-plugins#356](https://github.com/fractary/claude-plugins/issues/356)
- **SDK**: `@fractary/faber` WorkManager
- **Existing Implementation**: `src/tools/faber/commands/work/index.ts`
