# Phase 2 Implementation Plan: Lockfile & Updates

**Status**: ✅ Complete
**Date**: 2025-12-15
**Completed**: 2025-12-15
**Scope**: 2 commands + 2 utility modules, ~1100 lines

## Overview

Phase 2 implements the lockfile system and update management. These commands manage dependency versions and keep installed plugins synchronized across projects.

## Commands to Implement

### 1. `forge lock`
**File**: `src/tools/forge/commands/registry/lock.ts`
**Purpose**: Generate/update lockfile with exact versions of installed components

**Implementation Points**:
- Parse all installed components (from Phase 1 list functionality)
- Record exact versions and checksums
- Generate `.fractary/plugins/forge/lock.json`
- Support `--update` flag to refresh existing lockfile
- Show summary of locked versions

**Example Usage**:
```bash
fractary forge lock
fractary forge lock --update
```

**Lock File Format**:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-15T10:30:00Z",
  "locked": {
    "agents": [
      {
        "name": "@fractary/issue-agent",
        "version": "1.2.3",
        "checksum": "sha256:abc123...",
        "installed_path": ".fractary/agents/issue-agent"
      }
    ],
    "tools": [...],
    "workflows": [...]
  }
}
```

### 2. `forge update [name]`
**File**: `src/tools/forge/commands/registry/update.ts`
**Purpose**: Check and install updates for installed plugins

**Implementation Points**:
- Query registries for latest versions
- Compare with installed versions using semver
- Support `--all` flag to update everything
- Support version constraints (`^`, `~`, exact)
- Show diff before updating
- Update lockfile after success

**Example Usage**:
```bash
fractary forge update
fractary forge update @fractary/faber-plugin
fractary forge update --all
fractary forge update --dry-run
```

## Utility Modules (new/updated)

### `src/tools/forge/utils/lockfile-manager.ts` (NEW)
**Key Functions**:
```typescript
interface LockEntry {
  name: string;
  version: string;
  checksum: string;
  installed_path: string;
  plugin?: string;
}

interface LockFile {
  version: string;
  timestamp: string;
  locked: {
    agents: LockEntry[];
    tools: LockEntry[];
    workflows: LockEntry[];
    templates: LockEntry[];
  };
}

async function generateLockfile(options?: {
  update?: boolean;
}): Promise<LockFile>

async function saveLockfile(lock: LockFile, path?: string): Promise<void>

async function loadLockfile(path?: string): Promise<LockFile>

async function validateLockfile(lock: LockFile): Promise<boolean>
```

### `src/tools/forge/utils/update-checker.ts` (NEW)
**Key Functions**:
```typescript
interface UpdateInfo {
  current: string;
  latest: string;
  constraint?: string;
  available: string[];
  hasUpdate: boolean;
}

async function checkUpdates(
  name: string,
  currentVersion: string,
  registries?: RegistryConfig[]
): Promise<UpdateInfo>

async function checkAllUpdates(
  components: LocalComponent[]
): Promise<Record<string, UpdateInfo>>

function compareVersions(current: string, latest: string): number
```

## Implementation Strategy

### Step 1: Create Update Utilities (Day 1)
- [ ] Create `src/tools/forge/utils/lockfile-manager.ts`
- [ ] Create `src/tools/forge/utils/update-checker.ts`
- [ ] Implement version comparison using semver

### Step 2: Implement Lock Command (Day 2)
- [ ] Create `src/tools/forge/commands/registry/lock.ts`
- [ ] Implement lockfile generation from installed components
- [ ] Add to registry commands index

### Step 3: Implement Update Command (Day 3)
- [ ] Create `src/tools/forge/commands/registry/update.ts`
- [ ] Implement version checking logic
- [ ] Support incremental updates
- [ ] Update lockfile after success

### Step 4: Integration & Testing (Day 4)
- [ ] Register commands in `index.ts`
- [ ] Update lockfile on install/uninstall (integrate with Phase 1)
- [ ] Test update workflows
- [ ] Validate lockfile format

## File Structure After Phase 2

```
src/tools/forge/
├── commands/
│   ├── registry/
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   ├── list.ts
│   │   ├── info.ts
│   │   ├── search.ts
│   │   ├── lock.ts                  # NEW
│   │   ├── update.ts                # NEW
│   │   └── index.ts
├── utils/
│   ├── forge-config.ts
│   ├── formatters.ts
│   ├── lockfile-manager.ts          # NEW
│   └── update-checker.ts            # NEW
└── index.ts
```

## Key Dependencies

Already available:
- ✅ `semver`: Version parsing and comparison
- ✅ `chalk`, `ora`: Output formatting
- ✅ `@fractary/forge`: Registry SDK

## Lock File Location

- **Local (project)**: `.fractary/plugins/forge/lock.json`
- **Global**: `~/.fractary/registry/lock.json` (for global installations)

## Acceptance Criteria

- [x] Lock command generates valid lockfile with all installed components
- [x] Lock file includes version, checksum, and path information
- [x] Update command checks registries for newer versions
- [x] Update displays available versions before applying
- [x] Semver constraints supported (^, ~, exact)
- [x] Lockfile updated after successful updates
- [x] Dry-run mode available
- [x] Commands register in main forge command

## Notes

- Lockfile enables reproducible installations across machines
- Checksums help verify installation integrity
- Update checking requires network access (falls back to offline)
- Phase 2 is foundation for Phase 3+ registry management

## Next Steps

1. Create lockfile-manager utility
2. Create update-checker utility
3. Implement lock command
4. Implement update command
5. Integrate with Phase 1 commands
6. Test lockfile workflows

## Implementation Summary

### Completed (2025-12-15)

**Utility Modules Created:**
1. `src/tools/forge/utils/lockfile-manager.ts` (246 lines)
   - Generate lockfile from installed components
   - Load/save lockfile with validation
   - Merge and remove lock entries
   - Component locking with checksums and paths

2. `src/tools/forge/utils/update-checker.ts` (211 lines)
   - Check for updates across registries
   - Semantic version comparison (semver)
   - Update suggestions with filtering
   - Version constraint satisfaction

**Commands Created:**
1. `src/tools/forge/commands/registry/lock.ts` (122 lines)
   - Generate/update `.fractary/plugins/forge/lock.json`
   - Display component summaries
   - Support `--update` and `--force` flags
   - Integrated with existing formatters

2. `src/tools/forge/commands/registry/update.ts` (280 lines)
   - Check all or specific components for updates
   - Display available updates in table format
   - Install updates with version constraints
   - Update lockfile after installation
   - Support `--all`, `--dry-run`, `--major` flags

**Key Features:**
- Lockfile tracks: name, version, path, checksum, installation time
- Semantic versioning support (major.minor.patch)
- Registry-aware update checking
- Dry-run preview mode
- Automatic lockfile updates

**Build Status:** ✅ All TypeScript compilation successful

**Next Steps:**
- Phase 3: Registry management (registry add/remove/list)
- Phase 4: Cache management (cache clear/stats)
- Phase 5: Fork and merge operations
- Phase 6: Stockyard authentication
