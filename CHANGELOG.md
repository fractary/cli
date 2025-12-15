# Changelog

All notable changes to the Fractary CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2025-12-14

### Added
- **Codex Documentation Suite**: Comprehensive documentation for Codex v3.0 CLI integration
  - [Usage Guide](docs/codex/usage-guide.md) - Complete command reference with examples and workflows
  - [Integration Guide](docs/codex/integration-guide.md) - Integration patterns for external projects, Claude Code plugins, and CI/CD pipelines
  - [Migration Guide](docs/codex/migration-guide.md) - Complete v2.0 to v3.0 migration guide with rollback plan
- **Enhanced README**: Added Codex documentation links in Quick Start and Documentation sections

### Changed
- Updated documentation structure to better support external integrations
- Improved clarity for fractary/claude-plugins and other downstream consumers

## [0.3.1] - 2025-12-13

### Added
- Complete Codex v3.0 CLI implementation with SDK integration

## [0.3.0] - 2025-12-12

### Added
- **SDK Integration**: Complete integration with @fractary/faber SDK v1.0.1
  - All commands now use live SDK managers instead of stubs
  - Factory pattern for lazy-loaded manager instances
  - Comprehensive type re-exports from SDK
  - `--json` flag on all commands for programmatic access

### Changed
- `faber work` commands now use `WorkManager` from SDK for real operations
- `faber repo` commands now use `RepoManager` from SDK for Git operations
- `faber spec` commands now use `SpecManager` from SDK for specification lifecycle
- `faber logs` commands now use `LogManager` from SDK for session capture
- `faber run/status/pause/resume/recover` commands now use `FaberWorkflow` from SDK
- Package dependency updated to `@fractary/faber@^1.0.1`

### Removed
- Stub implementations (`src/sdk/stubs.ts`, `src/sdk/types.ts`)
- Legacy simple commands (`src/tools/faber/simple.ts`)
- Old individual commands (build.ts, create.ts, list.ts, validate.ts) - replaced by SDK-integrated commands

### Developer Notes
- CLI now requires `@fractary/faber` SDK as peer dependency
- External projects can import factory functions and types from `@fractary/cli`
- See `docs/sdk-integration-guide.md` for integration patterns

## [0.2.0] - 2025-10-07

### Added
- **Forge CLI Integration**: Complete integration of Forge asset management and project scaffolding
  - 11 commands: create, install, update, deploy, diff, validate, list, status, remove, config, search
  - Config command includes 5 subcommands: show, set, add-catalog, remove-catalog, list-catalogs
  - Full SDK integration with @fractary/forge for GitHub-based asset distribution
  - Catalog-based asset discovery system
  - Project scaffolding with starter templates
  - Bundle management with ownership rules (copy, copy-if-absent, merge, ignore)
- Added dependencies: @fractary/forge, ajv, gray-matter, prompts, @types/prompts
- Added SPEC-0014 documentation for forge integration
- Updated README with comprehensive forge command examples and documentation

### Changed
- Bumped version from 0.1.1 to 0.2.0 for minor feature release
- Updated package keywords to include: scaffolding, asset-management, forge
- Updated main CLI help text to include forge tool description
- Updated implementation status in README to mark forge as complete

## [0.1.1] - 2025-10-06

### Added
- Codex CLI integration with 7 commands
- SPEC-0013 documentation for codex integration

## [0.1.0] - Initial Release

### Added
- Initial unified CLI structure
- Faber tool integration with core commands
- Base CLI infrastructure with Commander.js
- Tool-based routing pattern: `fractary <tool> <command>`
