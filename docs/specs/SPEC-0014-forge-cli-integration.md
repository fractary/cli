# SPEC-0014: Forge CLI Integration

**Status**: Implementation
**Created**: 2025-10-06
**Updated**: 2025-10-06

## Overview

This specification describes the integration of forge-cli functionality into the unified @fractary/cli, enabling forge commands to be executed as `fractary forge <command>` instead of maintaining a separate CLI package.

## Background

The forge-cli project (@fractary/forge-cli v1.0.0) is a production-ready CLI tool built on the @fractary/forge SDK for project scaffolding and asset management. To maintain consistency across all Fractary tools and reduce maintenance overhead, forge functionality should be integrated into the unified CLI following the same pattern as faber and codex.

## Goals

1. **Unify Command Interface**: Enable forge commands via `fractary forge <command>`
2. **Maintain Functionality**: Preserve all 11 forge commands without breaking changes to behavior
3. **Follow Patterns**: Implement using the same tool pattern as faber and codex
4. **Minimize Duplication**: Leverage @fractary/forge SDK for all core functionality
5. **Ease Migration**: Provide clear migration path for existing forge-cli users

## Non-Goals

- Changing the forge SDK or its functionality
- Modifying manifest formats or asset structures
- Breaking compatibility with existing forge projects
- Reimplementing core forge functionality (stays in SDK)

## Architecture

### Current State

**forge-cli Project Structure:**
```
forge-cli/
├── src/
│   ├── cli.ts                    # Main CLI entry with Commander.js
│   ├── commands/                 # 11 command implementations
│   │   ├── base.ts              # BaseCommand class
│   │   ├── create.ts            # Project creation
│   │   ├── install.ts           # Bundle installation
│   │   ├── update.ts            # Bundle updates
│   │   ├── deploy.ts            # Asset deployment
│   │   ├── diff.ts              # Change detection
│   │   ├── validate.ts          # Manifest validation
│   │   ├── list.ts              # Asset listing
│   │   ├── status.ts            # Project status
│   │   ├── remove.ts            # Bundle removal
│   │   ├── config.ts            # Configuration (with subcommands)
│   │   └── search.ts            # Asset search
│   └── index.ts                 # Exports
├── package.json
│   └── dependencies:
│       - @fractary/forge        # SDK (core functionality)
│       - @commander-js/extra-typings
│       - ajv, chalk, prompts, gray-matter
```

**Unified CLI Structure:**
```
cli/
├── src/
│   ├── cli.ts                   # Main entry with tool routing
│   ├── tools/
│   │   ├── faber/              # Faber tool implementation
│   │   └── codex/              # Codex tool implementation
│   └── shared/                  # Shared utilities
└── package.json
    └── dependencies:
        - @fractary/faber, @fractary/codex
        - commander, chalk, glob
```

### Target State

**Integrated Structure:**
```
cli/
├── src/
│   ├── cli.ts                   # Main entry (updated to include forge)
│   ├── tools/
│   │   ├── faber/
│   │   ├── codex/
│   │   └── forge/              # NEW: Forge tool implementation
│   │       ├── index.ts         # createForgeCommand() export
│   │       └── commands/        # 11 command implementations
│   │           ├── base.ts
│   │           ├── create.ts
│   │           ├── install.ts
│   │           ├── update.ts
│   │           ├── deploy.ts
│   │           ├── diff.ts
│   │           ├── validate.ts
│   │           ├── list.ts
│   │           ├── status.ts
│   │           ├── remove.ts
│   │           ├── config.ts
│   │           └── search.ts
│   └── shared/
└── package.json
    └── dependencies: (updated)
        - @fractary/forge        # NEW: SDK dependency
        - prompts, gray-matter, ajv  # NEW: CLI dependencies
```

## Detailed Design

### 1. Tool Pattern Consistency

All tools follow the same pattern:

```typescript
// src/tools/forge/index.ts
import { Command } from 'commander';

export function createForgeCommand(): Command {
  const forge = new Command('forge');

  forge
    .description('Asset management and project scaffolding')
    .version('1.0.0');

  // Register all commands
  const commands = [
    new CreateCommand(),
    new InstallCommand(),
    new UpdateCommand(),
    new DeployCommand(),
    new DiffCommand(),
    new ValidateCommand(),
    new ListCommand(),
    new StatusCommand(),
    new RemoveCommand(),
    new ConfigCommand(),
    new SearchCommand(),
  ];

  commands.forEach(cmd => cmd.register(forge));

  return forge;
}
```

### 2. Command Adaptation

Commands maintain their class-based structure from forge-cli but adapt to standard Commander.js:

**Before (forge-cli):**
```typescript
import { Command } from '@commander-js/extra-typings';

export class InstallCommand extends BaseCommand {
  register(program: Command): Command<any, any> {
    return program
      .command('install <bundle>')
      .description('Add a bundle to the project')
      .option('--save', 'Save to manifest')
      .action(async (bundle: string, options: any) => {
        await this.execute(bundle, options);
      });
  }
}
```

**After (unified CLI):**
```typescript
import { Command } from 'commander';

export class InstallCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('install <bundle>')
      .description('Add a bundle to the project')
      .option('--save', 'Save to manifest')
      .action(async (bundle: string, options: any) => {
        await this.execute(bundle, options);
      });
  }
}
```

