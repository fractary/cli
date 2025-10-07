# Changelog

All notable changes to the Fractary CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
