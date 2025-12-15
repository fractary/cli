# Codex Migration Guide: v2.0 → v3.0

Complete guide for migrating from Codex v2.0 (push-based sync) to v3.0 (pull-based retrieval with intelligent caching).

## Table of Contents

- [Overview](#overview)
- [What Changed](#what-changed)
- [Migration Steps](#migration-steps)
- [Configuration Changes](#configuration-changes)
- [Command Changes](#command-changes)
- [Breaking Changes](#breaking-changes)
- [Migration Tool](#migration-tool)
- [Rollback Plan](#rollback-plan)
- [FAQ](#faq)

## Overview

Codex v3.0 represents a fundamental architectural shift:

**v2.0 (Old):** Push-based synchronization with frontmatter metadata
- Documents had sync rules in frontmatter
- Sync was initiated from projects → codex
- Complex routing logic based on patterns

**v3.0 (New):** Pull-based retrieval with universal references
- Documents referenced via `codex://` URIs
- Intelligent caching with TTL-based expiration
- Simplified sync model
- MCP integration for AI agents

## What Changed

### Architecture

| Aspect | v2.0 | v3.0 |
|--------|------|------|
| **Model** | Push-based sync | Pull-based retrieval |
| **References** | File paths | `codex://` URIs |
| **Metadata** | YAML frontmatter | Type registry |
| **Caching** | Basic file cache | Multi-tier intelligent cache |
| **Sync** | Complex routing | Simple bidirectional |
| **Config Location** | `.fractary/codex.config.json` | `.fractary/plugins/codex/config.json` |

### Commands

| v2.0 Command | v3.0 Replacement | Status |
|--------------|------------------|--------|
| `codex validate` | Deprecated | Removed |
| `codex parse` | Deprecated | Removed |
| `codex route` | `codex sync --dry-run` | Replaced |
| `codex list` | `codex cache list` | Replaced |
| `codex check` | `codex health` | Replaced |
| `codex config` | `codex health` / `config.json` | Changed |
| - | `codex fetch` | **New** |
| - | `codex cache` | **New** |
| - | `codex sync` | **New** |
| - | `codex types` | **New** |
| - | `codex health` | **New** |
| - | `codex migrate` | **New** |

### Configuration Format

**v2.0:**
```json
{
  "organizationSlug": "fractary",
  "directories": {
    "source": ".fractary",
    "target": ".fractary"
  },
  "rules": {
    "preventSelfSync": true,
    "allowProjectOverrides": true,
    "autoSyncPatterns": []
  }
}
```

**v3.0:**
```json
{
  "version": "3.0",
  "organization": "fractary",
  "cache": {
    "directory": ".fractary/plugins/codex/cache",
    "defaultTtl": "24h"
  },
  "storage": {
    "providers": {
      "github": { "token": "${GITHUB_TOKEN}" }
    }
  },
  "sync": {
    "include": ["docs/**/*.md", "specs/**/*.md"],
    "exclude": ["**/*-draft.md"]
  },
  "types": {
    "custom": []
  }
}
```

## Migration Steps

### Step 1: Backup Current Configuration

```bash
# Backup v2.0 config
cp .fractary/codex.config.json .fractary/codex.config.json.backup

# Backup existing documentation (if applicable)
tar -czf codex-docs-backup-$(date +%Y%m%d).tar.gz docs/ specs/
```

### Step 2: Update Fractary CLI

```bash
# Check current version
fractary --version

# Update to latest version
npm update -g @fractary/cli

# Verify v3.0 features available
fractary codex --help
# Should show: fetch, cache, sync, types, health, migrate
```

### Step 3: Run Migration Tool

```bash
# Preview migration (dry run)
fractary codex migrate --dry-run

# Review the migration plan
# ...

# Execute migration
fractary codex migrate

# Backup is created automatically at:
# .fractary/codex.config.json.backup
```

**Migration Output:**
```
Codex Configuration Migration (v2.0 → v3.0)

Current Config (v2.0):
  Location: .fractary/codex.config.json
  Organization: fractary
  Sync rules: 3 patterns

Migration Plan:
  ✓ Convert organization slug
  ✓ Convert sync patterns to include/exclude
  ✓ Add cache configuration
  ✓ Add storage providers
  ✓ Add type registry
  ✓ Update directory structure
  ✓ Preserve custom settings

New Config (v3.0):
  Location: .fractary/plugins/codex/config.json

Creating backup: .fractary/codex.config.json.backup

✓ Migration completed successfully

Next Steps:
  1. Review new config: .fractary/plugins/codex/config.json
  2. Set GITHUB_TOKEN environment variable
  3. Test with: fractary codex health
  4. Fetch a document: fractary codex fetch codex://org/project/file.md
```

### Step 4: Update Environment

```bash
# Set GitHub token (required for v3.0)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# Add to your shell profile for persistence
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"' >> ~/.bashrc
```

### Step 5: Verify Migration

```bash
# Run health check
fractary codex health

# Should show:
# ✓ Config file exists
# ✓ Valid JSON format
# ✓ Organization set
# ✓ Cache directory configured
# ✓ Storage providers configured
```

### Step 6: Test New Functionality

```bash
# Test fetch (core v3.0 feature)
fractary codex fetch codex://fractary/codex/README.md

# Test cache
fractary codex cache list

# Test sync (dry run first)
fractary codex sync project --dry-run

# If dry run looks good, execute
fractary codex sync project
```

### Step 7: Update Scripts and CI/CD

Update any scripts that use old commands:

**Old (v2.0):**
```bash
# Validate metadata
fractary codex validate docs/

# Check routing
fractary codex route docs/api-guide.md

# List files
fractary codex list --system api-gateway
```

**New (v3.0):**
```bash
# Health check (replaces validate)
fractary codex health

# Sync preview (replaces route)
fractary codex sync project --dry-run

# Cache list (replaces list)
fractary codex cache list
```

## Configuration Changes

### Detailed Mapping

#### Organization

**v2.0:**
```json
{
  "organizationSlug": "fractary"
}
```

**v3.0:**
```json
{
  "organization": "fractary"
}
```

#### Directories

**v2.0:**
```json
{
  "directories": {
    "source": ".fractary",
    "target": ".fractary",
    "systems": ".fractary/systems"
  }
}
```

**v3.0:**
```json
{
  "cache": {
    "directory": ".fractary/plugins/codex/cache"
  }
}
```

#### Sync Rules

**v2.0:**
```json
{
  "rules": {
    "preventSelfSync": true,
    "preventCodexSync": true,
    "allowProjectOverrides": true,
    "autoSyncPatterns": [
      {
        "pattern": "docs/**/*.md",
        "include": ["*"],
        "exclude": []
      }
    ]
  }
}
```

**v3.0:**
```json
{
  "sync": {
    "include": [
      "docs/**/*.md",
      "specs/**/*.md"
    ],
    "exclude": [
      "**/*-draft.md",
      "**/node_modules/**"
    ],
    "environments": {
      "dev": "develop",
      "prod": "main"
    }
  }
}
```

#### Storage Providers

**v3.0 Only (New):**
```json
{
  "storage": {
    "providers": {
      "github": {
        "token": "${GITHUB_TOKEN}"
      },
      "local": {
        "baseDir": "./knowledge"
      }
    }
  }
}
```

#### Type Registry

**v3.0 Only (New):**
```json
{
  "types": {
    "custom": [
      {
        "name": "schemas",
        "pattern": "schemas/**/*.json",
        "ttl": "7d"
      }
    ]
  }
}
```

## Command Changes

### Removed Commands

#### `codex validate`

**Purpose:** Validate frontmatter metadata

**Replacement:** Use `codex health` for configuration validation

**Migration:**
```bash
# Old
fractary codex validate docs/ --strict

# New
fractary codex health
```

#### `codex parse`

**Purpose:** Parse and display frontmatter

**Replacement:** No direct replacement (frontmatter no longer used)

**Migration:** Use `codex fetch` to retrieve documents

```bash
# Old
fractary codex parse docs/api-guide.md

# New
fractary codex fetch codex://fractary/project/docs/api-guide.md --json
```

#### `codex route`

**Purpose:** Show routing decisions

**Replacement:** Use `codex sync --dry-run`

**Migration:**
```bash
# Old
fractary codex route docs/api-guide.md --repos api-gateway,web-app

# New
fractary codex sync project --dry-run
```

#### `codex list`

**Purpose:** List files with metadata

**Replacement:** Use `codex cache list`

**Migration:**
```bash
# Old
fractary codex list --system api-gateway

# New
fractary codex cache list
```

#### `codex check`

**Purpose:** Check sync status

**Replacement:** Use `codex health` and `codex sync --dry-run`

**Migration:**
```bash
# Old
fractary codex check

# New
fractary codex health
fractary codex sync project --dry-run
```

### New Commands

#### `codex fetch`

Fetch documents by URI (core v3.0 feature):

```bash
# Basic usage
fractary codex fetch codex://org/project/docs/file.md

# With options
fractary codex fetch codex://org/project/file.md \
  --bypass-cache \
  --output local-file.md \
  --json
```

#### `codex cache`

Manage intelligent cache:

```bash
# List cache
fractary codex cache list

# View statistics
fractary codex cache stats

# Clear expired
fractary codex cache clear --expired

# Clear all
fractary codex cache clear --all
```

#### `codex sync`

Bidirectional synchronization:

```bash
# Sync project
fractary codex sync project --dry-run
fractary codex sync project --direction bidirectional

# Sync organization
fractary codex sync org --parallel 5
```

#### `codex types`

Manage artifact type registry:

```bash
# List types
fractary codex types list

# Add custom type
fractary codex types add schemas \
  --pattern "schemas/**/*.json" \
  --ttl 7d

# Remove type
fractary codex types remove schemas
```

#### `codex health`

Diagnostic and auto-repair:

```bash
# Run diagnostics
fractary codex health

# Auto-repair issues
fractary codex health --fix
```

## Breaking Changes

### 1. Frontmatter Metadata No Longer Used

**Impact:** Documents with `codex_sync_include` / `codex_sync_exclude` frontmatter will be ignored.

**Migration:** Remove frontmatter, configure patterns in `config.json`:

**Before:**
```markdown
---
org: fractary
system: api-gateway
codex_sync_include: ["api-*", "core-*"]
codex_sync_exclude: ["*-test"]
---

# API Guide
...
```

**After:**
```markdown
# API Guide
...
```

**config.json:**
```json
{
  "sync": {
    "include": ["docs/**/*.md", "specs/**/*.md"]
  }
}
```

### 2. Configuration Location Changed

**Impact:** Config file moved from `.fractary/codex.config.json` to `.fractary/plugins/codex/config.json`

**Migration:** Use `fractary codex migrate` to automatically move and convert.

### 3. Sync Model Changed

**Impact:** Push-based patterns no longer work the same way.

**Migration:**
- Replace pattern-based routing with simple include/exclude
- Use bidirectional sync instead of one-way push
- Test with `--dry-run` first

### 4. Cache Location Changed

**Impact:** Cache moved to `.fractary/plugins/codex/cache/`

**Migration:** Old cache will be ignored, new cache built on first fetch.

### 5. API Changes (SDK)

**Impact:** If using SDK directly, imports and APIs changed.

**Migration:** See SDK changelog and update imports:

```typescript
// Old (v2.0)
import { parseMetadata, validateMetadata } from '@fractary/codex'

// New (v3.0)
import { parseReference, CodexClient } from '@fractary/codex'
```

## Migration Tool

### Automatic Migration

The `fractary codex migrate` command handles most migration automatically:

```bash
# Dry run to preview
fractary codex migrate --dry-run

# Execute migration
fractary codex migrate

# Skip backup (not recommended)
fractary codex migrate --no-backup

# Force overwrite existing v3.0 config
fractary codex migrate --force
```

### Manual Migration

If automatic migration fails, migrate manually:

1. **Create new config:**
```bash
fractary codex init --org your-org
```

2. **Copy settings from old config:**
```bash
# Edit new config
vim .fractary/plugins/codex/config.json

# Reference old config
cat .fractary/codex.config.json.backup
```

3. **Update sync patterns:**
```json
{
  "sync": {
    "include": [
      // Add patterns from old autoSyncPatterns
    ],
    "exclude": [
      // Add exclusion patterns
    ]
  }
}
```

4. **Add storage providers:**
```json
{
  "storage": {
    "providers": {
      "github": {
        "token": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

5. **Verify:**
```bash
fractary codex health
```

## Rollback Plan

If migration fails or issues arise:

### Step 1: Restore Old Config

```bash
# Restore v2.0 config
cp .fractary/codex.config.json.backup .fractary/codex.config.json

# Remove v3.0 config
rm .fractary/plugins/codex/config.json
```

### Step 2: Downgrade CLI

```bash
# Uninstall current version
npm uninstall -g @fractary/cli

# Install v2.0 (if available)
npm install -g @fractary/cli@2.x
```

### Step 3: Verify Old Commands Work

```bash
# Test v2.0 commands
fractary codex validate docs/
fractary codex list
```

### Step 4: Report Issue

```bash
# Create detailed issue report
# Include:
# - Migration output
# - Error messages
# - Configuration files (without secrets)
# - CLI version: fractary --version
```

## FAQ

### Q: Do I have to migrate immediately?

**A:** No, but v2.0 commands are deprecated and will be removed in a future version. Migrate when convenient, but plan for it.

### Q: Will my old documentation break?

**A:** No, markdown files are unchanged. Only the config format and CLI commands change.

### Q: Can I use v2.0 and v3.0 simultaneously?

**A:** No, they use different config formats and incompatible models. Choose one.

### Q: What happens to my old cache?

**A:** Old cache is ignored. New cache is built from scratch as you fetch documents.

### Q: Do I need to update all my scripts?

**A:** Yes, update any scripts using deprecated commands (`validate`, `parse`, `route`, `list`, `check`).

### Q: What if migration fails?

**A:** Use the rollback plan above and report an issue with details.

### Q: How do I migrate CI/CD pipelines?

**A:** Update workflows to use new commands:
- Replace `validate` with `health`
- Replace `route` with `sync --dry-run`
- Add `GITHUB_TOKEN` environment variable

### Q: Can I keep my frontmatter metadata?

**A:** Yes, but it won't be used for sync routing. Harmless to keep for documentation purposes.

### Q: What about custom sync patterns?

**A:** Convert to include/exclude patterns in `config.json`:

```json
{
  "sync": {
    "include": ["docs/**/*.md"],
    "exclude": ["**/*-draft.md"]
  }
}
```

### Q: How do I reference documents now?

**A:** Use `codex://` URIs instead of file paths:

```bash
# Old
docs/api-guide.md

# New
codex://fractary/project/docs/api-guide.md
```

### Q: Is the migration reversible?

**A:** Yes, backups are created automatically. See [Rollback Plan](#rollback-plan).

### Q: Where can I get help?

**A:**
- Documentation: `/docs/codex/`
- Issues: https://github.com/fractary/cli/issues
- Discussions: https://github.com/fractary/cli/discussions

---

**Related Documentation:**
- [Usage Guide](./usage-guide.md) - Complete v3.0 command reference
- [Integration Guide](./integration-guide.md) - Integrate codex into projects
- [Troubleshooting](../../codex/docs/guides/troubleshooting.md) - Common issues and solutions