Key changes:
- Import from `commander` instead of `@commander-js/extra-typings`
- Remove TypeScript generics from return type
- All business logic remains identical

### 3. Dependency Management

**Add to package.json:**
```json
{
  "dependencies": {
    "@fractary/forge": "^1.0.0",
    "prompts": "^2.4.2",
    "gray-matter": "^4.0.3",
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "@types/prompts": "^2.4.9"
  }
}
```

**SDK provides (no duplication):**
- Core types and interfaces
- Resolver system (GitHub, Catalog, Local)
- Configuration management
- File system utilities
- Error handling and logging
- Caching system

**CLI provides (command implementations only):**
- User interaction (prompts)
- Command parsing and routing
- Output formatting
- Validation schemas (ajv)
- Frontmatter parsing (gray-matter)

### 4. Integration Points

**Main CLI Entry (`src/cli.ts`):**
```typescript
import { createForgeCommand } from './tools/forge';

// Add to program
program.addCommand(createFaberCommand());
program.addCommand(createCodexCommand());
program.addCommand(createForgeCommand());  // NEW
```

**Help Output:**
```
$ fractary --help

Usage: fractary [options] [command]

Unified CLI for all Fractary tools

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  faber           Universal AI agent orchestration
  codex           Centralized knowledge management
  forge           Asset management and project scaffolding  # NEW
  help [command]  display help for command
```

### 5. Command Reference

All 11 forge commands are ported with identical functionality:

| Command | Description | Subcommands |
|---------|-------------|-------------|
| `create` | Create a new Fractary project | - |
| `install` | Add a bundle to the project | - |
| `update` | Update bundles to latest versions | - |
| `deploy` | Deploy managed assets from bundles | - |
| `diff` | Show differences between local and bundle versions | - |
| `validate` | Validate project manifest | - |
| `list` | List available starters and bundles | - |
| `status` | Show project status and installed bundles | - |
| `remove` | Remove a bundle from the project | - |
| `search` | Search for assets in catalogs | - |
| `config` | Manage Forge configuration | `show`, `set`, `add-catalog`, `remove-catalog`, `list-catalogs` |

## Implementation Plan

### Phase 1: Dependencies and Structure
1. Add forge SDK and CLI dependencies to package.json
2. Create `src/tools/forge/` directory
3. Create `src/tools/forge/commands/` directory

### Phase 2: Command Implementation
1. Copy `base.ts` from forge-cli, adapt imports
2. Copy and adapt each of the 11 command files:
   - Change imports from `@commander-js/extra-typings` to `commander`
   - Update SDK imports to use `@fractary/forge`
   - Maintain all business logic
   - Preserve class-based structure

### Phase 3: Tool Integration
1. Create `src/tools/forge/index.ts` with `createForgeCommand()`
2. Update `src/cli.ts` to import and register forge command
3. Update help text and descriptions

### Phase 4: Documentation
1. Update README.md with forge command examples
2. Update CLAUDE.md with forge context
3. Create migration guide for forge-cli users
4. Update package.json description and keywords

### Phase 5: Testing
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Link globally: `npm link`
4. Test each command:
   ```bash
   fractary forge --help
   fractary forge list
   fractary forge create test-project
   fractary forge install <bundle>
   # ... test all 11 commands
   ```

## Migration Guide for Users

### For Existing forge-cli Users

**Before (separate CLI):**
```bash
npm install -g @fractary/forge-cli
forge create my-project
forge install my-bundle
```

**After (unified CLI):**
```bash
npm install -g @fractary/cli
fractary forge create my-project
fractary forge install my-bundle
```

### Breaking Changes
- Command prefix changes from `forge` to `fractary forge`
- Package name changes from `@fractary/forge-cli` to `@fractary/cli`
- No changes to manifest format, asset structure, or SDK functionality

### Non-Breaking
- All command options remain identical
- All manifest files (fractory.manifest.json) work unchanged
- All bundles and starters remain compatible
- GitHub distribution unchanged
- Configuration files (.forgerc) work the same way

## Success Criteria

- ✅ All 11 forge commands accessible via `fractary forge <command>`
- ✅ SDK integration functional (resolvers, config, caching)
- ✅ Commands maintain identical behavior to forge-cli
- ✅ No breaking changes to manifest format or asset structure
- ✅ Documentation updated with examples
- ✅ Build and tests pass
- ✅ Can create projects, install bundles, deploy assets

## Future Considerations

1. **Deprecation Timeline**: forge-cli package can be deprecated after unified CLI is stable
2. **Alias Support**: Consider adding `forge` as an alias to `fractary forge` for convenience
3. **Cross-Tool Integration**: Potential for faber agents to interact with forge commands
4. **Shared Utilities**: Identify common patterns across tools for src/shared/

## References

- forge-cli repository: `/mnt/c/GitHub/fractary/forge-cli/`
- @fractary/forge SDK: `/mnt/c/GitHub/fractary/forge/`
- SPEC-0013: Codex CLI Integration (similar pattern)
- CLAUDE.md in both repositories for context

## Appendix: Command Details

### Config Command Structure
The config command has 5 subcommands, making it the most complex:

```typescript
config
  ├── show              # Display current configuration
  ├── set               # Set configuration value
  ├── add-catalog       # Add catalog source
  ├── remove-catalog    # Remove catalog source
  └── list-catalogs     # List configured catalogs
```

This subcommand pattern should be preserved in the unified CLI.
