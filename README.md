# Fractary CLI

> Unified Command-Line Interface for All Fractary Tools

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue)](https://www.typescriptlang.org/)

## 🚀 Overview

Fractary CLI is a unified command-line interface that provides access to all Fractary tools through a single, consistent interface. No more installing separate CLIs for each tool - just install `@fractary/cli` and access everything.

### Fractary Tools

- **🎯 Faber** - Universal AI agent orchestration (write-once, deploy-everywhere)
- **📚 Codex** - Centralized knowledge management and distribution
- **⚒️ Forge** - Asset management and project scaffolding
- **⎈ Helm** - [Coming soon]

## 📦 Installation

```bash
npm install -g @fractary/cli
```

## 🎬 Quick Start

### Command Pattern

All Fractary tools use a consistent command pattern:

```bash
fractary <tool> <command> [options]
```

### Faber (AI Agent Orchestration)

Faber enables **write-once, deploy-everywhere** AI agent definitions. Define agents once, deploy to any framework (Claude Code, LangGraph, CrewAI) and platform (GitHub, Linear, Jira).

**Initialize a Faber project:**
```bash
fractary faber init
```

**Create your first agent:**
```bash
fractary faber create role issue-manager --platforms github-issues,linear
```

**Validate and build:**
```bash
# Validate the role
fractary faber validate role issue-manager

# Build for Claude Code
fractary faber build claude role issue-manager

# List all concepts
fractary faber list
```

**Project structure created:**
```
.faber/
  config.yml              # Configuration
  overlays/               # Customizations
roles/                    # Agent definitions
tools/                    # MCP servers & utilities
teams/                    # Multi-agent compositions
workflows/                # Cross-team orchestrations
deployments/              # Generated artifacts
```

### Codex (Knowledge Management)

Codex enables centralized documentation and knowledge distribution across your organization using the `codex://` URI scheme for universal document addressing.

**Initialize a Codex project:**
```bash
fractary codex init --org fractary
```

**Fetch documents by URI:**
```bash
# Fetch a document (with intelligent caching)
fractary codex fetch codex://fractary/codex/docs/api.md

# Bypass cache and fetch fresh
fractary codex fetch codex://fractary/codex/specs/SPEC-0001.md --bypass-cache

# Output as JSON with metadata
fractary codex fetch codex://fractary/codex/docs/guide.md --json
```

**Manage cache:**
```bash
# List cached documents
fractary codex cache list

# View cache statistics
fractary codex cache stats

# Clear expired entries
fractary codex cache clear --expired

# Clear all cache
fractary codex cache clear --all
```

**Sync with codex repository:**
```bash
# Sync current project
fractary codex sync project --dry-run

# Sync all projects in organization
fractary codex sync org --env prod

# Bidirectional sync
fractary codex sync project --direction bidirectional
```

**Manage artifact types:**
```bash
# List all types (built-in and custom)
fractary codex types list

# Show type details
fractary codex types show docs

# Add custom type
fractary codex types add schemas --pattern "schemas/**/*.json" --ttl 7d

# Remove custom type
fractary codex types remove schemas
```

**Health diagnostics:**
```bash
# Run health check
fractary codex health

# Auto-fix detected issues
fractary codex health --fix
```

**Migrate from v2.0:**
```bash
# Preview migration
fractary codex migrate --dry-run

# Execute migration
fractary codex migrate
```

**Project structure created:**
```
.fractary/
  plugins/
    codex/
      config.json         # v3.0 configuration
      cache/              # Document cache
        index.json        # Cache index
```

**Learn More:**
- [Usage Guide](docs/codex/usage-guide.md) - Complete command reference and examples
- [Integration Guide](docs/codex/integration-guide.md) - Integrate codex into projects and CI/CD
- [Migration Guide](docs/codex/migration-guide.md) - Migrate from v2.0 to v3.0

### Forge (Asset Management & Scaffolding)

Forge provides project scaffolding and ongoing asset management for maintaining consistency across projects.

**List available assets:**
```bash
fractary forge list
```

**Create a new project:**
```bash
fractary forge create my-blog --starter fractary/forge-starter-www-astro-blog
cd my-blog
```

**Install and deploy bundles:**
```bash
# Install a bundle
fractary forge install fractary/forge-bundle-team-core

# Deploy assets
fractary forge deploy

# Check project status
fractary forge status
```

**Update bundles:**
```bash
# Update specific bundle
fractary forge update team-core

# See what changed
fractary forge diff team-core

# Validate manifest
fractary forge validate
```

**Manage configuration:**
```bash
# Add catalog source
fractary forge config add-catalog https://fractary.github.io/forge-catalog/catalog.json

# View configuration
fractary forge config show

# Search for assets
fractary forge search "authentication"
```

### Helm (Coming Soon)

```bash
fractary helm deploy <env>
```

## 🏗️ Faber Architecture

### Three-Dimensional Abstraction

1. **Framework Abstraction** - Deploy to any AI framework (Claude Code, LangGraph, CrewAI)
2. **Platform Abstraction** - Work with any platform (GitHub, GitLab, Linear, Jira, AWS, GCP)
3. **Organization Abstraction** - Customize for your company without forking

### Five First-Class Concepts

1. **Roles** - AI agent definitions with contexts, tasks, and flows
2. **Tools** - MCP servers and utilities for platform integration
3. **Evals** - Testing and evaluation scenarios
4. **Teams** - Multi-agent compositions
5. **Workflows** - Cross-team orchestrations

### Seven Context Categories

- **Specialists** - Domain expertise loaded on-demand
- **Platforms** - Platform-specific adapters (MCP)
- **Standards** - Best practices and conventions
- **Patterns** - Design patterns and architectures
- **Playbooks** - Operational procedures
- **References** - API and framework documentation
- **Troubleshooting** - Issue resolution guides

## 🔄 How Faber Works

### 1. Define Once

Create platform-agnostic agent definitions:

```yaml
# roles/issue-manager/agent.yml
org: acme
system: devops
name: issue-manager
type: role
platforms: [github-issues, linear, jira]
```

### 2. Customize via Overlays

Add organization-specific customizations without forking:

```markdown
# .faber/overlays/organization/contexts/standards/company-policy.md
All issues must include customer impact assessment...
```

### 3. Deploy Everywhere

Build for any framework:

```bash
fractary faber build claude role issue-manager     # → .claude/agents/
fractary faber build langgraph role issue-manager  # → langgraph/graphs/
fractary faber build crewai role issue-manager     # → crewai/agents/
```

## ✨ Benefits

### Single Installation
Install one CLI for all Fractary tools instead of managing multiple packages.

### Consistent Interface
All tools follow the same command pattern: `fractary <tool> <command>`

### No Naming Conflicts
Main command is just `fractary` - no conflicts with existing tools.

### Lazy Loading
Commands are loaded on-demand for better performance.

### Unified Updates
Update all tools together with a single `npm update -g @fractary/cli`.

### Shared Utilities
Common functionality shared across all tools reduces duplication.

## 🎯 Use Cases

### For Developers
- Rapid AI agent prototyping
- Framework experimentation
- Platform flexibility
- Access all Fractary tools from one CLI

### For Organizations
- Inject company standards without forking
- Consistent agents across teams
- Environment-specific configurations
- Centralized tooling management

### For Open Source
- Distribute reusable agent definitions
- Community contributions
- Multi-framework support

## 📚 Documentation

### Faber Documentation
- [Getting Started](docs/faber/getting-started.md)
- [Core Concepts](docs/faber/concepts.md)
- [CLI Reference](docs/faber/cli-reference.md)
- [Context System](docs/faber/contexts.md)
- [Overlay System](docs/faber/overlays.md)
- [Binding System](docs/faber/bindings.md)
- [Examples](docs/faber/examples.md)

### Codex Documentation
- [Usage Guide](docs/codex/usage-guide.md) - Complete command reference and workflow examples
- [Integration Guide](docs/codex/integration-guide.md) - Integrate into projects, plugins, and CI/CD
- [Migration Guide](docs/codex/migration-guide.md) - Migrate from v2.0 to v3.0

### SDK Integration
- [SDK Integration Guide](docs/sdk-integration-guide.md) - How to use CLI SDK in your projects
- [API Reference](docs/api.md) - Programmatic API documentation

### General
- [CLI Architecture](docs/architecture.md)
- [Contributing](docs/contributing.md)

## 🛠️ Current Implementation Status

### ✅ Complete (Faber)
- Core concept system (Roles)
- Context system (7 categories)
- Overlay system
- Configuration management
- Claude Code binding
- CLI commands (init, create, list, validate, build)

### ✅ Complete (Codex)
- CLI v3.0 commands (init, fetch, cache, sync, types, health, migrate)
- Pull-based retrieval with `codex://` URI scheme
- Intelligent caching with TTL-based expiration
- Bidirectional sync (project and org-level)
- Artifact type registry (built-in and custom types)
- Health diagnostics with auto-repair
- v2.0 to v3.0 migration support

### ✅ Complete (Forge)
- CLI commands (create, install, update, deploy, diff, validate, list, status, remove, config, search)
- SDK integration (@fractary/forge)
- GitHub-based asset distribution
- Catalog-based discovery
- Project scaffolding and bundle management

### 🚧 In Progress (Faber)
- Additional concept loaders (Tools, Teams, Workflows, Evals)
- LangGraph and CrewAI bindings
- MCP server integration
- Deploy command

### 📋 Planned
- Helm tool integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/fractary/cli.git
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link for local development
npm link

# Test the CLI
fractary --help
fractary faber init
```

## 📦 Related Packages

Fractary CLI depends on core SDK packages for each tool:

- **[@fractary/faber](https://www.npmjs.com/package/@fractary/faber)** - Core SDK for Faber
- **[@fractary/codex](https://www.npmjs.com/package/@fractary/codex)** - Core SDK for Codex
- **[@fractary/forge](https://www.npmjs.com/package/@fractary/forge)** - Core SDK for Forge
- **@fractary/helm** - Core SDK for Helm (coming soon)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for platform integration standards
- [Claude Code](https://claude.ai/code) for AI agent inspiration
- The open source community for feedback and contributions

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/fractary/cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fractary/cli/discussions)
- **Email**: support@fractary.com

---

**Fractary CLI** - *One CLI for all Fractary tools*
