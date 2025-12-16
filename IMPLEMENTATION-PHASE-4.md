# Phase 4 Implementation Plan: Cache Management

**Status**: In Progress
**Date**: 2025-12-15
**Target Completion**: 2025-12-15
**Scope**: 2 commands + parent command, ~400 lines

## Overview

Phase 4 implements cache management commands for monitoring and clearing cached registry manifests. Users can inspect cache statistics and clear outdated or problematic cache entries.

## Commands to Implement

### 1. `forge cache clear [pattern]`
**File**: `src/tools/forge/commands/registry/cache-clear.ts`
**Purpose**: Clear cached registry manifests

**Implementation Points**:
- Clear all cache or by pattern
- Support age-based clearing (--older-than)
- Support registry-specific clearing
- Show what was cleared
- Confirmation before deletion

**Example Usage**:
```bash
fractary forge cache clear
fractary forge cache clear stockyard
fractary forge cache clear --older-than 3600
fractary forge cache clear --force
```

**Options**:
- `<pattern>` - Optional registry name pattern to clear
- `--older-than <seconds>` - Clear entries older than N seconds
- `--force` - Skip confirmation prompt
- `--dry-run` - Show what would be cleared without deleting
- `--verbose` - Show detailed clearing process

### 2. `forge cache stats`
**File**: `src/tools/forge/commands/registry/cache-stats.ts`
**Purpose**: Show cache statistics and information

**Implementation Points**:
- Display cache location
- Show total size and entry count
- List registries and their cache status
- Show cache hit/miss statistics (if available)
- Display oldest/newest entries
- Show cache TTL for each registry

**Example Usage**:
```bash
fractary forge cache stats
fractary forge cache stats --json
fractary forge cache stats --verbose
```

**Options**:
- `--json` - Output as JSON for scripting
- `--verbose` - Show detailed breakdown by registry
- `--registries` - Show only registry-specific stats

### 3. `forge cache` (parent command)
**File**: Update `src/tools/forge/commands/registry/index.ts`
**Purpose**: Group cache management commands

**Subcommands**:
```bash
fractary forge cache clear [pattern]
fractary forge cache stats
```

## Cache Management Implementation

### Cache Location and Structure

```
~/.fractary/registry/cache/
├── manifests/
│   ├── fractary-core.json (timestamp, ttl, data)
│   ├── stockyard.json
│   └── custom.json
└── metadata.json (cache stats and settings)
```

### Cache Metadata Structure

```json
{
  "version": "1.0.0",
  "created_at": "2025-12-15T10:00:00Z",
  "last_updated": "2025-12-15T10:00:00Z",
  "total_size_bytes": 102400,
  "entries": {
    "fractary-core": {
      "file": "manifests/fractary-core.json",
      "size_bytes": 51200,
      "cached_at": "2025-12-15T09:00:00Z",
      "expires_at": "2025-12-15T10:00:00Z",
      "hits": 15,
      "misses": 2,
      "ttl": 3600
    }
  },
  "statistics": {
    "total_cache_hits": 120,
    "total_cache_misses": 8,
    "hit_ratio": 0.9375,
    "avg_entry_age_seconds": 1800
  }
}
```

## Implementation Strategy

### Step 1: Create Cache Commands (Day 1)
- [ ] Create `src/tools/forge/commands/registry/cache-clear.ts`
- [ ] Create `src/tools/forge/commands/registry/cache-stats.ts`
- [ ] Create cache utility functions

### Step 2: Cache Utilities
- [ ] Implement cache directory detection
- [ ] Implement cache file reading/writing
- [ ] Implement metadata tracking
- [ ] Implement size calculation
- [ ] Implement cleanup logic

### Step 3: Integration & Testing
- [ ] Test cache clearing with patterns
- [ ] Test cache stats display
- [ ] Test confirmation prompts
- [ ] Validate cache metadata integrity

## File Structure After Phase 4

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
│   │   ├── cache-clear.ts         # NEW
│   │   ├── cache-stats.ts         # NEW
│   │   └── index.ts               # Updated
├── utils/
│   ├── forge-config.ts
│   ├── formatters.ts
│   ├── lockfile-manager.ts
│   ├── update-checker.ts
│   ├── cache-manager.ts           # NEW
│   └── path-resolver.ts           # NEW (if needed)
└── index.ts                        # Updated
```

## Cache Manager Utility

### Key Functions

```typescript
interface CacheEntry {
  file: string;
  size_bytes: number;
  cached_at: string;
  expires_at: string;
  hits: number;
  misses: number;
  ttl: number;
}

interface CacheMetadata {
  version: string;
  created_at: string;
  last_updated: string;
  total_size_bytes: number;
  entries: Record<string, CacheEntry>;
  statistics: CacheStatistics;
}

interface CacheStatistics {
  total_cache_hits: number;
  total_cache_misses: number;
  hit_ratio: number;
  avg_entry_age_seconds: number;
}

// Functions to implement:
- getCacheDirectory(): string
- getCacheMetadata(): Promise<CacheMetadata>
- saveCacheMetadata(metadata: CacheMetadata): Promise<void>
- clearCache(pattern?: string, options?: ClearOptions): Promise<number>
- getCacheStats(): Promise<CacheStatistics>
- calculateCacheSize(): Promise<number>
- isEntryExpired(entry: CacheEntry): boolean
```

## Acceptance Criteria

- [ ] Clear command removes cache entries
- [ ] Stats command displays cache information
- [ ] Metadata tracking works accurately
- [ ] Dry-run mode shows what would be cleared
- [ ] Confirmation prevents accidental deletion
- [ ] Pattern matching filters correctly
- [ ] Cache size calculation is accurate
- [ ] JSON output is valid and parseable

## Integration Points

- Cache management should work with existing registry commands
- Clearing cache should not affect configuration
- Stats should integrate with registry metadata
- Clear operation should update metadata

## Next Steps

1. Implement cache-manager.ts utility
2. Implement cache-clear.ts command
3. Implement cache-stats.ts command
4. Create parent cache command
5. Test cache operations
6. Integrate with main forge command
