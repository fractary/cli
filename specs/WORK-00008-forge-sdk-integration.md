---
title: "Forge SDK Agent/Tool Definition Integration"
work_id: "8"
issue_url: "https://github.com/fractary/cli/issues/8"
template: feature
status: draft
created: 2025-12-15
source: conversation+issue
---

# WORK-00008: Forge SDK Agent/Tool Definition Integration

## Summary

Integrate the @fractary/forge SDK v1.1.1 agent/tool definition capabilities into the fractary CLI, exposing the LangChain-based agent and tool management system via CLI commands while maintaining backward compatibility with existing bundle management functionality.

## Background

The Forge SDK has been substantially reworked to provide a framework for defining and managing AI agents and tools on top of the LangChain framework. The SDK provides:

- **AgentAPI** and **ToolAPI** for high-level operations
- **DefinitionResolver** for three-tier resolution (local → global → stockyard)
- **LockfileManager** for reproducible environments
- **UpdateChecker** for version management with breaking change detection
- **ForkManager** for customization workflows

Currently, the forge command is commented out in `cli.ts` and the existing 11 forge commands focus only on bundle/starter management.

## Requirements

### Functional Requirements

1. **Keep existing bundle commands** unchanged (backward compatible)
2. **Add new flat commands** for agent/tool management:
   - `forge agent-create`, `forge agent-validate`, `forge agent-info`, `forge agent-list`
   - `forge tool-create`, `forge tool-validate`, `forge tool-info`, `forge tool-list`, `forge tool-execute`
   - `forge lockfile-generate`, `forge lockfile-validate`
   - `forge update-check`, `forge update-apply`
   - `forge agent-fork`, `forge tool-fork`, `forge agent-health`
3. **Enable forge command** in cli.ts after core commands implemented
4. **Follow codex patterns** for client wrapper, configuration, error handling

### Non-Functional Requirements

1. TypeScript strict mode
2. Consistent error handling with helpful messages
3. Chalk-based colored output matching CLI style
4. Unit test coverage > 80%
5. Support --json flag for scriptable output

## Design

### Architecture

#### File Structure
```
src/tools/forge/
├── client.ts              # ForgeClient wrapper for SDK
├── get-client.ts          # Singleton client getter
├── config-types.ts        # YAML config types
├── migrate-config.ts      # Config I/O and migration
├── utils/
│   ├── output-formatter.ts
│   ├── validation-reporter.ts
│   └── version-helper.ts
├── commands/
│   ├── init.ts                    # Initialize config
│   ├── agent-create.ts            # Create agent
│   ├── agent-info.ts              # Show agent info
│   ├── agent-list.ts              # List agents
│   ├── agent-validate.ts          # Validate agent
│   ├── agent-fork.ts              # Fork agent
│   ├── agent-health.ts            # Health check agent
│   ├── tool-create.ts             # Create tool
│   ├── tool-info.ts               # Show tool info
│   ├── tool-list.ts               # List tools
│   ├── tool-validate.ts           # Validate tool
│   ├── tool-execute.ts            # Execute tool
│   ├── tool-fork.ts               # Fork tool
│   ├── lockfile-generate.ts       # Generate lockfile
│   ├── lockfile-validate.ts       # Validate lockfile
│   ├── update-check.ts            # Check for updates
│   ├── update-apply.ts            # Apply updates
│   # Existing bundle commands remain unchanged
│   ├── create.ts
│   ├── install.ts
│   └── ... (11 bundle commands)
└── index.ts               # Register new commands
```

#### Configuration

**Location:** `.fractary/forge/config.yaml`

```yaml
organization: fractary
registry:
  local:
    enabled: true
    agents_path: .fractary/agents
    tools_path: .fractary/tools
  global:
    enabled: true
    path: ~/.fractary/registry
  stockyard:
    enabled: false
    url: https://stockyard.fractary.dev
    api_key: ${STOCKYARD_API_KEY}
lockfile:
  path: .fractary/forge/lockfile.json
  auto_generate: true
updates:
  check_frequency: daily
  auto_update: false
  breaking_changes_policy: prompt
defaults:
  agent:
    model:
      provider: anthropic
      name: claude-sonnet-4
    config:
      temperature: 0.7
      max_tokens: 4096
```

#### Client Wrapper Pattern

Following the codex pattern with singleton:

**client.ts:**
- `ForgeClient` class wrapping AgentAPI, ToolAPI, DefinitionResolver, LockfileManager, ForkManager, UpdateChecker
- Static `create(options?)` factory method
- Loads config from `.fractary/forge/config.yaml`
- Initializes all SDK managers

**get-client.ts:**
- `getClient(options?)` - Singleton getter
- `resetClient()` - For testing
- `isClientInitialized()` - Check status

### Command Specifications

#### forge init
```bash
fractary forge init [--org <slug>] [--global] [--force]
```
- Detect org from git remote or use --org
- Create `.fractary/forge/config.yaml`
- Create directory structure (`.fractary/agents/`, `.fractary/tools/`)
- Follow codex init.ts pattern

#### forge agent-create
```bash
fractary forge agent-create <name> [options]
  --description <text>
  --model <provider>
  --model-name <name>
  --tools <tools...>
  --prompt <text>
  --extends <agent>
  --interactive
```
- Validate name (lowercase-with-hyphens)
- Create YAML at `.fractary/agents/<name>.yaml`
- Support inheritance with --extends
- Interactive prompts for all fields

