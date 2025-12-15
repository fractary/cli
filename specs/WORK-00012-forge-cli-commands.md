---
spec_id: spec-12-forge-cli-commands
issue_number: 12
issue_url: https://github.com/fractary/cli/issues/12
title: Implement Forge CLI Commands (SPEC-FORGE-004 & SPEC-FORGE-006)
type: feature
status: draft
created: 2025-12-15
author: Claude Code
validated: false
source_specs:
  - SPEC-FORGE-004-CLI-INTEGRATION.md
  - SPEC-FORGE-006-CLI-INTEGRATION.md
refinement_log:
  - date: 2025-12-15
    round: 1
    changes:
      - Added Phase 0 for SDK API audit before implementation
      - Updated authentication to use environment variables (FRACTARY_TOKEN)
      - Deferred manual merge conflict resolution to future phase
      - Added automatic offline fallback with cache-based operations
      - Added NFR08 for network resilience
---

# Feature Specification: Implement Forge CLI Commands

**Issue**: [#12](https://github.com/fractary/cli/issues/12)
**Type**: Feature
**Status**: Draft
**Created**: 2025-12-15

## Summary

Implement the **Forge CLI commands** in the `fractary/cli` project as specified in SPEC-FORGE-004 and SPEC-FORGE-006. This provides user-friendly command-line interfaces for all `@fractary/forge` SDK functionality including lockfile management, package updates, forking, registry operations, and cache management.

The `@fractary/forge` SDK (v1.0.0+) provides complete registry and resolution functionality that needs CLI exposure under the `forge` namespace following the pattern: `fractary forge <command> [options]`.

## User Stories

### CLI User: Package Installation
**As a** CLI user
**I want** to install agents and tools from registries
**So that** I can easily add functionality to my project

**Acceptance Criteria**:
- [ ] Can install packages by name: `fractary forge install <name>`
- [ ] Can install with version: `fractary forge install <name>@<version>`
- [ ] Can install globally with `-g` flag
- [ ] Can force reinstall with `--force` flag
- [ ] Can filter components with `--agents-only`, `--tools-only`, `--workflows-only`
- [ ] Can preview with `--dry-run` flag
- [ ] See progress indicators during installation
- [ ] See clear success/error messages

### CLI User: Package Management
**As a** CLI user
**I want** to list, search, and get info about packages
**So that** I can discover and manage installed packages

**Acceptance Criteria**:
- [ ] Can list installed packages: `fractary forge list`
- [ ] Can filter list by type, source, or update status
- [ ] Can search Stockyard: `fractary forge search <query>`
- [ ] Can view package details: `fractary forge info <name>`
- [ ] Can see available versions with `--versions` flag

### CLI User: Lockfile Management
**As a** CLI user
**I want** to generate and validate lockfiles
**So that** I can ensure reproducible installations

**Acceptance Criteria**:
- [ ] Can generate lockfile: `fractary forge lock`
- [ ] Can validate existing lockfile: `fractary forge lock --validate`
- [ ] Can regenerate with `--force` flag
- [ ] Lockfile includes integrity hashes

### CLI User: Package Updates
**As a** CLI user
**I want** to update packages to newer versions
**So that** I can keep my dependencies current

**Acceptance Criteria**:
- [ ] Can check for updates: `fractary forge update --check`
- [ ] Can update all packages: `fractary forge update`
- [ ] Can update specific package: `fractary forge update <name>`
- [ ] Can choose strategy: `--strategy latest|patch|minor`
- [ ] Can preview with `--dry-run` flag
- [ ] Breaking changes are highlighted

### CLI User: Fork & Customize
**As a** CLI user
**I want** to fork and customize packages
**So that** I can modify packages for my needs

**Acceptance Criteria**:
- [ ] Can fork package: `fractary forge fork <source> <target>`
- [ ] Can merge upstream changes: `fractary forge merge <name>`
- [ ] Can choose merge strategy: `--strategy auto|local|upstream` (Phase 1)
- [ ] Can preview merge: `--preview` flag
- [ ] `--strategy manual` deferred to future phase (requires conflict resolution UX design)

### CLI User: Registry Management
**As a** CLI user
**I want** to manage multiple registries
**So that** I can use private and custom registries

**Acceptance Criteria**:
- [ ] Can add registry: `fractary forge registry add <name> <url>`
- [ ] Can remove registry: `fractary forge registry remove <name>`
- [ ] Can list registries: `fractary forge registry list`
- [ ] Can set priority with `--priority` flag
- [ ] Can add to global config with `--global` flag

### CLI User: Cache Management
**As a** CLI user
**I want** to manage the manifest cache
**So that** I can clear stale data and monitor cache health

**Acceptance Criteria**:
- [ ] Can clear all cache: `fractary forge cache clear`
- [ ] Can clear by pattern: `fractary forge cache clear <pattern>`
- [ ] Can view cache stats: `fractary forge cache stats`
- [ ] Stats show entry counts, sizes, freshness

### CLI User: Stockyard Authentication
**As a** CLI user
**I want** to authenticate with Stockyard
**So that** I can access private packages and publish

**Acceptance Criteria**:
- [ ] Can login: `fractary forge login` (reads from `FRACTARY_TOKEN` env var)
- [ ] Can provide token directly: `--token <token>` (for one-time use)
- [ ] Can logout: `fractary forge logout` (clears session state)
- [ ] Can check auth status: `fractary forge whoami`
- [ ] Token is read from `FRACTARY_TOKEN` environment variable (no persistent storage)

## Functional Requirements

- **FR01**: `forge init` - Initialize Forge configuration in a project with directory structure and config file
- **FR02**: `forge install <name>` - Install agent/tool from registry with version support
- **FR03**: `forge uninstall <name>` - Remove installed plugin
- **FR04**: `forge list` - List installed packages with filtering options (--global, --local, --type, --json)
- **FR05**: `forge info <name>` - Show detailed package information including versions and dependencies
- **FR06**: `forge lock` - Generate/validate lockfile with integrity hashes
- **FR07**: `forge update [name]` - Update packages with strategy support (latest, patch, minor)
- **FR08**: `forge fork <source> <target>` - Fork package to local registry
- **FR09**: `forge merge <name>` - Merge upstream changes with conflict resolution
- **FR10**: `forge search <query>` - Search Stockyard with filtering and pagination
- **FR11**: `forge login` - Authenticate with Stockyard
- **FR12**: `forge logout` - Clear Stockyard authentication
- **FR13**: `forge whoami` - Show authentication status
- **FR14**: `forge registry add <name> <url>` - Add registry with priority support
- **FR15**: `forge registry remove <name>` - Remove registry
- **FR16**: `forge registry list` - List configured registries
- **FR17**: `forge cache clear [pattern]` - Clear manifest cache
- **FR18**: `forge cache stats` - Show cache statistics

## Non-Functional Requirements

- **NFR01**: All long operations (>1s) must show progress indicators (performance)
- **NFR02**: All commands must have comprehensive `--help` text (usability)
- **NFR03**: All commands must support JSON output where applicable (interoperability)
- **NFR04**: Error messages must include contextual help hints (usability)
- **NFR05**: Exit codes must follow standard convention (0=success, 1+=error) (reliability)
- **NFR06**: No breaking changes to existing CLI commands (compatibility)
- **NFR07**: Unit test coverage target: >90% (maintainability)
- **NFR08**: Commands must gracefully handle network failures with automatic cache fallback (resilience)

## Technical Design

### Architecture Changes

The Forge commands will be added to the existing `fractary/cli` architecture under `src/commands/forge/`. Each command is a separate module that imports SDK functionality from `@fractary/forge`.

```
cli/
├── src/
│   ├── cli.ts                    # Main CLI entry (add forge subcommand)
│   ├── commands/
│   │   ├── faber/               # Existing faber commands
│   │   ├── codex/               # Existing codex commands
│   │   └── forge/               # NEW: Forge commands
│   │       ├── index.ts         # Main forge command aggregator
│   │       ├── init.ts
│   │       ├── install.ts
│   │       ├── uninstall.ts
│   │       ├── list.ts
│   │       ├── info.ts
│   │       ├── lock.ts
│   │       ├── update.ts
│   │       ├── fork.ts
│   │       ├── merge.ts
│   │       ├── search.ts
│   │       ├── login.ts
│   │       ├── logout.ts
│   │       ├── whoami.ts
│   │       ├── registry/
│   │       │   ├── index.ts     # Registry subcommand aggregator
│   │       │   ├── add.ts
│   │       │   ├── remove.ts
│   │       │   └── list.ts
│   │       └── cache/
│   │           ├── index.ts     # Cache subcommand aggregator
│   │           ├── clear.ts
│   │           └── stats.ts
│   └── utils/
│       ├── forge-config.ts      # NEW: Forge config helper
│       ├── logger.ts            # Existing (extend if needed)
│       └── formatters.ts        # NEW: Output formatting utilities
```

### Data Model

**Configuration Structure** (`.fractary/plugins/forge/config.json`):
```json
{
  "stockyard": {
    "url": "https://stockyard.fractary.dev",
    "enabled": true
  },
  "globalPath": "~/.fractary/registry"
}
```

**Authentication**: Token is read from `FRACTARY_TOKEN` environment variable only (no persistent storage in config files for security). The `forge login` command validates the token and stores the authenticated username in session state only.

**Lockfile Structure** (`.fractary/plugins/forge/lockfile.json`):
```json
{
  "version": 1,
  "generated": "2025-12-15T00:00:00Z",
  "packages": {
    "my-agent": {
      "version": "1.0.0",
      "source": "local",
      "path": ".fractary/agents/my-agent",
      "integrity": "sha256-..."
    }
  }
}
```

### API Design

All commands interact with the `@fractary/forge` SDK:

- `Registry.installer.installPlugin(name, options)` - Install
- `Registry.installer.uninstallPlugin(name, options)` - Uninstall
- `Registry.resolver.list(options)` - List installed
- `Registry.resolver.search(query, options)` - Search
- `Registry.configManager.loadConfig()` - Load config
- `Registry.configManager.addRegistry(config, scope)` - Add registry
- `Registry.manifestCache.clear(pattern?)` - Clear cache
- `Registry.manifestCache.getStats()` - Cache stats
- `LockfileManager.generate(options)` - Generate lockfile
- `LockfileManager.validate()` - Validate lockfile
- `UpdateChecker.checkUpdates()` - Check for updates
- `UpdateManager.update(options)` - Apply updates
- `ForkManager.fork(source, target, options)` - Fork package
- `ForkManager.merge(name, options)` - Merge upstream
- `StockyardClient.login(token)` - Authenticate
- `StockyardClient.logout()` - Clear auth
- `StockyardClient.whoami()` - Check auth

### UI/UX Changes

**Progress Indicators** (using `ora`):
```typescript
const spinner = ora('Installing my-agent...').start();
// ... operation
spinner.succeed('Installed my-agent@1.0.0');
```

**Success Messages**:
```
✓ Installed @fractary/plugin@1.0.0
  • 3 agents
  • 5 tools
  • 2 workflows

Installed locally to: .fractary/plugins/@fractary/plugin
```

**Error Messages with Context**:
```
✗ Installation failed: Plugin not found in any registry

Try:
  • Check plugin name spelling
  • Run: fractary forge search <keyword>
  • Verify registry: fractary forge registry list
```

**Formatted Tables** (using `cli-table3`):
```
NAME              TYPE    VERSION    SOURCE      UPDATES
my-agent          agent   1.0.0      local       -
another-agent     agent   2.1.0      global      2.2.0 available
my-tool           tool    1.5.0      stockyard   -
```

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Not found (plugin, registry, component) |
| 4 | Permission denied |
| 5 | Network error |
| 6 | Checksum verification failed |
| 7 | Configuration error |

## Implementation Plan

### Phase 0: SDK API Audit
**Status**: ⬜ Not Started

**Objective**: Audit `@fractary/forge` SDK to verify available APIs and document any gaps before implementation

**Tasks**:
- [ ] Review `@fractary/forge` SDK source code and exports
- [ ] Document actual available methods vs. spec assumptions
- [ ] Identify SDK API gaps that need implementation
- [ ] Create SDK API mapping document (expected → actual)
- [ ] Coordinate with SDK team for any missing functionality
- [ ] Update spec if SDK APIs differ significantly

**Estimated Scope**: Research and documentation, ~1 day

**Rationale**: The spec references methods like `Registry.installer.installPlugin()` and `ForkManager.fork()`. Verifying these exist before implementation prevents rework.

### Phase 1: Core Commands
**Status**: ⬜ Not Started

**Objective**: Implement foundational commands for initialization, installation, listing, and info

**Tasks**:
- [ ] Create `src/commands/forge/index.ts` with command aggregation
- [ ] Implement `forge init` command with prompts and config creation
- [ ] Implement `forge install` command with all flag support
- [ ] Implement `forge uninstall` command
- [ ] Implement `forge list` command with filtering
- [ ] Implement `forge info` command with version display
- [ ] Create `src/utils/forge-config.ts` helper
- [ ] Create `src/utils/formatters.ts` for output formatting
- [ ] Add progress indicators using `ora`
- [ ] Add colored output using `chalk`
- [ ] Write unit tests for all commands
- [ ] Test basic installation workflows

**Estimated Scope**: 6 commands, ~1500 lines

### Phase 2: Lockfile & Updates
**Status**: ⬜ Not Started

**Objective**: Implement lockfile management and package update functionality

**Tasks**:
- [ ] Implement `forge lock` command with validation
- [ ] Implement `forge update` command with strategies
- [ ] Add `--check` and `--dry-run` modes
- [ ] Handle breaking change warnings
- [ ] Write integration tests
- [ ] Test update workflows

**Estimated Scope**: 2 commands, ~600 lines

### Phase 3: Registry Management
**Status**: ⬜ Not Started

**Objective**: Implement registry configuration commands

**Tasks**:
- [ ] Create `src/commands/forge/registry/index.ts`
- [ ] Implement `forge registry add` with priority and validation
- [ ] Implement `forge registry remove`
- [ ] Implement `forge registry list`
- [ ] Test multi-registry configuration
- [ ] Write integration tests

**Estimated Scope**: 3 commands, ~400 lines

### Phase 4: Cache Management
**Status**: ⬜ Not Started

**Objective**: Implement cache management commands

**Tasks**:
- [ ] Create `src/commands/forge/cache/index.ts`
- [ ] Implement `forge cache clear` with pattern support
- [ ] Implement `forge cache stats` with formatted output
- [ ] Write unit tests

**Estimated Scope**: 2 commands, ~200 lines

### Phase 5: Fork & Merge
**Status**: ⬜ Not Started

**Objective**: Implement forking and merge functionality

**Tasks**:
- [ ] Implement `forge fork` command
- [ ] Implement `forge merge` command with `auto`, `local`, `upstream` strategies
- [ ] Implement `--preview` flag for merge preview
- [ ] Write tests for fork workflows
- [ ] Document deferred `--strategy manual` for future phase

**Note**: Manual conflict resolution UX is deferred to a future phase. Initial implementation supports only automated strategies (auto, local, upstream).

**Estimated Scope**: 2 commands, ~400 lines (reduced due to deferred manual strategy)

### Phase 6: Stockyard & Auth
**Status**: ⬜ Not Started

**Objective**: Implement Stockyard integration and authentication

**Tasks**:
- [ ] Implement `forge search` with pagination
- [ ] Implement `forge login` with interactive flow
- [ ] Implement `forge logout`
- [ ] Implement `forge whoami`
- [ ] Polish UX (spinners, tables, colors)
- [ ] Write comprehensive documentation
- [ ] Final testing and QA

**Estimated Scope**: 4 commands, ~500 lines

## Files to Create/Modify

### New Files
- `src/commands/forge/index.ts`: Main forge command aggregator
- `src/commands/forge/init.ts`: Initialize command
- `src/commands/forge/install.ts`: Install command
- `src/commands/forge/uninstall.ts`: Uninstall command
- `src/commands/forge/list.ts`: List command
- `src/commands/forge/info.ts`: Info command
- `src/commands/forge/lock.ts`: Lockfile command
- `src/commands/forge/update.ts`: Update command
- `src/commands/forge/fork.ts`: Fork command
- `src/commands/forge/merge.ts`: Merge command
- `src/commands/forge/search.ts`: Search command
- `src/commands/forge/login.ts`: Login command
- `src/commands/forge/logout.ts`: Logout command
- `src/commands/forge/whoami.ts`: Whoami command
- `src/commands/forge/registry/index.ts`: Registry subcommand aggregator
- `src/commands/forge/registry/add.ts`: Registry add command
- `src/commands/forge/registry/remove.ts`: Registry remove command
- `src/commands/forge/registry/list.ts`: Registry list command
- `src/commands/forge/cache/index.ts`: Cache subcommand aggregator
- `src/commands/forge/cache/clear.ts`: Cache clear command
- `src/commands/forge/cache/stats.ts`: Cache stats command
- `src/utils/forge-config.ts`: Forge configuration helper
- `src/utils/formatters.ts`: Output formatting utilities
- `test/commands/forge/*.test.ts`: Unit tests for all commands
- `test/integration/forge/*.test.ts`: Integration tests
- `docs/forge.md`: User documentation

### Modified Files
- `src/cli.ts`: Add forge subcommand routing
- `package.json`: Add new dependencies (ora, chalk, cli-table3, inquirer)

## Testing Strategy

### Unit Tests
Test each command handler with mocked SDK functions:
```typescript
jest.mock('@fractary/forge');

describe('forge install', () => {
  it('should call SDK installer with correct options', async () => {
    const mockInstall = jest.fn().mockResolvedValue({...});
    (Registry.installer.installPlugin as jest.Mock) = mockInstall;

    await installCommand('@test/plugin', { global: true });

    expect(mockInstall).toHaveBeenCalledWith('@test/plugin', {
      scope: 'global',
      force: false,
      // ...
    });
  });
});
```

### Integration Tests
Test with real SDK and mock file system:
```typescript
import { vol } from 'memfs';
jest.mock('fs-extra', () => require('memfs'));

describe('install integration', () => {
  it('should install plugin to correct location', async () => {
    vol.fromJSON({'/home/user/.fractary/registry/': null});
    const result = await Registry.installer.installPlugin('@test/plugin', {scope: 'global'});
    expect(vol.existsSync(result.installPath)).toBe(true);
  });
});
```

### E2E Tests
Test complete CLI flow with subprocess:
```typescript
describe('forge CLI e2e', () => {
  it('should install plugin globally', () => {
    const output = execSync('fractary forge install @test/plugin --global', {encoding: 'utf-8'});
    expect(output).toContain('✓ Installed @test/plugin');
  });
});
```

### Performance Tests
- Measure installation time for various package sizes
- Test concurrent installations
- Benchmark search query response times

## Dependencies

- `@fractary/forge`: ^1.0.0 - Core SDK for registry operations
- `commander`: ^11.0.0 - CLI framework
- `inquirer`: ^9.0.0 - Interactive prompts
- `chalk`: ^5.0.0 - Colored terminal output
- `ora`: ^7.0.0 - Progress spinners
- `cli-table3`: ^0.6.3 - Formatted tables
- `@types/inquirer`: ^9.0.0 - TypeScript types (dev)
- `@types/cli-table3`: ^0.6.0 - TypeScript types (dev)

## Risks and Mitigations

- **Risk**: SDK API changes during development
  - **Likelihood**: Medium
  - **Impact**: High
  - **Mitigation**: Pin SDK version, coordinate with SDK team, use interface abstractions

- **Risk**: Stockyard API not ready
  - **Likelihood**: Medium
  - **Impact**: Medium
  - **Mitigation**: Implement stub responses, defer auth commands if needed

- **Risk**: Breaking existing CLI commands
  - **Likelihood**: Low
  - **Impact**: High
  - **Mitigation**: Comprehensive regression testing, feature flags for new commands

- **Risk**: Complex merge conflict resolution UX
  - **Likelihood**: High
  - **Impact**: Medium
  - **Mitigation**: Start with simple strategies, iterate on UX based on feedback

## Documentation Updates

- `README.md`: Add forge command overview
- `docs/forge.md`: Complete user guide with examples
- `docs/forge-api.md`: SDK integration reference
- `CHANGELOG.md`: Document new features

## Rollout Plan

1. **Alpha**: Internal testing with core commands (init, install, list)
2. **Beta**: Community preview with full command set
3. **GA**: Full release with documentation and support

## Success Metrics

- All 18 commands implemented and functional: 100%
- Unit test coverage: >90%
- Integration test coverage: >80%
- Help text present for all commands: 100%
- Error messages include hints: 100%
- No regressions in existing commands: 0 failures

## Implementation Notes

### Key SDK Integration Patterns

All commands should follow consistent patterns:

1. **Load Config First**:
```typescript
const config = await loadForgeConfig();
```

2. **Use SDK Methods**:
```typescript
const result = await Registry.installer.installPlugin(name, options);
```

3. **Show Progress**:
```typescript
const spinner = ora('Installing...').start();
try {
  await operation();
  spinner.succeed('Done');
} catch (error) {
  spinner.fail('Failed');
}
```

4. **Format Output**:
```typescript
if (flags.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  formatHumanReadable(result);
}
```

5. **Handle Errors Gracefully**:
```typescript
catch (error) {
  handleError(error, 'Installation failed');
}
```

### Network Resilience & Offline Fallback

Commands should automatically fall back to cached data when network is unavailable:

```typescript
async function withNetworkFallback<T>(
  networkOperation: () => Promise<T>,
  cacheOperation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await networkOperation();
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn(`⚠ Network unavailable, using cached data for ${context}`);
      return await cacheOperation();
    }
    throw error;
  }
}
```

**Commands with cache fallback**:
- `forge list` - Use cached package metadata
- `forge info` - Use cached package info
- `forge search` - Return "offline" message (no cache for search)
- `forge install` - Fail with helpful message suggesting `--offline` mode (future)

### Authentication via Environment Variable

Token is read from `FRACTARY_TOKEN` environment variable:

```typescript
function getAuthToken(): string | undefined {
  return process.env.FRACTARY_TOKEN;
}

async function requireAuth(): Promise<string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(
      'Authentication required. Set FRACTARY_TOKEN environment variable.\n' +
      'Get your token at: https://stockyard.fractary.dev/settings/tokens'
    );
  }
  return token;
}
```

### Reference Specifications
- **SPEC-FORGE-004**: Complete command specifications with implementation examples
- **SPEC-FORGE-006**: CLI integration patterns, error handling, testing guidelines
