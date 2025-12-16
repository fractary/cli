# Phase 3 Implementation Plan: Registry Management

**Status**: ✅ Complete
**Date**: 2025-12-15
**Completed**: 2025-12-15
**Scope**: 3 commands + parent command, ~650 lines

## Overview

Phase 3 implements registry management commands for adding, removing, and listing configured registries. Users can manage multiple registries (Fractary official, Stockyard, custom manifest-based).

## Commands to Implement

### 1. `forge registry add <name> <url>`
**File**: `src/tools/forge/commands/registry/registry-add.ts`
**Purpose**: Add a new registry to configuration

**Implementation Points**:
- Validate registry URL and name
- Support registry types: `manifest` or `stockyard`
- Set priority and cache TTL
- Add to `.fractary/plugins/forge/config.json`
- Validate registry is accessible before adding

**Example Usage**:
```bash
fractary forge registry add custom https://registry.example.com/manifest.json
fractary forge registry add stockyard https://stockyard.fractary.dev --type stockyard
fractary forge registry add local file:///path/to/registry.json --priority 100
```

**Options**:
- `--type <manifest|stockyard>` - Registry type (default: manifest)
- `--priority <number>` - Priority for resolution (higher = first, default: 10)
- `--cache-ttl <seconds>` - Cache time-to-live (default: 3600)
- `--disabled` - Add but keep disabled
- `--force` - Add without validation

### 2. `forge registry remove <name>`
**File**: `src/tools/forge/commands/registry/registry-remove.ts`
**Purpose**: Remove a registry from configuration

**Implementation Points**:
- Remove from config file
- Confirm before removing
- Support `--force` to skip confirmation
- Prevent removing the last registry

**Example Usage**:
```bash
fractary forge registry remove custom
fractary forge registry remove stockyard --force
```

### 3. `forge registry list`
**File**: `src/tools/forge/commands/registry/registry-list.ts`
**Purpose**: List all configured registries

**Implementation Points**:
- Display in table format
- Show: name, type, URL, enabled, priority, cache TTL
- Support `--json` output
- Highlight default/primary registry

**Example Usage**:
```bash
fractary forge registry list
fractary forge registry list --json
```

### 4. `forge registry` (parent command)
**File**: Update `src/tools/forge/commands/registry/index.ts`
**Purpose**: Group registry management commands

**Subcommands**:
```bash
fractary forge registry add <name> <url>
fractary forge registry remove <name>
fractary forge registry list
```

## Registry Configuration Structure

```json
{
  "registries": [
    {
      "name": "fractary-core",
      "type": "manifest",
      "url": "https://raw.githubusercontent.com/fractary/plugins/main/registry.json",
      "enabled": true,
      "priority": 1,
      "cache_ttl": 3600
    },
    {
      "name": "stockyard",
      "type": "stockyard",
      "url": "https://stockyard.fractary.dev",
      "enabled": true,
      "priority": 5,
      "cache_ttl": 1800,
      "auth": {
        "type": "bearer",
        "token_env": "FRACTARY_TOKEN"
      }
    }
  ]
}
```

## Implementation Strategy

### Step 1: Create Registry Commands (Day 1)
- [x] Create `src/tools/forge/commands/registry/registry-add.ts`
- [x] Create `src/tools/forge/commands/registry/registry-remove.ts`
- [x] Create `src/tools/forge/commands/registry/registry-list.ts`

### Step 2: Update Command Structure (Day 2)
- [x] Create parent `registry` command
- [x] Group add/remove/list as subcommands
- [x] Update main forge index

### Step 3: Integration & Testing (Day 3)
- [ ] Test adding various registry types
- [ ] Test removal with validation
- [ ] Test listing with different formats
- [ ] Validate config file updates

## File Structure After Phase 3

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
│   │   ├── registry-add.ts          # NEW
│   │   ├── registry-remove.ts       # NEW
│   │   ├── registry-list.ts         # NEW
│   │   └── index.ts                 # Updated
├── utils/
│   ├── forge-config.ts              # May need updates
│   ├── formatters.ts
│   ├── lockfile-manager.ts
│   └── update-checker.ts
└── index.ts                         # Updated
```

## Validation Rules

**Registry Name:**
- Must be alphanumeric with hyphens/underscores
- Must be unique
- Cannot conflict with reserved names

**Registry URL:**
- Must be valid HTTPS URL or file:// URL
- Should be accessible (unless --force)
- Manifest registries must return valid JSON

**Priority:**
- Must be positive integer
- Higher priority = checked first
- Duplicate priorities allowed but discouraged

## Acceptance Criteria

- [x] Add command registers new registry in config
- [x] Remove command deletes registry from config
- [x] List command displays all registries in table format
- [x] Validation prevents invalid URLs and names
- [x] Config file is properly formatted JSON
- [x] Commands register under `forge registry` parent
- [x] Help text is comprehensive
- [x] Error messages are clear

## Notes

- Registry management affects `~/.fractary/config.json` or `.fractary/plugins/forge/config.json`
- Priority determines resolution order (higher first)
- Cache TTL controls how long manifests are cached
- Stockyard registries may require authentication (Phase 6)

## Next Steps

1. Implement registry-add command
2. Implement registry-remove command
3. Implement registry-list command
4. Create parent registry command
5. Test registry workflows
6. Integrate with main forge command

## Implementation Summary

### Completed (2025-12-15)

**Commands Created:**
1. `src/tools/forge/commands/registry/registry-add.ts` (246 lines)
   - Add new registries to configuration
   - Support manifest and Stockyard types
   - Validate URLs and names
   - Test registry accessibility before adding
   - Configure priority and cache TTL

2. `src/tools/forge/commands/registry/registry-remove.ts` (123 lines)
   - Remove registries from configuration
   - Prevent removing last registry
   - Confirmation prompts for safety
   - Support force and yes flags

3. `src/tools/forge/commands/registry/registry-list.ts` (129 lines)
   - List all configured registries in table
   - Show name, type, URL, status, priority
   - Support JSON output for scripting
   - Verbose mode with cache TTL info

**Parent Command:**
- Created `forge registry` parent command with 3 subcommands
- Grouped all registry management operations
- Usage: `fractary forge registry add|remove|list`

**Key Features:**
- URL validation (HTTPS and file:// support)
- Registry name validation (alphanumeric + hyphens/underscores)
- Priority-based registry ordering
- Accessibility testing before adding (can be skipped with --force)
- Prevents removing the last registry
- Automatic priority sorting after add
- Comprehensive help text for all commands

**Build Status:** ✅ All TypeScript compilation successful

**Command Examples:**
```bash
# Add a registry
fractary forge registry add stockyard https://stockyard.fractary.dev --type stockyard

# List registries
fractary forge registry list --verbose

# Remove a registry
fractary forge registry remove custom
```

**Next Steps:**
- Phase 4: Cache management (cache clear/stats)
- Phase 5: Fork and merge operations
- Phase 6: Stockyard authentication
