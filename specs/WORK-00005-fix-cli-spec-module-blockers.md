---
work_id: "5"
title: Fix CLI spec module blockers preventing plugin integration
type: bug
status: in-progress
created: 2025-12-13
updated: 2025-12-13
source: conversation+issue
issue_url: https://github.com/fractary/cli/issues/5
branch: fix/5-fix-cli-spec-module-blockers-preventing-plugin-integration
template: bug
refinement_rounds: 1
---

# WORK-00005: Fix CLI Spec Module Blockers

## ⚠️ Corrected Scope

**IMPORTANT**: After code analysis, the blockers are in **`@fractary/faber` SDK**, not `@fractary/cli`.

**Decision**: Move this issue to the `fractary/faber` repository where the actual fixes are needed.

## Problem Statement

The Fractary CLI spec module is **not ready for plugin integration**. Phase 0 assessment identified three critical blockers that prevent the spec plugin migration from `fractary/claude-plugins` to use the unified CLI.

**Corrected Analysis**: The CLI implementation is mostly correct. The blockers exist in the `@fractary/faber` SDK's configuration validation and initialization.

## Root Cause Analysis

### 1. ✅ JSON Output Mode - ALREADY IMPLEMENTED

**Original Finding:**
```bash
$ fractary spec templates --json
error: unknown option '--json'
```

**Corrected Finding:** The `--json` flag **IS implemented** in the CLI (`src/tools/faber/commands/spec/index.ts`). All 8 commands have:
- `.option('--json', 'Output as JSON')` declared
- JSON output logic in command handlers
- Error handling that respects `--json` flag

**Actual Root Cause:** The error occurs **before** the CLI command handler runs, during SDK initialization in `@fractary/faber`'s `loadSpecConfig()`. The SDK throws a validation error that prevents the command from executing.

**Impact:**
- Users see "unknown option" because config validation fails before argument parsing completes
- The CLI code is correct; the SDK blocks execution

### 2. Configuration Required for All Operations - SDK ISSUE

**Current Behavior:**
```bash
$ fractary spec list
Error: Configuration validation failed: work: Required, repo: Required, artifacts: Required

$ fractary spec templates
Error: Configuration validation failed: work: Required, repo: Required, artifacts: Required
```

**Root Cause:** `@fractary/faber`'s `loadSpecConfig()` throws validation errors before any command logic runs. The SDK's `SpecManager` constructor requires full configuration, even for read-only operations.

**Location:** `@fractary/faber` SDK - configuration loading and validation

**Impact:**
- Even read-only commands (list, templates, get) fail without full config
- Users cannot discover available templates without prior configuration
- Chicken-and-egg problem: can't run `fractary init` until config exists, but need config to run any command
- Increases barrier to entry for new users

### 3. No Initialization Command - SPANS BOTH REPOS

**Current Behavior:**
- No `fractary init` command exists
- No example config in documentation or error messages
- Unclear where to place config or what format to use

**Root Cause:**
- **SDK side**: `@fractary/faber` doesn't provide config generator/initializer
- **CLI side**: CLI doesn't implement `fractary init` command to call SDK generator

**Decision**: Implement in SDK, expose via CLI wrapper.

**Impact:**
- Cannot proceed with CLI testing without knowing config format
- Users must reverse-engineer configuration requirements
- Chicken-and-egg: need config to run commands, but no way to create config
- Poor developer experience

## Solution Design

**Repository Split**: Most work is in `@fractary/faber` SDK. Minimal CLI changes needed.

### Task 1: ~~Implement --json Flag~~ - ✅ ALREADY DONE

**Status**: The CLI already implements `--json` flags correctly!

**Evidence**: All 8 spec commands in `src/tools/faber/commands/spec/index.ts` have:
- `.option('--json', 'Output as JSON')`
- Conditional JSON output in handlers
- Error handling respects the flag

**Action**: ✅ No action needed - this is already complete.

**Verification**: Once SDK issues are fixed, JSON output will work as designed.

### Task 2: Make Read-Only Commands Work Without Configuration - SDK FIX

**Location**: `@fractary/faber` SDK

**Problem**: The `fractary init` command must work before config exists (chicken-and-egg problem).

**Decision**: The `init` command should be the ONLY command that works without config.

