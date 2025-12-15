# Codex CLI Usage Guide

Complete guide to using `fractary codex` commands for centralized knowledge management.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init)
  - [fetch](#fetch)
  - [cache](#cache)
  - [sync](#sync)
  - [types](#types)
  - [health](#health)
  - [migrate](#migrate)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [JSON Output](#json-output)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Overview

The Fractary Codex CLI provides commands for managing organizational knowledge through:

- **Universal References**: Use `codex://` URIs to reference documents across projects
- **Intelligent Caching**: Multi-tier caching with TTL-based expiration
- **Bidirectional Sync**: Keep documentation synchronized across repositories
- **Type Registry**: Manage different artifact types with custom cache policies
- **Health Diagnostics**: Detect and auto-repair configuration issues

## Installation

```bash
# Install globally
npm install -g @fractary/cli

# Or use with npx
npx @fractary/cli codex --help

# Verify installation
fractary codex --version
```

## Quick Start

### 1. Initialize Codex in Your Project

```bash
cd /path/to/your/project
fractary codex init --org myorg
```

This creates:
- `.fractary/plugins/codex/config.json` - Configuration file
- `.fractary/plugins/codex/cache/` - Cache directory

### 2. Fetch a Document

```bash
# Fetch using codex:// URI
fractary codex fetch codex://fractary/codex/docs/api.md

# Save to file
fractary codex fetch codex://fractary/codex/specs/SPEC-0001.md --output spec.md

# Get JSON output with metadata
fractary codex fetch codex://fractary/codex/README.md --json
```

### 3. Manage Cache

```bash
# View cache statistics
fractary codex cache stats

# List cache entries
fractary codex cache list

# Clear expired entries
fractary codex cache clear --expired

# Clear all cache
fractary codex cache clear --all
```

### 4. Synchronize Files

```bash
# Dry run to preview changes
fractary codex sync project --dry-run

# Sync to codex repository
fractary codex sync project --direction to-codex

# Sync from codex to local
fractary codex sync project --direction from-codex

# Bidirectional sync
fractary codex sync project --direction bidirectional
```

## Commands

### init

Initialize Codex configuration in your project.

**Usage:**
```bash
fractary codex init [options]
```

**Options:**
- `--org <name>` - Organization slug (e.g., 'fractary')
- `--codex <repo>` - Codex repository name (default: 'codex')
- `--force` - Overwrite existing configuration

**Examples:**
```bash
# Initialize with organization name
fractary codex init --org mycompany

# Force re-initialization
fractary codex init --org mycompany --force

# Specify custom codex repository
fractary codex init --org mycompany --codex knowledge-base
```

**What it creates:**
```
.fractary/
└── plugins/
    └── codex/
        ├── config.json        # Configuration
        └── cache/             # Cache directory
            └── index.json     # Cache index
```

---

### fetch

Fetch documents by `codex://` URI reference.

**Usage:**
```bash
fractary codex fetch <uri> [options]
```

**Arguments:**
- `<uri>` - Codex URI (e.g., `codex://org/project/docs/file.md`)

**Options:**
- `--bypass-cache` - Skip cache and fetch directly from source
- `--ttl <seconds>` - Override default TTL (in seconds)
- `--json` - Output as JSON with metadata
- `--output <file>` - Write content to file instead of stdout

**Examples:**
```bash
# Basic fetch (uses cache if available)
fractary codex fetch codex://fractary/codex/docs/api.md

# Force fresh fetch
fractary codex fetch codex://fractary/codex/docs/api.md --bypass-cache

# Custom TTL (cache for 1 hour = 3600 seconds)
fractary codex fetch codex://fractary/codex/specs/SPEC-0001.md --ttl 3600

# Save to file
fractary codex fetch codex://fractary/faber/README.md --output faber-readme.md

# JSON output with metadata
fractary codex fetch codex://fractary/codex/docs/guide.md --json
```

**JSON Output Example:**
```json
{
  "uri": "codex://fractary/codex/docs/api.md",
  "content": "# API Documentation\n...",
  "metadata": {
    "fromCache": true,
    "fetchedAt": "2025-12-14T10:30:00.000Z",
    "expiresAt": "2025-12-15T10:30:00.000Z",
    "contentLength": 15420,
    "contentHash": "a3f2b8c1d4e5f6g7"
  }
}
```

---

### cache

Manage the local document cache.

**Subcommands:**
- `list` - Show cache information
- `stats` - Display detailed cache statistics
- `clear` - Clear cache entries

#### cache list

List cache information and overview.

**Usage:**
```bash
fractary codex cache list [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```bash
# View cache overview
fractary codex cache list

# JSON output
fractary codex cache list --json
```

**Output:**
```
Cache Overview

Entries:
  Total:    45 entries
  Fresh:    32 entries
  Stale:    8 entries
  Expired:  5 entries

Storage:
  Total size: 2.4 MB

Cache health: 71% fresh
```

#### cache stats

Display detailed cache statistics.

**Usage:**
```bash
fractary codex cache stats [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```bash
# View statistics
fractary codex cache stats

# JSON output for scripting
fractary codex cache stats --json
```

**Output:**
```
Cache Statistics

Size:
  Total:   2.4 MB
  Memory:  512 KB (L1)
  Disk:    1.9 MB (L2)

Entries:
  Total:    45
  Fresh:    32 (71%)
  Stale:    8 (18%)
  Expired:  5 (11%)

Performance:
  Hits:     324
  Misses:   12
  Hit rate: 96.4%

By Type:
  docs:  28 entries (1.2 MB)
  specs: 12 entries (800 KB)
  logs:  5 entries (400 KB)
```

#### cache clear

Clear cache entries.

**Usage:**
```bash
fractary codex cache clear [options]
```

**Options:**
- `--all` - Clear all cache entries
- `--expired` - Clear only expired entries
- `--pattern <glob>` - Clear entries matching pattern

**Examples:**
```bash
# Clear expired entries only
fractary codex cache clear --expired

# Clear all cache
fractary codex cache clear --all

# Clear specific pattern
fractary codex cache clear --pattern "codex://fractary/codex/docs/*"
```

---

### sync

Synchronize files bidirectionally with codex repository.

**Subcommands:**
- `project` - Sync single project
- `org` - Sync all projects in organization

#### sync project

Synchronize a single project with the codex repository.

**Usage:**
```bash
fractary codex sync project [name] [options]
```

**Arguments:**
- `[name]` - Project name (auto-detected from git if not provided)

**Options:**
- `--env <env>` - Target environment (`dev`, `test`, `staging`, `prod`) - default: `prod`
- `--dry-run` - Show what would sync without executing
- `--direction <dir>` - Sync direction: `to-codex`, `from-codex`, `bidirectional` - default: `bidirectional`
- `--include <pattern>` - Include files matching pattern (can be used multiple times)
- `--exclude <pattern>` - Exclude files matching pattern (can be used multiple times)
- `--force` - Force sync without checking timestamps
- `--json` - Output as JSON

**Examples:**
```bash
# Dry run to preview changes
fractary codex sync project --dry-run

# Sync current project to codex
fractary codex sync project --direction to-codex

# Sync from codex to local
fractary codex sync project --direction from-codex

# Bidirectional sync with custom environment
fractary codex sync project --env staging --direction bidirectional

# Sync specific project by name
fractary codex sync project my-api --direction to-codex

# Custom include/exclude patterns
fractary codex sync project \
  --include "docs/**/*.md" \
  --include "specs/**/*.md" \
  --exclude "**/*-draft.md"

# Force sync (ignore timestamps)
fractary codex sync project --force

# JSON output for automation
fractary codex sync project --json
```

**Output:**
```
Sync Plan

  Project:      my-api
  Organization: fractary
  Environment:  prod (main)
  Direction:    bidirectional
  Files:        23
  Total size:   1.2 MB
  Est. time:    2.3s

Syncing...

✓ Sync completed successfully
  Synced: 23 files
  Skipped: 5 files
  Duration: 2.1s
```

#### sync org

Synchronize all projects in an organization with the codex repository.

**Usage:**
```bash
fractary codex sync org [options]
```

**Options:**
- `--env <env>` - Target environment (default: `prod`)
- `--dry-run` - Show what would sync without executing
- `--direction <dir>` - Sync direction (default: `bidirectional`)
- `--exclude <pattern>` - Exclude repositories matching pattern
- `--parallel <n>` - Number of parallel sync operations (default: 3)
- `--json` - Output as JSON

**Examples:**
```bash
# Dry run for all projects
fractary codex sync org --dry-run

# Sync all projects
fractary codex sync org --direction bidirectional

# Exclude specific projects
fractary codex sync org --exclude "test-*" --exclude "*-archive"

# Parallel sync with 5 concurrent operations
fractary codex sync org --parallel 5

# JSON output
fractary codex sync org --json
```

**Output:**
```
Organization Sync

  Organization: fractary
  Environment:  prod (main)
  Direction:    bidirectional
  Projects:     12
  Parallel:     3

Syncing projects...

✓ my-api (15 files)
✓ web-app (32 files)
✓ mobile-app (28 files)
...

Summary:
  Total projects: 12
  Synced: 11
  Failed: 1
  Total files: 234
  Duration: 18.5s
```

---

### types

Manage artifact type registry.

**Subcommands:**
- `list` - List all types (built-in and custom)
- `show <name>` - Show details for a specific type
- `add <name>` - Add a custom artifact type
- `remove <name>` - Remove a custom artifact type

#### types list

List all artifact types.

**Usage:**
```bash
fractary codex types list [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```bash
# List all types
fractary codex types list

# JSON output
fractary codex types list --json
```

**Output:**
```
Artifact Types

Built-in Types:
  docs        Documentation files (docs/**/*.md) - TTL: 24h
  specs       Specification documents (specs/**/*.md) - TTL: 7d
  logs        Session logs (logs/**/*.md) - TTL: 30d
  guides      User guides (guides/**/*.md) - TTL: 7d
  standards   Standards and policies (standards/**/*.md) - TTL: 7d

Custom Types:
  schemas     JSON schemas (schemas/**/*.json) - TTL: 7d
  configs     Configuration files (configs/**/*.{yaml,json}) - TTL: 1d
```

#### types show

Show details for a specific type.

**Usage:**
```bash
fractary codex types show <name>
```

**Examples:**
```bash
# Show docs type details
fractary codex types show docs

# Show custom type
fractary codex types show schemas
```

**Output:**
```
Type: docs

  Pattern: docs/**/*.md
  TTL:     24 hours
  Source:  built-in
  Description: Documentation files
```

#### types add

Add a custom artifact type.

**Usage:**
```bash
fractary codex types add <name> --pattern <glob> [options]
```

**Arguments:**
- `<name>` - Type name (e.g., 'schemas', 'configs')

**Options:**
- `--pattern <glob>` - File pattern (required)
- `--ttl <duration>` - Cache TTL (e.g., '24h', '7d', '30d')
- `--description <text>` - Type description

**Examples:**
```bash
# Add schemas type
fractary codex types add schemas \
  --pattern "schemas/**/*.json" \
  --ttl 7d \
  --description "JSON Schema definitions"

# Add configs type
fractary codex types add configs \
  --pattern "configs/**/*.{yaml,json}" \
  --ttl 1d

# Add playbooks type
fractary codex types add playbooks \
  --pattern "playbooks/**/*.md" \
  --ttl 3d \
  --description "Operational playbooks and runbooks"
```

#### types remove

Remove a custom artifact type.

**Usage:**
```bash
fractary codex types remove <name>
```

**Examples:**
```bash
# Remove custom type
fractary codex types remove schemas

# Remove with confirmation
fractary codex types remove configs
```

---

### health

Run health diagnostics and optionally auto-repair issues.

**Usage:**
```bash
fractary codex health [options]
```

**Options:**
- `--fix` - Attempt to auto-repair detected issues
- `--json` - Output as JSON

**Examples:**
```bash
# Run health check
fractary codex health

# Auto-repair issues
fractary codex health --fix

# JSON output
fractary codex health --json
```

**Output:**
```
Codex Health Check

Configuration:
  ✓ Config file exists
  ✓ Valid JSON format
  ✓ Organization set: fractary
  ✓ Cache directory configured

Cache:
  ✓ Cache directory exists
  ✓ Cache index valid
  ✓ No corrupted entries
  ⚠ 5 expired entries (run: fractary codex cache clear --expired)

Storage:
  ✓ GitHub provider configured
  ⚠ GITHUB_TOKEN environment variable not set

Type Registry:
  ✓ Built-in types loaded
  ✓ 2 custom types registered

Summary: 8 checks passed, 2 warnings
```

**With --fix:**
```
Codex Health Check

...

Auto-Repair:
  ✓ Cleared 5 expired cache entries
  ✓ Recreated missing cache index
  ⚠ Cannot auto-fix: GITHUB_TOKEN not set (manual action required)

Summary: 2 issues fixed, 1 requires manual action
```

---

### migrate

Migrate from Codex v2.0 to v3.0 configuration format.

**Usage:**
```bash
fractary codex migrate [options]
```

**Options:**
- `--dry-run` - Show what would be migrated without executing
- `--backup` - Create backup of old config (default: true)
- `--force` - Overwrite existing v3.0 config

**Examples:**
```bash
# Preview migration
fractary codex migrate --dry-run

# Execute migration with backup
fractary codex migrate

# Force migration without backup
fractary codex migrate --force --no-backup
```

**Output:**
```
Codex Configuration Migration (v2.0 → v3.0)

Current Config (v2.0):
  Location: .fractary/codex.config.json
  Organization: fractary
  Sync rules: 3 patterns

Migration Plan:
  ✓ Convert sync patterns to artifact types
  ✓ Update directory structure
  ✓ Add cache configuration
  ✓ Add MCP configuration (disabled by default)
  ✓ Preserve custom settings

New Config (v3.0):
  Location: .fractary/plugins/codex/config.json

Creating backup: .fractary/codex.config.json.backup

✓ Migration completed successfully
```

## Configuration

Configuration file: `.fractary/plugins/codex/config.json`

**Example Configuration:**
```json
{
  "version": "3.0",
  "organization": "fractary",
  "codexRepo": "codex",
  "cache": {
    "directory": ".fractary/plugins/codex/cache",
    "defaultTtl": "24h",
    "maxSize": "100MB"
  },
  "storage": {
    "providers": {
      "github": {
        "token": "${GITHUB_TOKEN}"
      },
      "local": {
        "baseDir": "./knowledge"
      }
    }
  },
  "types": {
    "custom": [
      {
        "name": "schemas",
        "pattern": "schemas/**/*.json",
        "ttl": "7d"
      }
    ]
  },
  "sync": {
    "include": [
      "docs/**/*.md",
      "specs/**/*.md",
      ".fractary/standards/**",
      ".fractary/templates/**"
    ],
    "exclude": [
      "**/*-draft.md",
      "**/node_modules/**"
    ],
    "environments": {
      "dev": "develop",
      "test": "test",
      "staging": "staging",
      "prod": "main"
    }
  },
  "mcp": {
    "enabled": false
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token for repository access | - |
| `CODEX_ORG` | Override organization from config | From config |
| `CODEX_CACHE_DIR` | Override cache directory | `.fractary/plugins/codex/cache` |
| `CODEX_CONFIG_PATH` | Custom config file path | `.fractary/plugins/codex/config.json` |

**Example:**
```bash
# Set GitHub token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# Override organization
export CODEX_ORG="mycompany"

# Custom cache location
export CODEX_CACHE_DIR="/tmp/codex-cache"

# Run command
fractary codex fetch codex://mycompany/project/docs/api.md
```

## JSON Output

All commands support `--json` flag for programmatic usage.

**Benefits:**
- Machine-readable output
- Easy integration with scripts and tools
- Consistent structure across commands

**Example Script:**
```bash
#!/bin/bash

# Fetch document and parse JSON
RESULT=$(fractary codex fetch codex://fractary/codex/README.md --json)

# Extract content
CONTENT=$(echo "$RESULT" | jq -r '.content')

# Check if from cache
FROM_CACHE=$(echo "$RESULT" | jq -r '.metadata.fromCache')

if [ "$FROM_CACHE" = "true" ]; then
  echo "Retrieved from cache"
else
  echo "Fetched from storage"
fi
```

## Common Workflows

### Workflow 1: Setting Up a New Project

```bash
# 1. Initialize codex
cd /path/to/project
fractary codex init --org mycompany

# 2. Set GitHub token
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# 3. Fetch shared documentation
fractary codex fetch codex://mycompany/codex/standards/code-review.md \
  --output .fractary/standards/code-review.md

# 4. Verify cache
fractary codex cache stats
```

### Workflow 2: Regular Documentation Sync

```bash
# 1. Preview changes
fractary codex sync project --dry-run

# 2. Review the plan
# ... check output ...

# 3. Execute sync
fractary codex sync project --direction bidirectional

# 4. Verify results
fractary codex cache list
```

### Workflow 3: Cache Maintenance

```bash
# 1. Check cache health
fractary codex health

# 2. View statistics
fractary codex cache stats

# 3. Clear expired entries
fractary codex cache clear --expired

# 4. Verify cleanup
fractary codex cache list
```

### Workflow 4: CI/CD Integration

```bash
#!/bin/bash
# .github/workflows/codex-sync.yml

# Install CLI
npm install -g @fractary/cli

# Initialize if needed
if [ ! -f ".fractary/plugins/codex/config.json" ]; then
  fractary codex init --org $ORG_SLUG
fi

# Sync documentation to codex
fractary codex sync project --direction to-codex --json > sync-result.json

# Check for errors
if ! jq -e '.result.success' sync-result.json > /dev/null; then
  echo "Sync failed"
  exit 1
fi

echo "Synced $(jq -r '.result.synced' sync-result.json) files"
```

## Troubleshooting

### Common Issues

#### 1. "Failed to load configuration"

**Problem:** Config file not found or invalid.

**Solution:**
```bash
# Check if config exists
ls .fractary/plugins/codex/config.json

# If missing, initialize
fractary codex init --org myorg

# If exists but invalid, validate
fractary codex health
```

#### 2. "GITHUB_TOKEN environment variable not set"

**Problem:** GitHub provider requires authentication.

**Solution:**
```bash
# Set token for current session
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# Set token permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"' >> ~/.bashrc
```

#### 3. "Document not found" or "404"

**Problem:** Document doesn't exist or access denied.

**Solution:**
```bash
# Verify URI format
fractary codex fetch codex://org/project/path/to/file.md

# Check permissions (GitHub token has access)

# Try bypassing cache
fractary codex fetch codex://org/project/file.md --bypass-cache
```

#### 4. "Cache is corrupted"

**Problem:** Cache index is invalid or corrupted.

**Solution:**
```bash
# Run health check
fractary codex health --fix

# If still broken, clear cache
fractary codex cache clear --all

# Re-fetch documents
fractary codex fetch codex://org/project/file.md
```

#### 5. "Sync conflicts detected"

**Problem:** Local and remote versions have diverged.

**Solution:**
```bash
# View conflicts
fractary codex sync project --dry-run

# Force sync from codex (overwrites local)
fractary codex sync project --direction from-codex --force

# Or force sync to codex (overwrites remote)
fractary codex sync project --direction to-codex --force
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
DEBUG=fractary:* fractary codex fetch codex://org/project/file.md

# Or use node debug
NODE_DEBUG=* fractary codex sync project
```

### Getting Help

```bash
# Command help
fractary codex --help
fractary codex fetch --help
fractary codex sync --help

# Check version
fractary codex --version

# Report issues
# https://github.com/fractary/cli/issues
```

---

**Next Steps:**
- [Integration Guide](./integration-guide.md) - Integrate codex into your projects
- [Migration Guide](./migration-guide.md) - Migrate from v2.0 to v3.0
- [API Reference](../../codex/docs/guides/api-reference.md) - SDK API documentation
