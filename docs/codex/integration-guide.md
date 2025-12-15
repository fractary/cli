# Codex Integration Guide for External Projects

Guide for integrating Fractary Codex into external projects and systems, including Claude Code plugins, CI/CD pipelines, and automation tools.

## Table of Contents

- [Overview](#overview)
- [Integration Patterns](#integration-patterns)
- [Claude Code Plugin Integration](#claude-code-plugin-integration)
- [CI/CD Integration](#cicd-integration)
- [Programmatic Usage](#programmatic-usage)
- [MCP Server Integration](#mcp-server-integration)
- [Configuration Management](#configuration-management)
- [Best Practices](#best-practices)

## Overview

Fractary Codex provides multiple integration points:

1. **CLI Commands** - Shell integration via `fractary codex` commands
2. **JSON Output** - Machine-readable output for scripting
3. **SDK Integration** - Direct TypeScript/JavaScript integration via `@fractary/codex`
4. **MCP Server** - Model Context Protocol for AI agents
5. **Configuration Files** - Portable config-as-code

This guide focuses on **CLI-based integration** for external projects that want to leverage Codex functionality without deep SDK coupling.

## Integration Patterns

### Pattern 1: Shell Script Integration

Use Codex CLI commands directly in shell scripts.

**Example:**
```bash
#!/bin/bash
# sync-docs.sh - Sync documentation to codex

set -e

# Configuration
ORG="fractary"
PROJECT="my-plugin"

# Ensure codex is initialized
if [ ! -f ".fractary/plugins/codex/config.json" ]; then
  echo "Initializing codex..."
  fractary codex init --org "$ORG"
fi

# Sync documentation
echo "Syncing documentation..."
fractary codex sync project "$PROJECT" --direction to-codex

# Verify cache
echo "Cache status:"
fractary codex cache list

echo "✓ Documentation synced successfully"
```

### Pattern 2: JSON-Based Integration

Parse JSON output for programmatic control.

**Example:**
```bash
#!/bin/bash
# fetch-and-process.sh - Fetch document and process content

# Fetch with JSON output
RESULT=$(fractary codex fetch codex://fractary/codex/specs/SPEC-0001.md --json)

# Extract fields using jq
CONTENT=$(echo "$RESULT" | jq -r '.content')
FROM_CACHE=$(echo "$RESULT" | jq -r '.metadata.fromCache')
HASH=$(echo "$RESULT" | jq -r '.metadata.contentHash')

# Process based on metadata
if [ "$FROM_CACHE" = "true" ]; then
  echo "Using cached version (hash: $HASH)"
else
  echo "Fetched fresh copy (hash: $HASH)"
fi

# Save processed content
echo "$CONTENT" | process-markdown > output.html
```

### Pattern 3: Makefile Integration

Integrate Codex into build workflows.

**Example:**
```makefile
# Makefile

.PHONY: codex-init codex-sync codex-fetch clean

# Initialize codex
codex-init:
	@fractary codex init --org fractary

# Sync documentation
codex-sync:
	@fractary codex sync project --dry-run
	@read -p "Proceed with sync? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		fractary codex sync project; \
	fi

# Fetch shared docs
codex-fetch:
	@mkdir -p docs/shared
	@fractary codex fetch codex://fractary/codex/standards/code-review.md \
		--output docs/shared/code-review.md
	@fractary codex fetch codex://fractary/codex/standards/testing.md \
		--output docs/shared/testing.md

# Clean cache
clean:
	@fractary codex cache clear --all

# Default target
all: codex-init codex-fetch
```

### Pattern 4: Node.js Integration

Use Codex CLI from Node.js scripts.

**Example:**
```javascript
// sync-codex.js
const { execSync } = require('child_process');

async function syncDocs() {
  try {
    // Check if codex is initialized
    const hasConfig = require('fs').existsSync('.fractary/plugins/codex/config.json');

    if (!hasConfig) {
      console.log('Initializing codex...');
      execSync('fractary codex init --org fractary', { stdio: 'inherit' });
    }

    // Sync with JSON output
    console.log('Syncing documentation...');
    const output = execSync(
      'fractary codex sync project --direction to-codex --json',
      { encoding: 'utf-8' }
    );

    const result = JSON.parse(output);

    if (result.result?.success) {
      console.log(`✓ Synced ${result.result.synced} files`);
      return true;
    } else {
      console.error('Sync failed');
      if (result.result?.errors) {
        result.result.errors.forEach(err => {
          console.error(`  - ${err.path}: ${err.error}`);
        });
      }
      return false;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

syncDocs().then(success => {
  process.exit(success ? 0 : 1);
});
```

## Claude Code Plugin Integration

### Integration for fractary/claude-plugins

Claude Code plugins can use Codex to:
- Fetch shared knowledge and standards
- Sync plugin documentation
- Access organization-wide playbooks
- Retrieve configuration templates

#### Example: Plugin Hook Integration

**File:** `.claude/hooks/session-start.sh`

```bash
#!/bin/bash
# Session start hook - Fetch latest standards

# Fetch code review standards
fractary codex fetch codex://fractary/codex/standards/code-review.md \
  --output .fractary/standards/code-review.md \
  2>/dev/null || true

# Fetch plugin development guide
fractary codex fetch codex://fractary/codex/guides/plugin-development.md \
  --output .fractary/guides/plugin-development.md \
  2>/dev/null || true

# Update cache statistics
fractary codex cache list --json > .fractary/codex-cache-status.json 2>/dev/null || true

exit 0  # Don't fail session if codex fails
```

#### Example: Plugin Agent Integration

**File:** `.claude/agents/doc-sync/agent.yaml`

```yaml
name: doc-sync
description: Synchronize plugin documentation with codex

contexts:
  - path: contexts/codex-sync.md

tasks:
  - name: sync-docs
    prompt: |
      Sync documentation to codex repository using:
      fractary codex sync project --direction to-codex --dry-run

      Review the sync plan and execute if appropriate.

  - name: fetch-standards
    prompt: |
      Fetch latest organizational standards:
      - Code review standards
      - Testing guidelines
      - Documentation templates

      Use: fractary codex fetch codex://fractary/codex/standards/...
```

**File:** `.claude/agents/doc-sync/contexts/codex-sync.md`

```markdown
---
category: specialist
---

# Codex Sync Specialist

You are a specialist in synchronizing documentation with Fractary Codex.

## Available Commands

### Fetch Documents
```bash
fractary codex fetch <uri> [--output <file>]
```

### Sync Project
```bash
# Dry run first
fractary codex sync project --dry-run

# Execute sync
fractary codex sync project --direction to-codex
```

### Manage Cache
```bash
fractary codex cache list
fractary codex cache clear --expired
```

## Best Practices

1. Always run `--dry-run` first
2. Review sync plan before executing
3. Check for conflicts
4. Verify cache health periodically

## Troubleshooting

If sync fails:
1. Check `fractary codex health`
2. Verify GITHUB_TOKEN is set
3. Clear cache if needed: `fractary codex cache clear --all`
```

#### Example: Plugin NPM Scripts

**File:** `package.json`

```json
{
  "name": "@fractary/my-plugin",
  "scripts": {
    "codex:init": "fractary codex init --org fractary",
    "codex:sync": "fractary codex sync project --dry-run",
    "codex:sync:force": "fractary codex sync project",
    "codex:fetch": "npm run codex:fetch:standards && npm run codex:fetch:guides",
    "codex:fetch:standards": "fractary codex fetch codex://fractary/codex/standards/code-review.md --output .fractary/standards/code-review.md",
    "codex:fetch:guides": "fractary codex fetch codex://fractary/codex/guides/plugin-development.md --output .fractary/guides/plugin-development.md",
    "codex:health": "fractary codex health",
    "codex:cache:clear": "fractary codex cache clear --expired",
    "precommit": "npm run codex:sync",
    "postinstall": "npm run codex:init || true"
  }
}
```

#### Example: Plugin Configuration

**File:** `.fractary/plugins/codex/config.json`

```json
{
  "version": "3.0",
  "organization": "fractary",
  "codexRepo": "codex",
  "cache": {
    "directory": ".fractary/plugins/codex/cache",
    "defaultTtl": "24h"
  },
  "storage": {
    "providers": {
      "github": {
        "token": "${GITHUB_TOKEN}"
      }
    }
  },
  "sync": {
    "include": [
      "docs/**/*.md",
      "README.md",
      ".fractary/standards/**",
      ".fractary/guides/**"
    ],
    "exclude": [
      "node_modules/**",
      "**/*-draft.md"
    ]
  }
}
```

## CI/CD Integration

### GitHub Actions

**File:** `.github/workflows/codex-sync.yml`

```yaml
name: Codex Sync

on:
  push:
    branches: [main, develop]
    paths:
      - 'docs/**'
      - 'specs/**'
      - 'README.md'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Fractary CLI
        run: npm install -g @fractary/cli

      - name: Initialize Codex
        run: |
          if [ ! -f ".fractary/plugins/codex/config.json" ]; then
            fractary codex init --org fractary
          fi

      - name: Sync to Codex
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          fractary codex sync project \
            --direction to-codex \
            --json > sync-result.json

      - name: Check Results
        run: |
          # Parse results
          SUCCESS=$(jq -r '.result.success' sync-result.json)
          SYNCED=$(jq -r '.result.synced' sync-result.json)
          FAILED=$(jq -r '.result.failed' sync-result.json)

          echo "Success: $SUCCESS"
          echo "Synced: $SYNCED files"
          echo "Failed: $FAILED files"

          # Fail if sync failed
          if [ "$SUCCESS" != "true" ]; then
            echo "Sync failed!"
            jq -r '.result.errors' sync-result.json
            exit 1
          fi

      - name: Upload Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: codex-sync-result
          path: sync-result.json
```

### GitLab CI

**File:** `.gitlab-ci.yml`

```yaml
stages:
  - sync

codex-sync:
  stage: sync
  image: node:18
  only:
    refs:
      - main
      - develop
    changes:
      - docs/**/*
      - specs/**/*
      - README.md

  before_script:
    - npm install -g @fractary/cli
    - |
      if [ ! -f ".fractary/plugins/codex/config.json" ]; then
        fractary codex init --org fractary
      fi

  script:
    - fractary codex sync project --direction to-codex --json > sync-result.json
    - |
      SUCCESS=$(jq -r '.result.success' sync-result.json)
      if [ "$SUCCESS" != "true" ]; then
        echo "Sync failed!"
        cat sync-result.json
        exit 1
      fi
    - jq -r '.result.synced' sync-result.json | xargs echo "Synced files:"

  artifacts:
    paths:
      - sync-result.json
    expire_in: 7 days
```

### Jenkins Pipeline

**File:** `Jenkinsfile`

```groovy
pipeline {
    agent any

    triggers {
        pollSCM('H/15 * * * *')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @fractary/cli'
                sh '''
                    if [ ! -f ".fractary/plugins/codex/config.json" ]; then
                        fractary codex init --org fractary
                    fi
                '''
            }
        }

        stage('Sync') {
            environment {
                GITHUB_TOKEN = credentials('github-token')
            }
            steps {
                sh 'fractary codex sync project --direction to-codex --json > sync-result.json'
            }
        }

        stage('Verify') {
            steps {
                script {
                    def result = readJSON file: 'sync-result.json'
                    if (!result.result.success) {
                        error("Codex sync failed: ${result.result.errors}")
                    }
                    echo "Synced ${result.result.synced} files"
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'sync-result.json', allowEmptyArchive: true
        }
    }
}
```

## Programmatic Usage

### TypeScript/JavaScript

For more advanced integration, use the SDK directly:

```typescript
import { CodexClient } from '@fractary/codex';

// Create client
const client = await CodexClient.create({
  organization: 'fractary',
  cacheDir: '.codex-cache'
});

// Fetch document
const doc = await client.fetch('codex://fractary/codex/docs/api.md');
console.log(doc.content.toString());

// Sync project
const syncManager = client.createSyncManager();
const result = await syncManager.sync({
  direction: 'to-codex',
  include: ['docs/**/*.md']
});
console.log(`Synced ${result.synced} files`);
```

See [CLI Integration Guide](../../codex/docs/guides/cli-integration.md) in the SDK for full details.

## MCP Server Integration

For AI agents that need access to Codex:

### Start MCP Server

```bash
# Start standalone MCP server
fractary codex mcp start --port 3000

# Or configure in Claude Code MCP settings
```

### Claude Code MCP Configuration

**File:** `.claude/mcp.json`

```json
{
  "servers": {
    "codex": {
      "command": "fractary",
      "args": ["codex", "mcp", "start"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Available MCP Tools

Once configured, AI agents can use:

- `codex_fetch(uri)` - Fetch documents
- `codex_search(query, type?)` - Search documents
- `codex_list(prefix?)` - List documents
- `codex_invalidate(pattern?)` - Invalidate cache

## Configuration Management

### Portable Configuration

Keep configuration in version control:

```bash
# Commit config (without secrets)
git add .fractary/plugins/codex/config.json

# Use environment variables for secrets
# config.json uses: "token": "${GITHUB_TOKEN}"
```

### Multi-Environment Setup

**Development:**
```json
{
  "version": "3.0",
  "organization": "fractary",
  "sync": {
    "environments": {
      "dev": "develop"
    }
  }
}
```

**Production:**
```json
{
  "version": "3.0",
  "organization": "fractary",
  "sync": {
    "environments": {
      "prod": "main"
    }
  }
}
```

### Shared Configuration

Use shared config across projects:

```bash
# Fetch shared config template
fractary codex fetch codex://fractary/codex/templates/codex-config.json \
  --output .fractary/plugins/codex/config.json

# Customize for your project
vim .fractary/plugins/codex/config.json
```

## Best Practices

### 1. Version Control

**DO:**
- ✅ Commit `.fractary/plugins/codex/config.json`
- ✅ Use environment variables for secrets
- ✅ Document setup in README

**DON'T:**
- ❌ Commit cache directory
- ❌ Commit tokens or credentials
- ❌ Commit `.codex-sync-manifest.json` (sync state)

**Example `.gitignore`:**
```gitignore
# Codex cache
.fractary/plugins/codex/cache/

# Codex sync manifest
.fractary/.codex-sync-manifest.json

# Secrets (if accidentally created)
.fractary/plugins/codex/secrets.json
```

### 2. Error Handling

Always handle errors gracefully:

```bash
#!/bin/bash

# Don't fail builds if codex sync fails
fractary codex sync project || {
    echo "Warning: Codex sync failed, continuing..."
}

# Or with JSON parsing
RESULT=$(fractary codex sync project --json 2>/dev/null) || {
    echo "Sync failed, skipping"
    exit 0
}
```

### 3. Performance

**Cache Management:**
```bash
# Clear expired entries regularly
fractary codex cache clear --expired

# Monitor cache size
fractary codex cache stats

# Set appropriate TTLs
fractary codex types add configs --pattern "configs/**" --ttl 1d
```

**Parallel Sync:**
```bash
# Sync multiple projects in parallel
fractary codex sync org --parallel 5
```

### 4. Security

**Protect Tokens:**
```bash
# Use GitHub Actions secrets
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Or environment variables
export GITHUB_TOKEN="ghp_xxxxx"

# Never hardcode in config
{
  "storage": {
    "providers": {
      "github": {
        "token": "${GITHUB_TOKEN}"  // ✅ Good
        // "token": "ghp_xxxxx"     // ❌ Bad
      }
    }
  }
}
```

### 5. Monitoring

**Track Sync Status:**
```bash
# Log sync results
fractary codex sync project --json | tee codex-sync.log

# Monitor cache health
fractary codex health --json | tee codex-health.log

# Alert on failures
if ! fractary codex sync project --json > result.json; then
  # Send alert
  curl -X POST https://alerts.example.com/codex-sync-failed \
    -d @result.json
fi
```

## Example: Complete Plugin Integration

Here's a complete example for a Claude Code plugin:

**Directory Structure:**
```
my-plugin/
├── .claude/
│   ├── agents/
│   │   └── doc-sync/
│   │       ├── agent.yaml
│   │       └── contexts/
│   │           └── codex-sync.md
│   └── hooks/
│       ├── session-start.sh
│       └── pre-commit.sh
├── .fractary/
│   └── plugins/
│       └── codex/
│           └── config.json
├── .github/
│   └── workflows/
│       └── codex-sync.yml
├── docs/
│   └── README.md
├── package.json
├── README.md
└── .gitignore
```

**Setup Script:**
```bash
#!/bin/bash
# scripts/setup-codex.sh

set -e

echo "Setting up Fractary Codex..."

# Install CLI if needed
if ! command -v fractary &> /dev/null; then
    echo "Installing Fractary CLI..."
    npm install -g @fractary/cli
fi

# Initialize codex
if [ ! -f ".fractary/plugins/codex/config.json" ]; then
    echo "Initializing codex configuration..."
    fractary codex init --org fractary
fi

# Fetch shared standards
echo "Fetching shared standards..."
mkdir -p .fractary/standards
fractary codex fetch codex://fractary/codex/standards/code-review.md \
    --output .fractary/standards/code-review.md

# Verify setup
echo "Verifying setup..."
fractary codex health

echo "✓ Codex setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set GITHUB_TOKEN: export GITHUB_TOKEN='ghp_xxxxx'"
echo "  2. Sync docs: npm run codex:sync"
echo "  3. Check cache: npm run codex:health"
```

---

**Related Documentation:**
- [Usage Guide](./usage-guide.md) - Complete command reference
- [Migration Guide](./migration-guide.md) - Migrate from v2.0 to v3.0
- [SDK Integration](../../codex/docs/guides/cli-integration.md) - TypeScript/JavaScript SDK