#### forge agent-validate
```bash
fractary forge agent-validate <name> [--strict] [--check-tools] [--json]
```
- Use client.resolveAgent()
- Validate with SDK DefinitionValidator
- Check tool references if --check-tools
- Exit code: 0 = valid, 1 = invalid

#### forge agent-info
```bash
fractary forge agent-info <name> [--json] [--show-tools] [--show-prompt]
```
- Use client.getAgentInfo()
- Format with chalk (name, version, description, source, tools, model)
- Optional full prompt display

#### forge agent-list
```bash
fractary forge agent-list [--tags <tags>] [--json]
```
- Use client.listAgents()
- Filter by tags
- Table format with chalk

### Error Handling Pattern

```typescript
try {
  const client = await getClient();
  const result = await client.resolveAgent(name);
  // success
} catch (error: any) {
  console.error(chalk.red('Error:'), error.message);

  if (error.message.includes('configuration')) {
    console.log(chalk.dim('\nRun "fractary forge init" to create a configuration.'));
  }

  process.exit(1);
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Priority: CRITICAL)
**Deliverable:** Working `fractary forge init` command

1. Create `config-types.ts` - TypeScript interfaces for YAML config
2. Create `migrate-config.ts` - Config I/O with YAML reading/writing
3. Create `client.ts` - ForgeClient wrapper class
4. Create `get-client.ts` - Singleton pattern
5. Implement `commands/init.ts`
6. Test initialization workflow

### Phase 2: Agent Commands (Priority: HIGH)
**Deliverable:** Basic agent management (create, validate, info, list)

1. Create `utils/output-formatter.ts`
2. Create `utils/validation-reporter.ts`
3. Implement `commands/agent-create.ts`
4. Implement `commands/agent-validate.ts`
5. Implement `commands/agent-info.ts`
6. Implement `commands/agent-list.ts`
7. Update `index.ts` to register agent commands
8. Uncomment forge in `/src/cli.ts` (lines 25, 47)

### Phase 3: Tool Commands (Priority: HIGH)
**Deliverable:** Basic tool management and execution

1. Create `utils/version-helper.ts`
2. Implement `commands/tool-create.ts`
3. Implement `commands/tool-validate.ts`
4. Implement `commands/tool-info.ts`
5. Implement `commands/tool-list.ts`
6. Implement `commands/tool-execute.ts`

### Phase 4: Advanced Features (Priority: MEDIUM)
**Deliverable:** Fork workflows and lockfile support

1. Implement `commands/agent-fork.ts`
2. Implement `commands/tool-fork.ts`
3. Implement `commands/agent-health.ts`
4. Implement `commands/lockfile-generate.ts`
5. Implement `commands/lockfile-validate.ts`

### Phase 5: Updates & Polish (Priority: MEDIUM)
**Deliverable:** Complete forge integration

1. Implement `commands/update-check.ts`
2. Implement `commands/update-apply.ts`
3. Add comprehensive error messages
4. Write unit tests
5. Write integration tests
6. Update documentation

## Critical Files

| File | Action | Purpose |
|------|--------|---------|
| `src/tools/forge/client.ts` | NEW | ForgeClient wrapper for SDK |
| `src/tools/forge/get-client.ts` | NEW | Singleton client getter |
| `src/tools/forge/config-types.ts` | NEW | YAML config types |
| `src/tools/forge/migrate-config.ts` | NEW | Config I/O and migration |
| `src/tools/forge/commands/init.ts` | NEW | Initialize config |
| `src/tools/forge/commands/agent-create.ts` | NEW | Create agent definition |
| `src/tools/forge/commands/agent-validate.ts` | NEW | Validate agent |
| `src/tools/forge/index.ts` | MODIFY | Register new commands |
| `src/cli.ts` | MODIFY | Uncomment forge (lines 25, 47) |

## Backward Compatibility

All existing bundle commands remain unchanged:
- `forge create` - Project from starter
- `forge install` - Install bundle
- `forge deploy`, `forge validate`, `forge list`, `forge search`
- `forge status`, `forge remove`, `forge diff`, `forge update`, `forge config`

New commands use explicit naming to avoid conflicts:
- `forge agent-create` vs `forge create`
- `forge agent-validate` vs `forge validate`
- `forge update-check` vs `forge update`

## Success Criteria

- [ ] `forge init` creates valid configuration
- [ ] `forge agent-create` creates valid agent YAML
- [ ] `forge agent-validate` validates definitions with helpful errors
- [ ] `forge agent-info` displays agent information
- [ ] `forge agent-list` lists available agents
- [ ] Client wrapper properly initializes from config
- [ ] All commands follow established CLI patterns
- [ ] No breaking changes to existing bundle commands
- [ ] forge command enabled in cli.ts

## References

- [SPEC-FORGE-001: Agent/Tool Definition System](https://github.com/fractary/forge/docs/specs/SPEC-FORGE-001-agent-tool-definition-system.md)
- [SPEC-FORGE-002: Agent Registry Resolution](https://github.com/fractary/forge/docs/specs/SPEC-FORGE-002-agent-registry-resolution.md)
- [SPEC-FORGE-004: CLI Integration](https://github.com/fractary/forge/docs/specs/SPEC-FORGE-004-CLI-INTEGRATION.md)
- [Forge SDK Repository](https://github.com/fractary/forge)
- [GitHub Issue #8](https://github.com/fractary/cli/issues/8)
