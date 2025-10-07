# Faber-CLI Specification Index

Complete specification set for the Faber-CLI universal AI agent orchestration platform.

## Core Architecture Specs

### [SPEC-0001: Faber-CLI Overview](./SPEC-0001-faber-cli-overview.md)
Vision, goals, three-dimensional abstraction, high-level architecture, and key design principles.

### [SPEC-0002: Concept System](./SPEC-0002-concept-system.md)
Five first-class orchestration concepts (roles, tools, evals, teams, workflows), metadata schemas, and relationships.

### [SPEC-0003: Role Structure](./SPEC-0003-role-structure.md)
Complete role anatomy including metadata, prompts, tasks, flows, contexts, and bindings.

### [SPEC-0004: Context System](./SPEC-0004-context-system.md)
Dynamic knowledge loading, context categories, composition patterns, and on-demand specialization.

### [SPEC-0005: Platform Abstraction](./SPEC-0005-platform-abstraction.md)
Platform contexts as MCP adapters, platform detection, multi-platform support, and fallback strategies.

### [SPEC-0006: Binding System](./SPEC-0006-binding-system.md)
Framework abstraction, built-in vs custom bindings, template system, and transformation pipeline.

### [SPEC-0007: Overlay System](./SPEC-0007-overlay-system.md)
Customization without forking, overlay categories, cascading resolution, and context merging strategies.

### [SPEC-0008: Configuration System](./SPEC-0008-configuration-system.md)
Platform selection, MCP server configuration, overlay settings, and framework preferences.

## Implementation Specs

### [SPEC-0009: CLI Commands](./SPEC-0009-cli-commands.md)
Complete CLI command reference including core commands and overlay management.

### [SPEC-0010: Build and Deployment Process](./SPEC-0010-build-deployment-process.md)
Build pipeline steps, overlay application, binding resolution, and deployment structure.

### [SPEC-0011: Claude Code Binding](./SPEC-0011-claude-code-binding.md)
First binding implementation, output structure, agent file format, and transformation steps.

### [SPEC-0012: MCP Server Integration](./SPEC-0012-mcp-server-integration.md)
MCP server relationship to platforms, configuration, dependency resolution, and fallback strategies.

## Unified CLI Specs

### [SPEC-0013: Codex CLI Integration](./SPEC-0013-codex-cli-integration.md)
Codex knowledge management CLI commands, SDK integration, metadata validation, routing analysis, and configuration management.

### [SPEC-0014: Forge CLI Integration](./SPEC-0014-forge-cli-integration.md)
Forge asset management and project scaffolding CLI commands, SDK integration, GitHub-based distribution, catalog discovery, and bundle management.

## Reading Order

### For Understanding the Vision
1. SPEC-0001 (Overview)
2. SPEC-0002 (Concepts)
3. SPEC-0007 (Overlays)

### For Understanding Roles
1. SPEC-0003 (Role Structure)
2. SPEC-0004 (Context System)
3. SPEC-0005 (Platform Abstraction)

### For Implementation
1. SPEC-0002 (Concepts)
2. SPEC-0006 (Bindings)
3. SPEC-0010 (Build Process)
4. SPEC-0011 (Claude Binding)

### For Configuration
1. SPEC-0008 (Configuration)
2. SPEC-0012 (MCP Integration)
3. SPEC-0009 (CLI Commands)

## Specification Status

All specifications are currently in **draft** status. They will be updated to **approved** status after review and before implementation begins.

## Next Steps

1. **Review Specifications**: Review all specs for completeness and accuracy
2. **Create Fresh Repository**: Set up new `faber-cli` repository for implementation
3. **Phase 1 Implementation**: Core infrastructure following SPEC-0001 through SPEC-0004
4. **Phase 2 Implementation**: Platform and binding systems following SPEC-0005 through SPEC-0007
5. **Phase 3 Implementation**: CLI and deployment following SPEC-0009 through SPEC-0012

## Reference Implementation

The `faber-agents-forge` repository provides a working example of the role/context/overlay structure and can be used as a reference during implementation.
