# Session Summary: @fractary/faber SDK v1.0.1 Integration

**Date**: December 12, 2025
**Focus**: Complete SDK integration replacing stub implementations with live @fractary/faber SDK v1.0.1
**Commits**: 969df3c, c529146

## Overview

This session completed the integration of the @fractary/faber SDK v1.0.1 into the unified Fractary CLI. Prior to this work, the CLI used stub implementations for SDK managers. This integration connects the CLI directly to the production SDK, enabling real work tracking, repository operations, specification management, log handling, and workflow orchestration.

## Key Changes

### 1. SDK Factory Pattern Implementation

**File**: `src/sdk/factory.ts`

Implemented lazy-loaded SDK manager instances using the factory pattern:

```typescript
// Available managers via factory
getWorkManager()   // WorkManager for issue/label/milestone operations
getRepoManager()   // RepoManager for branch/commit/PR/tag/worktree operations
getSpecManager()   // SpecManager for specification lifecycle
getLogManager()    // LogManager for session capture and archival
getStateManager()  // StateManager for workflow state persistence
getWorkflow()      // FaberWorkflow for orchestration
```

**Key Features**:
- Lazy loading for performance optimization
- Automatic configuration loading from `.fractary/faber/`
- `SDKNotAvailableError` for graceful degradation
- `clearInstances()` for testing
- `isFaberAvailable()` for SDK detection

### 2. Type Re-exports for CLI Consumers

**File**: `src/sdk/index.ts`

Comprehensive type re-exports from `@fractary/faber`:

```typescript
// Work types
Issue, Comment, Label, Milestone, WorkType, FaberContext

// Repo types
Branch, Commit, PullRequest, Tag, Worktree, GitStatus

// Spec types
Specification, SpecMetadata, SpecValidateResult, SpecRefineResult

// Log types
LogEntry, LogStatus, CaptureSession, CaptureResult

// State types
WorkflowState, PhaseState, Checkpoint, RunManifest

// Workflow types
WorkflowOptions, WorkflowResult, EventListener
```

### 3. Command Layer Refactoring

All faber commands now directly use SDK managers instead of stubs:

| Command | SDK Manager | Operations |
|---------|-------------|------------|
| `faber work` | WorkManager | issue, comment, label, milestone |
| `faber repo` | RepoManager | branch, commit, pr, tag, worktree, push, pull |
| `faber spec` | SpecManager | create, list, validate, refine, archive |
| `faber logs` | LogManager | write, list, capture, status, archive, search |
| `faber run/status/pause/resume/recover` | FaberWorkflow | Full workflow orchestration |

### 4. Files Removed (Stubs No Longer Needed)

```
src/sdk/stubs.ts      # 159 lines - Stub manager implementations
src/sdk/types.ts      # 258 lines - Local type definitions (now from SDK)
src/tools/faber/simple.ts  # 247 lines - Simple standalone commands
src/tools/faber/commands/build.ts     # 125 lines - Old build command
src/tools/faber/commands/create.ts    # 241 lines - Old create command
src/tools/faber/commands/list.ts      # 113 lines - Old list command
src/tools/faber/commands/validate.ts  # 84 lines - Old validate command
```

**Total removed**: ~1,227 lines of stub/legacy code

## Architecture Decisions

### 1. Factory Pattern for SDK Access

**Decision**: Use centralized factory functions instead of direct instantiation.

**Rationale**:
- Single point of configuration
- Lazy loading improves startup performance
- Enables testing with `clearInstances()`
- Consistent error handling across all managers

### 2. Type Re-export Strategy

**Decision**: Re-export all types from SDK through `src/sdk/index.ts`.

**Rationale**:
- Single import point for CLI consumers
- Decouples CLI from SDK internal structure
- Enables version management (swap SDK without changing imports)

### 3. Configuration Auto-loading

**Decision**: Factory automatically loads config from `.fractary/faber/`.