**Implementation Approach** (in SDK):

**Option A: Special-case `init` in config loading**
```typescript
// In @fractary/faber SDK
export function loadSpecConfig(options?: { allowMissing?: boolean }) {
  try {
    // Load and validate config
  } catch (error) {
    if (options?.allowMissing) {
      return null; // Allow missing config for init
    }
    throw error;
  }
}
```

**Option B: Make SpecManager accept partial config**
```typescript
// In @fractary/faber SDK
export class SpecManager {
  constructor(config?: Partial<SpecConfig>) {
    // Allow minimal config for init/templates commands
    this.config = config ?? getDefaultConfig();
  }
}
```

**CLI Changes** (minimal):
```typescript
// In CLI: special handling for init command only
export async function getSpecManager(options?: { allowMissing?: boolean }): Promise<SpecManager> {
  const resolvedConfig = loadSpecConfig(options);
  return new SpecManager(resolvedConfig);
}
```

**Read-Only vs Write**: After discussion, the focus is on allowing `init` to run without config. Other read-only commands can require config since config is now createable via `init`.

### Task 3: Add `fractary init` Command - SDK + CLI

**Decision**: Implement core init logic in SDK, expose via CLI wrapper.

**SDK Implementation** (`@fractary/faber`):

Add config generator/initializer to SDK:
```typescript
// In @fractary/faber SDK
export class ConfigInitializer {
  static generateDefaultConfig(): FaberConfig {
    return {
      work: {
        platform: 'github',
        // ... sensible defaults
      },
      repo: {
        platform: 'github',
        // ... sensible defaults
      },
      artifacts: {
        specs_dir: './specs',
        // ... sensible defaults
      }
    };
  }

  static writeConfig(config: FaberConfig, path: string = '.fractary/config.yaml'): void {
    // Write YAML config file
  }
}
```

**CLI Implementation** (`@fractary/cli`):

Add `fractary init` command that wraps SDK:
```bash
$ fractary init
Created .fractary/config.yaml with default settings.
Please edit to configure your work tracking and repository settings.
```

**CLI Code**:
```typescript
// In src/tools/faber/commands/init.ts or src/cli.ts
import { ConfigInitializer } from '@fractary/faber';

program
  .command('init')
  .description('Initialize Fractary configuration')
  .option('--force', 'Overwrite existing configuration')
  .action(async (options) => {
    const config = ConfigInitializer.generateDefaultConfig();
    ConfigInitializer.writeConfig(config);
    console.log('Created .fractary/config.yaml');
  });
```

**Improved Error Messages** (in SDK):
```bash
$ fractary spec create --work-id 123
Error: Configuration required for this operation.

Run 'fractary init' to generate a template configuration.
```

## Affected Files

**@fractary/faber SDK** (primary work):
```
packages/faber/
├── src/
│   ├── config/
│   │   ├── loader.ts         # Modify loadSpecConfig() to allow missing config
│   │   ├── initializer.ts    # NEW: Add ConfigInitializer class
│   │   └── validator.ts      # Update validation to support init command
│   ├── managers/
│   │   └── SpecManager.ts    # Allow partial/missing config for init
│   └── index.ts              # Export ConfigInitializer
```

**@fractary/cli** (minimal changes):
```
src/
├── tools/
│   └── faber/
│       └── commands/
│           ├── spec/
│           │   └── index.ts  # ✅ Already has --json flags (no changes)
│           └── init.ts       # NEW or UPDATE: Add fractary init command
├── sdk/
│   └── factory.ts            # Update getSpecManager() for init support
└── cli.ts                    # Register init command if top-level
```

## Acceptance Criteria

### @fractary/faber SDK
- [ ] `loadSpecConfig()` supports `allowMissing` option for init command
- [ ] `ConfigInitializer` class provides `generateDefaultConfig()`
- [ ] `ConfigInitializer` can write config file to `.fractary/config.yaml`
- [ ] `SpecManager` accepts partial/missing config for init use case
- [ ] Error messages suggest running `fractary init` when config is missing

### @fractary/cli
- [x] All 8 spec commands support `--json` flag ✅ (already implemented)
- [x] JSON output follows consistent schema ✅ (already implemented)
- [ ] `fractary init` command exists and calls SDK's `ConfigInitializer`
- [ ] `getSpecManager()` supports `allowMissing` option for init
- [ ] Configuration schema is documented in `--help` output
- [x] All changes are backward compatible ✅ (no breaking changes)

