# Phase 5 Implementation Plan: Fork and Merge Operations

**Status**: In Progress
**Date**: 2025-12-15
**Target Completion**: 2025-12-15
**Scope**: 2 commands, ~600 lines

## Overview

Phase 5 implements fork and merge operations for component management. Users can create local copies (forks) of remote components and merge components from different sources with flexible conflict resolution strategies.

## Commands to Implement

### 1. `forge fork <source> [name]`
**File**: `src/tools/forge/commands/registry/fork.ts`
**Purpose**: Create a local fork/copy of a component with optional rename

**Implementation Points**:
- Create local copy of a component (agent, tool, workflow, template)
- Support copying from installed components or registry
- Auto-generate fork name or use provided name
- Support optional description/metadata update
- Create lockfile entry for forked component
- Optional: Set up git tracking if in git repo

**Example Usage**:
```bash
fractary forge fork stockyard/my-agent
fractary forge fork stockyard/my-agent my-fork
fractary forge fork my-agent my-modified-agent --source installed
fractary forge fork --from registry stockyard/plugin
```

**Options**:
- `[name]` - Optional new name for fork (auto-generated if not provided)
- `--source <installed|registry>` - Source type (default: registry)
- `--registry <name>` - Specific registry to search (default: all)
- `--path <dir>` - Destination path (default: current directory)
- `--description <text>` - Update component description
- `--update-metadata` - Prompt to update component metadata
- `--with-git` - Initialize git tracking for fork
- `--verbose` - Show detailed operation steps

### 2. `forge merge <base> <source>`
**File**: `src/tools/forge/commands/registry/merge.ts`
**Purpose**: Merge/combine components with conflict resolution

**Implementation Points**:
- Merge components with different strategies
- Support merge strategies: auto, local, upstream, manual
- Detect conflicts in component definitions
- Preserve or merge metadata
- Create backup before merge
- Update lockfile with merged state

**Example Usage**:
```bash
fractary forge merge my-agent stockyard/my-agent
fractary forge merge my-agent stockyard/my-agent --strategy auto
fractary forge merge my-agent stockyard/my-agent --strategy local
fractary forge merge my-agent stockyard/my-agent --strategy upstream
fractary forge merge my-agent stockyard/my-agent --backup
```

**Options**:
- `--strategy <auto|local|upstream|manual>` - Merge strategy (default: auto)
  - `auto`: Automatically choose based on timestamps
  - `local`: Keep local version
  - `upstream`: Use upstream version
  - `manual`: Interactive conflict resolution
- `--backup` - Create backup of current component
- `--dry-run` - Show what would be merged without applying
- `--force` - Skip validation
- `--verbose` - Show detailed merge process

### 3. Merge Strategies

**Auto Strategy**:
- Compare timestamps
- Use most recently updated version
- Log decision for transparency

**Local Strategy**:
- Keep local component unchanged
- Useful for custom forks
- Preserve all local changes

**Upstream Strategy**:
- Completely replace with upstream version
- Good for resync with source
- Lose all local modifications

**Manual Strategy**:
- Prompt for each conflict
- Interactive decision-making
- Line-by-line comparison for definitions

## Implementation Details

### Fork Operation Flow

```
1. Parse source: extract registry and component name
2. Locate source component (installed or registry)
3. Generate fork name (if not provided)
4. Validate fork name is unique
5. Copy component files to destination
6. Update metadata (name, description, fork marker)
7. Create or update lockfile entry
8. Initialize git (optional)
9. Display success with new component location
```

### Merge Operation Flow

```
1. Validate both base and source components exist
2. Determine merge strategy (auto/local/upstream/manual)
3. Create backup (if --backup)
4. Perform strategy-specific merge:
   - Auto: Compare timestamps, decide
   - Local: Skip merge
   - Upstream: Copy source to base
   - Manual: Interactive conflict resolution
5. Update merged component metadata
6. Update lockfile
7. Verify integrity
8. Display results and conflicts (if any)
```

### Component Structure for Fork/Merge

```typescript
interface ComponentMetadata {
  name: string;
  type: ComponentType;
  version: string;
  description?: string;
  author?: string;
  source?: {
    registry?: string;
    original_name?: string;
    original_version?: string;
  };
  fork?: {
    created_at: string;
    from_registry: string;
    from_name: string;
    from_version: string;
  };
  merge?: {
    strategy: 'auto' | 'local' | 'upstream' | 'manual';
    timestamp: string;
    source_component: string;
    base_component: string;
    conflicts?: string[];
  };
}
```

## File Structure After Phase 5

```
src/tools/forge/
├── commands/
│   ├── registry/
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   ├── list.ts
│   │   ├── info.ts
│   │   ├── search.ts
│   │   ├── lock.ts
│   │   ├── update.ts
│   │   ├── registry-add.ts
│   │   ├── registry-remove.ts
│   │   ├── registry-list.ts
│   │   ├── cache-clear.ts
│   │   ├── cache-stats.ts
│   │   ├── fork.ts               # NEW
│   │   ├── merge.ts              # NEW
│   │   └── index.ts              # Updated
├── utils/
│   ├── forge-config.ts
│   ├── formatters.ts
│   ├── lockfile-manager.ts
│   ├── update-checker.ts
│   ├── cache-manager.ts
│   ├── fork-manager.ts           # NEW
│   ├── merge-manager.ts          # NEW
│   └── component-differ.ts       # NEW (for merge conflicts)
└── index.ts
```

