# SPEC-00026: Codex CLI Alignment with SDK v3.0

## Status: Draft
## Date: 2025-12-12

## Overview

This specification defines the alignment of `fractary codex` CLI commands with the redesigned `@fractary/codex` SDK v3.0 architecture. The SDK has shifted from a push-based sync model (v2.0) to a pull-based retrieval model (v3.0) with intelligent caching, MCP integration, and universal `codex://` references.

## Current State (Legacy v2.0)

The existing CLI commands are based on the old push-based sync design:

| Command | Purpose | Status |
|---------|---------|--------|
| `init` | Initialize config | **Replace** - new init flow |
| `validate` | Validate frontmatter | **Deprecate** - not in new design |
| `parse` | Parse frontmatter | **Deprecate** - not in new design |
| `config` | Config management | **Replace** - new config structure |
| `route` | Sync routing | **Deprecate** - replaced by sync |
| `list` | List files | **Deprecate** - replaced by cache list |
| `check` | Check sync status | **Deprecate** - replaced by sync/health |

## Target State (SDK v3.0)

Based on SPEC-00024 and SPEC-00025, the new CLI commands should be:

### Primary Commands

| Command | SDK Module | Description |
|---------|------------|-------------|
| `codex init` | Config, Cache, MCP | Setup with org detection, cache init, MCP registration |
| `codex fetch <uri>` | References, Cache, Storage | Retrieve documents by `codex://` reference |
| `codex sync` | Sync | Bidirectional synchronization |
| `codex cache` | Cache | Cache management (subcommands) |
| `codex types` | Types | Type registry management (subcommands) |
| `codex health` | Multiple | Diagnostics and auto-repair |

### Subcommand Structure

```
fractary codex
├── init [--org <slug>] [--mcp] [--force]
├── fetch <uri> [--bypass-cache] [--ttl <seconds>] [--json]
├── sync
│   ├── project [name] [--env <env>] [--dry-run] [--direction <dir>]
│   └── org [--env <env>] [--dry-run] [--exclude <pattern>]
├── cache
│   ├── list [--type <type>] [--expired] [--json]
│   ├── clear [--all] [--expired] [--pattern <glob>]
│   └── stats [--json]
├── types
│   ├── list [--json]
│   ├── show <name>
│   ├── add <name> --pattern <glob> [--ttl <duration>]
│   └── remove <name>
└── health [--fix] [--json]
```

## SDK Module Mapping

### 1. `codex init`

**SDK Functions:**
- `loadConfig()` - Load existing config
- `resolveOrganization()` - Auto-detect org from git remote
- `createDefaultRegistry()` - Initialize type registry
- `createCacheManager()` - Initialize cache
- `createMcpServer()` (optional) - Register MCP server

**Config Location:** `.fractary/plugins/codex/config.json`

**Behavior:**
1. Detect organization from git remote (or use `--org`)
2. Create config directory structure
3. Initialize cache directory
4. Optionally register MCP server (`--mcp`)

### 2. `codex fetch <uri>`

**SDK Functions:**
- `parseReference(uri)` - Parse `codex://org/project/path` URI
- `resolveReference(parsed)` - Resolve to cache/storage path
- `CacheManager.get(key)` - Check cache
- `StorageManager.fetch(ref)` - Fetch from storage if not cached
- `CacheManager.set(key, content)` - Update cache

**Options:**
- `--bypass-cache` - Skip cache, fetch directly
- `--ttl <seconds>` - Override default TTL
- `--json` - Output as JSON with metadata
- `--output <file>` - Write to file instead of stdout

**Example:**
```bash
fractary codex fetch codex://fractary/faber/docs/api.md
fractary codex fetch codex://fractary/faber/specs/SPEC-0001.md --json
```

### 3. `codex sync`

**SDK Functions:**
- `SyncManager.sync(options)` - Execute sync
- `createSyncPlan()` - Generate sync plan
- `evaluatePaths()` - Evaluate which files to sync
- `formatPlanSummary()` - Display plan

**Subcommands:**

#### `codex sync project [name]`
Sync single project with codex repository.

Options:
- `--env <env>` - Target environment (dev/test/staging/prod)
- `--dry-run` - Show what would sync without executing
- `--direction <to-codex|from-codex|bidirectional>` - Sync direction

#### `codex sync org`
Sync all projects in organization.

Options:
- `--env <env>` - Target environment
- `--dry-run` - Preview mode
- `--exclude <pattern>` - Exclude repos matching pattern
- `--parallel <n>` - Parallel sync count

### 4. `codex cache`

**SDK Functions:**
- `CacheManager.list()` - List cache entries
- `CacheManager.clear()` - Clear cache entries
- `CacheManager.getStats()` - Get cache statistics
- `getCacheEntryStatus()` - Check entry freshness
- `isCacheEntryValid()` - Validate entry

**Subcommands:**

#### `codex cache list`
List cached documents.

Options:
- `--type <type>` - Filter by artifact type (docs, specs, logs, etc.)
- `--expired` - Show only expired entries
- `--json` - JSON output

#### `codex cache clear`
Clear cache entries.

Options:
- `--all` - Clear entire cache
- `--expired` - Clear only expired entries
- `--pattern <glob>` - Clear entries matching pattern

#### `codex cache stats`
Display cache statistics.

Options:
- `--json` - JSON output

Output includes:
- Total entries
- Total size
- Hit/miss ratio
- Entries by type
- Expired count

### 5. `codex types`