**Rationale**:
- Commands don't need to manage configuration
- Consistent behavior across all commands
- Fallback to defaults when no config exists

## Integration Pattern for External Projects

Projects like `fractary/claude-plugins` can use the CLI SDK layer:

```typescript
import {
  // Factory functions
  getWorkManager,
  getRepoManager,
  getSpecManager,
  getLogManager,
  getStateManager,
  getWorkflow,

  // Types
  Issue,
  PullRequest,
  Specification,
  WorkflowOptions,
} from '@fractary/cli';

// Example: Create an issue
const work = await getWorkManager();
const issue = await work.createIssue({
  title: 'New feature',
  body: 'Description',
  labels: ['enhancement'],
});

// Example: Run FABER workflow
const workflow = await getWorkflow();
const result = await workflow.run({
  work_id: 'ISSUE-123',
  initial_phase: 'frame',
  config: { autonomy: 'assisted' },
});
```

## Command Examples

### Work Operations
```bash
# Issue management
fractary faber work issue create "Bug fix" --body "Details"
fractary faber work issue list --state open
fractary faber work issue get 123

# Labels and milestones
fractary faber work label add 123 bug
fractary faber work milestone create "v1.0.0"
```

### Repository Operations
```bash
# Branch workflow
fractary faber repo branch create feature/new-feature
fractary faber repo commit "feat: add new feature"
fractary faber repo push

# Pull requests
fractary faber repo pr create "Add feature" --body "Description"
fractary faber repo pr list --state open
fractary faber repo pr merge 42 --strategy squash
```

### Specification Management
```bash
fractary faber spec create "SPEC-0001" --title "Feature Spec"
fractary faber spec validate SPEC-0001
fractary faber spec refine SPEC-0001 --prompt "Add error handling"
```

### Workflow Operations
```bash
fractary faber run --work-id ISSUE-123
fractary faber status
fractary faber pause
fractary faber resume
fractary faber recover --checkpoint latest
```

## JSON Output for Plugins

All commands support `--json` flag for programmatic access:

```bash
# Returns JSON for parsing
fractary faber work issue list --json
fractary faber repo pr list --state open --json
fractary faber spec list --json
```

## SDK Version Compatibility

| CLI Version | SDK Version | Notes |
|-------------|-------------|-------|
| 0.2.0 | ^1.0.1 | Current |
| 0.1.x | Stubs | Legacy (no real operations) |

## Migration from Stubs

Projects using the old stub-based CLI should:

1. Update `@fractary/cli` to latest
2. Ensure `@fractary/faber` SDK is installed (peer dependency)
3. Initialize configuration: `fractary faber init`
4. Replace any direct SDK imports with CLI factory functions

## Known Limitations

1. **SDK Must Be Installed**: CLI now requires `@fractary/faber` as a peer dependency
2. **Configuration Required**: Some operations require `.fractary/faber/config.json`
3. **Platform Providers**: Work and repo providers must match project setup

## Next Steps

1. Update CHANGELOG.md for SDK integration milestone
2. Create integration guide for external projects
3. Add programmatic API documentation
4. Consider adding CLI version of SDK availability check

## Files Modified

### Source Files
- `src/sdk/factory.ts` - Rewritten for live SDK
- `src/sdk/index.ts` - Added comprehensive type exports
- `src/tools/faber/index.ts` - Updated command registration
- `src/tools/faber/commands/work/index.ts` - SDK integration
- `src/tools/faber/commands/repo/index.ts` - SDK integration
- `src/tools/faber/commands/spec/index.ts` - SDK integration
- `src/tools/faber/commands/logs/index.ts` - SDK integration
- `src/tools/faber/commands/workflow/index.ts` - SDK integration

### Configuration
- `package.json` - Updated SDK dependency to ^1.0.1

## Testing Verification

```bash
# TypeScript compilation successful
npm run build

# All commands available
fractary faber --help
fractary faber work --help
fractary faber repo --help
fractary faber spec --help
fractary faber logs --help
```