### End-to-End
- [ ] `fractary init` works without existing config (chicken-and-egg resolved)
- [ ] After `fractary init`, all spec commands work with `--json` flag
- [ ] Generated config file is valid and passes SDK validation
- [ ] Plugin integration can proceed using JSON output

## Test Plan

### Unit Tests

1. **JSON Output Tests**
   - Each command produces valid JSON when --json flag is used
   - JSON schema is consistent across commands
   - Error responses also use JSON format when --json is set

2. **Configuration Validation Tests**
   - Read-only commands succeed without configuration
   - Write commands fail gracefully with helpful error message
   - Partial configuration scenarios handled correctly

3. **Init Command Tests** (if implemented)
   - Creates valid config file
   - Does not overwrite existing config without --force
   - Generated config passes validation

### Integration Tests

1. **End-to-End JSON Flow**
   ```bash
   # List templates without config
   fractary spec templates --json | jq '.templates[0].name'

   # List specs without config
   fractary spec list --json | jq '.count'
   ```

2. **Plugin Integration Test**
   - Simulate spec-plugin calling CLI commands
   - Verify JSON can be parsed by plugin skills
   - Test error handling path

## Implementation Notes

### Repository Assignment

**Decision**: Move this issue to `fractary/faber` repository.

- **Primary work**: `@fractary/faber` SDK (config loading, initialization)
- **Secondary work**: `@fractary/cli` (minimal wrapper for init command)

**Action Items**:
1. Create issue in `fractary/faber` with SDK-specific tasks
2. Update this issue to reference faber issue
3. Keep minimal CLI work tracked here or in faber issue

### Priority Order (Revised)

1. ~~**--json flag**~~ ✅ Already complete in CLI
2. **SDK config init** (highest priority) - Unblocks all other work
3. **CLI init wrapper** - Expose SDK functionality to users
4. **Test end-to-end** - Verify plugin integration works

### Backward Compatibility

- ✅ CLI already has --json with backward-compatible behavior
- SDK changes must not break existing configurations
- Default output (without --json) already unchanged

### Dependencies

- **Blocks**: WORK-00359 (spec plugin CLI integration)
- **Relates to**: Work plugin CLI migration (#356, #358)
- **Depends on**: `@fractary/faber` SDK updates (to be created)

## References

- Phase 0 Findings: [WORK-00359-phase-0-findings.md](../docs/specs/WORK-00359-phase-0-findings.md)
- Main Migration Spec: WORK-00359-integrate-spec-plugin-cli.md
- GitHub Issue: https://github.com/fractary/cli/issues/5
- CLI Implementation: `src/tools/faber/commands/spec/index.ts`

---

## Changelog

### Round 1 Refinement - 2025-12-13

**Critical Discovery**: Original spec had incorrect assumptions about implementation state.

**Key Findings**:
1. ✅ **JSON flags already implemented** - All 8 spec commands in CLI have `--json` flags
2. ❌ **Blockers are in SDK** - `@fractary/faber` SDK throws config validation errors
3. ❌ **Wrong repository** - Issue should be in `fractary/faber`, not `fractary/cli`

**Decisions Made**:
- **Issue scope**: Move to faber repository (primary work is SDK)
- **Config strategy**: Focus on making `init` work without config (chicken-and-egg resolution)
- **Init location**: Implement in SDK, expose via CLI wrapper

**Changes Applied**:
- Corrected root cause analysis (SDK vs CLI)
- Updated solution design to reflect SDK-based fixes
- Revised affected files to show SDK changes
- Updated acceptance criteria with SDK and CLI split
- Marked completed items (JSON flags) as done
- Added repository assignment guidance

**Questions Answered**:
- Q1: Where should this issue live? → Move to faber repo
- Q2: Config strategy? → Allow init to run before config exists
- Q3: Init implementation? → In SDK with CLI wrapper

**Next Steps**:
1. Create corresponding issue in `fractary/faber` repository
2. Reference faber issue from this CLI issue
3. Implement SDK changes in faber repo
4. Minimal CLI wrapper implementation once SDK is ready