**SDK Functions:**
- `TypeRegistry.list()` - List all types
- `TypeRegistry.get(name)` - Get type details
- `TypeRegistry.register(config)` - Add custom type
- `TypeRegistry.unregister(name)` - Remove custom type
- `BUILT_IN_TYPES` - Built-in type definitions

**Subcommands:**

#### `codex types list`
List all artifact types (built-in and custom).

#### `codex types show <name>`
Show details for a specific type.

#### `codex types add <name>`
Add a custom artifact type.

Options:
- `--pattern <glob>` - File pattern (required)
- `--ttl <duration>` - Cache TTL (e.g., "24h", "7d")
- `--description <text>` - Type description

#### `codex types remove <name>`
Remove a custom artifact type.

### 6. `codex health`

**SDK Functions:**
- `CacheManager.validate()` - Validate cache integrity
- `loadConfig()` / validate - Check config
- `McpServer.status()` - Check MCP status
- `StorageManager.ping()` - Check storage access
- Migration functions - Check for needed migrations

**Checks:**
1. Configuration validity
2. Cache integrity
3. Storage connectivity
4. MCP server status (if configured)
5. Migration requirements

Options:
- `--fix` - Attempt auto-repair of issues
- `--json` - JSON output

## Implementation Phases

### Phase 1: Foundation (Priority)
1. **Delete old commands** - Remove deprecated v2.0 commands
2. **Implement `init`** - New initialization flow
3. **Implement `fetch`** - Core document retrieval
4. **Implement `cache list/clear/stats`** - Basic cache management

### Phase 2: Sync & Types
5. **Implement `sync project`** - Single project sync
6. **Implement `sync org`** - Organization-wide sync
7. **Implement `types`** - Type registry commands

### Phase 3: Polish
8. **Implement `health`** - Diagnostics
9. **Add migration support** - Detect and migrate v2.0 configs
10. **Documentation** - Update all docs

## File Structure Changes

### Remove (Old Commands)
```
src/tools/codex/commands/
├── validate.ts    # DELETE
├── parse.ts       # DELETE
├── route.ts       # DELETE
├── list.ts        # DELETE
├── check.ts       # DELETE
└── config.ts      # REPLACE
```

### Add (New Commands)
```
src/tools/codex/commands/
├── init.ts        # REWRITE
├── fetch.ts       # NEW
├── sync/
│   ├── index.ts   # NEW - sync command group
│   ├── project.ts # NEW
│   └── org.ts     # NEW
├── cache/
│   ├── index.ts   # NEW - cache command group
│   ├── list.ts    # NEW
│   ├── clear.ts   # NEW
│   └── stats.ts   # NEW
├── types/
│   ├── index.ts   # NEW - types command group
│   ├── list.ts    # NEW
│   ├── show.ts    # NEW
│   ├── add.ts     # NEW
│   └── remove.ts  # NEW
└── health.ts      # NEW
```

## SDK Integration Pattern

```typescript
// Example: fetch command
import {
  parseReference,
  resolveReference,
  CacheManager,
  createCacheManager,
  StorageManager,
  createStorageManager,
} from '@fractary/codex';

export async function fetchDocument(uri: string, options: FetchOptions) {
  // Parse URI
  const parsed = parseReference(uri);
  if (!parsed) {
    throw new Error(`Invalid codex URI: ${uri}`);
  }

  // Get managers
  const cache = await createCacheManager();
  const storage = await createStorageManager();

  // Check cache first (unless bypassed)
  if (!options.bypassCache) {
    const cached = await cache.get(uri);
    if (cached && !options.ttl) {
      return cached;
    }
  }

  // Fetch from storage
  const content = await storage.fetch(parsed);

  // Update cache
  await cache.set(uri, content, { ttl: options.ttl });

  return content;
}
```

## Configuration Changes

### Old Config (v2.0)
```json
{
  "organizationSlug": "fractary",
  "directories": { "source": ".fractary", "target": ".fractary" },
  "rules": { "preventSelfSync": true, "autoSyncPatterns": [] }
}
```

### New Config (v3.0)
```json
{
  "version": "3.0",
  "organization": "fractary",
  "cache": {
    "directory": ".fractary/plugins/codex/cache",
    "defaultTtl": "24h",
    "maxSize": "100MB"
  },
  "storage": {
    "providers": {
      "github": { "token": "${GITHUB_TOKEN}" }
    }
  },
  "types": {
    "custom": []
  },
  "sync": {
    "environments": {
      "dev": "develop",
      "prod": "main"
    }
  },
  "mcp": {
    "enabled": false
  }
}
```

## Success Criteria

1. All v3.0 CLI commands implemented and functional
2. Old v2.0 commands removed or migrated
3. `codex fetch` retrieves documents in <100ms from cache
4. `codex sync` supports bidirectional sync with dry-run
5. `codex cache` provides full cache management
6. `codex types` supports custom type registration
7. `codex health` detects and optionally fixes issues
8. All commands support `--json` output for scripting
9. Migration path from v2.0 configs documented

## Dependencies

- `@fractary/codex@^0.2.0` (or latest with v3.0 features)
- Update `package.json` dependency version

## Timeline Estimate

- Phase 1: Foundation - Core fetch and cache commands
- Phase 2: Sync & Types - Full sync and type management
- Phase 3: Polish - Health, migration, documentation

## Open Questions

1. Should we keep any v2.0 commands for backwards compatibility?
2. What's the migration path for existing v2.0 users?
3. Should MCP registration be automatic or opt-in?