## Utility Modules

### fork-manager.ts

```typescript
interface ForkOptions {
  destination?: string;
  name?: string;
  description?: string;
  updateMetadata?: boolean;
  withGit?: boolean;
}

interface ForkResult {
  originalName: string;
  forkedName: string;
  location: string;
  timestamp: string;
  source: {
    registry?: string;
    component: string;
    version: string;
  };
}

// Functions to implement:
- locateComponent(name: string, source: 'installed' | 'registry'): Promise<ComponentLocation>
- generateForkName(originalName: string, basePath: string): Promise<string>
- copyComponent(source: string, destination: string, newName: string): Promise<void>
- updateComponentMetadata(path: string, updates: Partial<ComponentMetadata>): Promise<void>
- createForkEntry(component: ForkResult): Promise<void>
```

### merge-manager.ts

```typescript
interface MergeOptions {
  strategy: 'auto' | 'local' | 'upstream' | 'manual';
  backup?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

interface MergeResult {
  base: string;
  source: string;
  strategy: string;
  success: boolean;
  conflicts?: ConflictInfo[];
  changes: {
    files_modified: number;
    metadata_updated: boolean;
  };
  timestamp: string;
}

interface ConflictInfo {
  file: string;
  type: 'content' | 'metadata' | 'structure';
  base_value: unknown;
  source_value: unknown;
  resolution?: unknown;
}

// Functions to implement:
- mergeComponents(base: string, source: string, options: MergeOptions): Promise<MergeResult>
- detectConflicts(base: ComponentMetadata, source: ComponentMetadata): Promise<ConflictInfo[]>
- resolveConflicts(conflicts: ConflictInfo[], strategy: string): Promise<ConflictInfo[]>
- createBackup(componentPath: string): Promise<string>
- applyMerge(base: string, source: string, conflicts: ConflictInfo[]): Promise<void>
```

### component-differ.ts

```typescript
interface Difference {
  field: string;
  base: unknown;
  source: unknown;
  type: 'added' | 'removed' | 'modified';
}

// Functions to implement:
- compareMetadata(base: ComponentMetadata, source: ComponentMetadata): Difference[]
- compareFiles(basePath: string, sourcePath: string): Difference[]
- findConflicts(diffs: Difference[]): Difference[]
- generateDiffReport(diffs: Difference[]): string
```

## Acceptance Criteria

- [ ] Fork command creates component copy with new name
- [ ] Fork updates metadata correctly
- [ ] Fork supports multiple source types (installed/registry)
- [ ] Merge supports all strategies (auto/local/upstream/manual)
- [ ] Merge detects and reports conflicts
- [ ] Backup creation works correctly
- [ ] Dry-run mode doesn't modify components
- [ ] Lockfile updates on fork/merge
- [ ] Error handling for missing components
- [ ] Success messages show operation details

## Integration Points

- Works with existing install/uninstall commands
- Integrates with lockfile system
- Uses cache and registry management
- Respects component validation rules
- Updates configuration appropriately

## Command Examples

### Fork Examples

```bash
# Create fork with auto-generated name
fractary forge fork stockyard/shared-agent
# Result: shared-agent-1, shared-agent-2, etc.

# Create fork with custom name
fractary forge fork stockyard/shared-agent my-custom-agent

# Fork from installed component
fractary forge fork my-agent my-agent-experimental --source installed

# Fork with metadata update
fractary forge fork stockyard/plugin my-fork --description "My custom fork"

# Fork with git tracking
fractary forge fork stockyard/tool my-tool --with-git
```

### Merge Examples

```bash
# Auto-merge (most recent wins)
fractary forge merge my-agent stockyard/my-agent --strategy auto

# Keep local version
fractary forge merge my-agent stockyard/my-agent --strategy local

# Update to upstream
fractary forge merge my-agent stockyard/my-agent --strategy upstream

# Manual interactive merge
fractary forge merge my-agent stockyard/my-agent --strategy manual

# Dry run to see what would happen
fractary forge merge my-agent stockyard/my-agent --dry-run

# Merge with backup
fractary forge merge my-agent stockyard/my-agent --backup
```

## Next Steps

1. Implement fork-manager.ts utility
2. Implement component-differ.ts utility
3. Implement merge-manager.ts utility
4. Implement fork.ts command
5. Implement merge.ts command
6. Create parent fork/merge command structure
7. Test fork and merge operations
8. Integrate with main forge command
9. Update Phase 5 documentation

## Technical Considerations

- Fork naming: Use sequential suffixes (name-1, name-2) for auto-generation
- Merge strategies: Store strategy choice in metadata for audit trail
- Backup creation: Store in temporary directory, cleanup after success
- Conflict detection: Compare timestamps, content hashes, and metadata
- Git integration: Optional, respects existing .git configuration
- Path resolution: Use component location resolver for cross-directory operations
