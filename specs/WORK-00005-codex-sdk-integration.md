---
title: "Codex CLI SDK Integration"
work_id: "WORK-00005"
issue_url: "https://github.com/fractary/cli/issues/6"
type: "refactor"
status: "draft"
created: "2025-12-14"
updated: "2025-12-14"
author: "Claude"
---

# Codex CLI SDK Integration Specification

## Overview

Update the `fractary codex` CLI commands to fully integrate with the @fractary/codex SDK v0.1.3+, following the recommended patterns from the [CLI Integration Guide](https://github.com/fractary/codex/blob/main/docs/guides/cli-integration.md).

## Problem Statement

The CLI currently implements codex functionality using a defensive fallback pattern with several critical issues:

1. **Code duplication**: Same logic exists in SDK and CLI
2. **No type safety**: CLI doesn't leverage SDK's TypeScript types and Zod schemas
3. **Feature gaps**: Multi-tier caching, multi-provider storage, permission system unused
4. **Maintenance burden**: Bug fixes must be applied in two places
5. **ESM/CJS mismatch**: SDK is ESM (`"type": "module"`), CLI uses CommonJS
6. **Configuration mismatch**: CLI uses `.fractary/plugins/codex/config.json` but SDK expects `.fractary/codex.yaml`
7. **No unified client**: Commands access managers directly instead of using wrapper pattern
8. **Missing SDK error types**: Custom errors instead of SDK's error classes

## Solution

Restructure CLI following SDK's recommended patterns:

1. **Create CodexClient wrapper** following minimal-cli.ts example
2. **Migrate configuration** from JSON to YAML format
3. **Use SDK error classes** for consistent error handling
4. **Replace all fallback implementations** with SDK calls
5. **Leverage SDK types** for full type safety
6. **Document any gaps** where SDK lacks functionality

## SDK Documentation References

- [CLI Integration Guide](https://github.com/fractary/codex/blob/main/docs/guides/cli-integration.md) - Primary reference
- [API Reference](https://github.com/fractary/codex/blob/main/docs/guides/api-reference.md) - Complete API docs
- [Configuration Guide](https://github.com/fractary/codex/blob/main/docs/guides/configuration.md) - Config structure
- [minimal-cli.ts Example](https://github.com/fractary/codex/blob/main/docs/examples/minimal-cli.ts) - Reference implementation
- [simple-fetch.ts Example](https://github.com/fractary/codex/blob/main/docs/examples/simple-fetch.ts) - Fetch pattern

## SDK Capabilities (v0.1.3+)

### Reference System
- `parseReference(uri)` - Parse codex:// URIs into components
- `resolveReference(uri, options)` - Resolve to cache/filesystem paths
- `buildUri(org, project, path)` - Construct valid URIs
- `validateUri(uri)` - Boolean URI validation
- `isLegacyReference(ref)` - Check for legacy @codex/ format
- `convertLegacyReference(ref, defaultOrg)` - Convert to modern format

### Storage Management
- **StorageManager** - Multi-provider orchestration with automatic fallback
  - `create(options)` - Factory with provider configuration
  - `registerProvider(provider, priority)` - Add storage source
  - `fetch(reference, options)` - Retrieve content (returns: buffer, type, size, source)
  - `exists(reference)` - Check availability without fetching
- **Providers**:
  - `LocalStorage` - Filesystem (basePath config)
  - `GitHubStorage` - GitHub repos (token, baseUrl for Enterprise)
  - `HttpStorage` - HTTP/HTTPS endpoints (baseUrl, headers)

### Cache Management
- **CacheManager** - Multi-tier caching (L1 memory, L2 disk, L3 network)
  - `get(uri)` - Retrieve cached entry
  - `set(uri, content, options)` - Store with TTL
  - `has(uri)` - Check existence
  - `delete(uri)` - Remove entry
  - `clear()` - Clear all entries
  - `getStats()` - Cache statistics (entries, size, hit rate, memory/disk breakdown)
  - `prune()` - Remove expired entries
  - `invalidate(pattern)` - Pattern-based invalidation
- `createCacheManager(config)` - Factory function

### Type Registry
- **TypeRegistry** - Artifact type management
  - `get(name)` - Get type definition
  - `register(type)` - Add custom type
  - `unregister(name)` - Remove type
  - `list()` - List all types (built-in + custom)
  - `detectType(path)` - Auto-detect from path
  - `getTtl(path)` - Get TTL for path
- `BUILT_IN_TYPES` - docs, specs, config, logs, schemas
- `createDefaultRegistry()` - Factory function

### Sync Management
- **SyncManager** - Bidirectional file synchronization
  - `createPlan(options)` - Generate sync plan
  - `execute(plan)` - Execute sync operations
- `createSyncPlan(config, options)` - Plan generation
- Pattern matching utilities

### Migration Utilities
- `detectVersion(config)` - Detect v2.x vs v3.0
- `isLegacyConfig(config)` - Type guard for v2.x
- `isModernConfig(config)` - Type guard for v3.0
- `needsMigration(config)` - Check if migration needed
- `migrateConfig(config, options)` - Perform migration
- `validateMigratedConfig(config)` - Validate result
- `generateMigrationReport(result)` - Human-readable report
- `convertLegacyReferences(content)` - Convert @codex/ to codex://

### Configuration
- `loadConfig(options)` - Load from `.fractary/codex.yaml` with validation
- `CodexConfigSchema` - Zod schema for validation
- `getDefaultConfig()` - Default configuration
- `resolveOrganization()` - Auto-detect from git remote

### Error Classes
- `InvalidUriError` - URI parsing/validation failures
- `StorageError` - Storage provider errors
- `CacheError` - Cache operation failures
- `ConfigError` - Configuration issues
- `PermissionError` - Access control violations

### Permission System
- **PermissionManager** - Access control (none/read/write/admin)
- `createPermissionManager(config)` - Factory function

### MCP Server
- `createMcpServer(options)` - Model Context Protocol server
  - Exposes tools for URI parsing, fetching, caching
  - Two modes: standalone or embedded

## Implementation Phases

### Phase 0: CodexClient Wrapper [PREREQUISITE]

**Objective**: Create unified client wrapper following SDK's recommended pattern.

**Reference**: [minimal-cli.ts](https://github.com/fractary/codex/blob/main/docs/examples/minimal-cli.ts)

**Tasks**:

1. **Create `src/tools/codex/client.ts`**
   ```typescript
   import {
     CacheManager,
     StorageManager,
     TypeRegistry,
     loadConfig,
     InvalidUriError,
     StorageError,
     CacheError
   } from '@fractary/codex';

   export class CodexClient {
     private cache: CacheManager;
     private storage: StorageManager;
     private types: TypeRegistry;
     private config: CodexConfig;

     private constructor(
       cache: CacheManager,
       storage: StorageManager,
       types: TypeRegistry,
       config: CodexConfig
     ) {
       this.cache = cache;
       this.storage = storage;
       this.types = types;
       this.config = config;
     }

     static async create(options?: {
       cacheDir?: string;
       configPath?: string;
     }): Promise<CodexClient> {
       // Load config (YAML format)
       const config = await loadConfig(options?.configPath);

       // Initialize managers
       const storage = StorageManager.create({
         providers: config.storage
       });
       const cache = await CacheManager.create({
         cacheDir: options?.cacheDir || config.cacheDir
       });
       const types = TypeRegistry.create(config.types);

       return new CodexClient(cache, storage, types, config);
     }

     async fetch(uri: string, options?: FetchOptions): Promise<FetchResult> {
       // Validate URI early
       if (!validateUri(uri)) {
         throw new InvalidUriError(`Invalid codex URI: ${uri}`);
       }

       // Cache-first fetch
       if (!options?.bypassCache) {
         const cached = await this.cache.get(uri);
         if (cached) {
           return { content: cached, fromCache: true };
         }
       }

       // Fetch from storage
       const result = await this.storage.fetch(parseReference(uri));

       // Update cache
       await this.cache.set(uri, result.buffer, {
         ttl: options?.ttl || this.types.getTtl(uri)
       });

       return { content: result.buffer, fromCache: false };
     }

     async invalidateCache(pattern?: string): Promise<void> {
       if (pattern) {
         await this.cache.invalidate(pattern);
       } else {
         await this.cache.clear();
       }
     }

     async getCacheStats(): Promise<CacheStats> {
       return this.cache.getStats();
     }

     getTypeRegistry(): TypeRegistry {
       return this.types;
     }
   }
   ```

2. **Create singleton instance getter** (`src/tools/codex/get-client.ts`)
   ```typescript
   let clientInstance: CodexClient | null = null;

   export async function getClient(): Promise<CodexClient> {
     if (!clientInstance) {
       clientInstance = await CodexClient.create();
     }
     return clientInstance;
   }
   ```

**Acceptance Criteria**:
- [ ] CodexClient wrapper created following SDK pattern
- [ ] Lazy initialization via getClient()
- [ ] All SDK managers accessible through client
- [ ] Error classes from SDK properly exported
- [ ] TypeScript types from SDK available

### Phase 1: Configuration Migration [PREREQUISITE]

**Objective**: Migrate from JSON config to YAML format expected by SDK.

**Current**: `.fractary/plugins/codex/config.json`
**Target**: `.fractary/codex.yaml`

**Reference**: [Configuration Guide](https://github.com/fractary/codex/blob/main/docs/guides/configuration.md)

**Tasks**:

1. **Create migration utility**
   - Detect existing config.json
   - Convert to codex.yaml format
   - Handle environment variables (${GITHUB_TOKEN})
   - Create backup of old config

2. **Update config structure**
   ```yaml
   organization: fractary
   cacheDir: .codex-cache

   storage:
     - type: local
       basePath: ./knowledge
       priority: 10
     - type: github
       token: ${GITHUB_TOKEN}
       baseUrl: https://api.github.com
       branch: main
       priority: 50
     - type: http
       baseUrl: https://codex.example.com
       timeout: 30000
       priority: 100

   types:
     custom-type:
       name: custom-type
       description: Custom artifact type
       patterns:
         - custom/**/*.md
       defaultTtl: 604800
       archiveAfterDays: 90

   permissions:
     default: read
     rules:
       - pattern: internal/**
         permission: none
       - pattern: public/**
         permission: read

   sync:
     bidirectional: true
     conflictResolution: prompt
     exclude:
       - node_modules/**
       - .git/**
   ```

3. **Add to init command**
   - Create .fractary/codex.yaml (not config.json)
   - Use SDK's getDefaultConfig()
   - Support environment variable injection

**Acceptance Criteria**:
- [ ] Config migration utility created
- [ ] YAML config structure matches SDK expectations
- [ ] Environment variables supported
- [ ] Backward compatibility maintained during transition
- [ ] Migration documented in guide

### Phase 2: Cache Commands [HIGH PRIORITY]

**Objective**: Replace all custom cache logic with CodexClient + CacheManager.

**Current State**: Custom index.json parsing, manual file operations

**Tasks**:

1. **Update `cache/list.ts`**
   ```typescript
   import { getClient } from '../../client';

   export async function cacheListCommand(options) {
     const client = await getClient();
     const stats = await client.getCacheStats();

     // Filter and format entries
     const entries = stats.entries.filter(e => {
       if (options.expired) return e.expired;
       if (options.type) return e.type === options.type;
       return true;
     });

     if (options.json) {
       console.log(JSON.stringify({ entries, count: entries.length }));
     } else {
       // Pretty print (existing format)
       formatEntries(entries);
     }
   }
   ```

2. **Update `cache/clear.ts`**
   ```typescript
   import { getClient } from '../../client';

   export async function cacheClearCommand(options) {
     const client = await getClient();

     if (options.all) {
       await client.invalidateCache();
     } else if (options.expired) {
       const cache = (await getClient()).getCacheManager();
       await cache.prune();
     } else if (options.pattern) {
       await client.invalidateCache(options.pattern);
     }

     console.log(chalk.green('✓ Cache cleared'));
   }
   ```

3. **Update `cache/stats.ts`**
   ```typescript
   import { getClient } from '../../client';

   export async function cacheStatsCommand(options) {
     const client = await getClient();
     const stats = await client.getCacheStats();

     if (options.json) {
       console.log(JSON.stringify(stats, null, 2));
     } else {
       // Format stats (existing display)
       formatStats(stats);
     }
   }
   ```

**Acceptance Criteria**:
- [ ] All cache commands use CodexClient
- [ ] No direct filesystem operations
- [ ] Statistics match SDK's format
- [ ] Existing options preserved
- [ ] Error handling uses SDK error classes

### Phase 3: Fetch Command [HIGH PRIORITY]

**Objective**: Replace custom fetch with CodexClient.fetch().

**Reference**: [simple-fetch.ts](https://github.com/fractary/codex/blob/main/docs/examples/simple-fetch.ts)

**Tasks**:

1. **Update `fetch.ts`**
   ```typescript
   import { getClient } from '../client';
   import { InvalidUriError, StorageError } from '@fractary/codex';

   export async function fetchCommand(uri: string, options) {
     try {
       const client = await getClient();

       // Fetch using client (handles cache, storage, TTL)
       const result = await client.fetch(uri, {
         bypassCache: options.bypassCache,
         ttl: options.ttl
       });

       if (options.json) {
         console.log(JSON.stringify({
           uri,
           content: result.content.toString(),
           metadata: {
             fromCache: result.fromCache,
             size: result.content.length
           }
         }, null, 2));
       } else if (options.output) {
         await fs.writeFile(options.output, result.content);
         console.log(chalk.green('✓'), `Written to ${options.output}`);
       } else {
         console.log(result.content.toString());
       }
     } catch (error) {
       if (error instanceof InvalidUriError) {
         console.error(chalk.red('Error: Invalid URI format'));
         console.log(chalk.dim('Expected: codex://org/project/path/to/file.md'));
       } else if (error instanceof StorageError) {
         console.error(chalk.red('Error: Failed to fetch document'));
         console.log(chalk.dim(error.message));
       } else {
         throw error;
       }
       process.exit(1);
     }
   }
   ```

2. **Remove custom implementations**
   - Delete parseCodexUri() fallback
   - Delete fetchFromGitHub() curl logic
   - Delete custom cache read/write
   - Delete TTL calculation

**Acceptance Criteria**:
- [ ] All fetch operations use CodexClient
- [ ] SDK error classes for error handling
- [ ] Options preserved (--bypass-cache, --ttl, --json, --output)
- [ ] Multi-provider storage (GitHub, HTTP, local) works
- [ ] Cache behavior matches previous implementation

### Phase 4: Types Commands [MEDIUM PRIORITY]

**Objective**: Use TypeRegistry through CodexClient.

**Tasks**:

1. **Update `types/list.ts`**
   ```typescript
   import { getClient } from '../../client';

   export async function typesListCommand(options) {
     const client = await getClient();
     const registry = client.getTypeRegistry();

     const types = registry.list();

     // Filter built-in vs custom if needed
     const filtered = types.filter(t => {
       if (options.builtinOnly) return registry.isBuiltIn(t.name);
       if (options.customOnly) return !registry.isBuiltIn(t.name);
       return true;
     });

     if (options.json) {
       console.log(JSON.stringify({ types: filtered }));
     } else {
       formatTypes(filtered);
     }
   }
   ```

2. **Update `types/add.ts`**
   ```typescript
   import { getClient } from '../../client';

   export async function typesAddCommand(name: string, options) {
     const client = await getClient();
     const registry = client.getTypeRegistry();

     registry.register({
       name,
       description: options.description,
       patterns: options.pattern.split(','),
       defaultTtl: parseTtl(options.ttl),
       archiveAfterDays: options.archiveAfterDays
     });

     console.log(chalk.green('✓'), `Type '${name}' registered`);
   }
   ```

3. **Update `types/show.ts`** and **`types/remove.ts`**

**Acceptance Criteria**:
- [ ] All type operations use TypeRegistry
- [ ] BUILT_IN_TYPES from SDK (not hardcoded)
- [ ] Custom type persistence works
- [ ] Validation via SDK schemas

### Phase 5: Init Command [MEDIUM PRIORITY]

**Objective**: Use SDK's initialization and configuration.

**Tasks**:

1. **Update `init.ts`**
   ```typescript
   import { getDefaultConfig, resolveOrganization } from '@fractary/codex';
   import yaml from 'js-yaml';

   export async function initCommand(options) {
     // Resolve organization
     const org = options.org || resolveOrganization();

     // Get default config from SDK
     const config = getDefaultConfig();
     config.organization = org;

     // Enable MCP if requested
     if (options.mcp) {
       config.mcp = { enabled: true, port: 3000 };
     }

     // Write YAML config
     const configPath = '.fractary/codex.yaml';
     await fs.mkdir(path.dirname(configPath), { recursive: true });
     await fs.writeFile(
       configPath,
       yaml.dump(config),
       'utf-8'
     );

     // Initialize cache directory
     await fs.mkdir(config.cacheDir, { recursive: true });

     console.log(chalk.green('✓ Codex initialized'));
     console.log(chalk.dim(`Config: ${configPath}`));
     console.log(chalk.dim(`Cache: ${config.cacheDir}/`));
   }
   ```

**Acceptance Criteria**:
- [ ] Uses getDefaultConfig() from SDK
- [ ] Creates .fractary/codex.yaml (not config.json)
- [ ] Organization resolution via SDK
- [ ] YAML format with proper structure

### Phase 6: Migrate Command [MEDIUM PRIORITY]

**Objective**: Use SDK migration utilities.

**Tasks**:

1. **Update `migrate.ts`**
   ```typescript
   import {
     detectVersion,
     needsMigration,
     migrateConfig,
     validateMigratedConfig,
     generateMigrationReport
   } from '@fractary/codex';

   export async function migrateCommand(options) {
     // Load existing config
     const oldConfig = await loadOldConfig();

     // Detect version
     const version = detectVersion(oldConfig);
     console.log(`Detected version: ${version}`);

     if (!needsMigration(oldConfig)) {
       console.log(chalk.yellow('Configuration is already v3.0'));
       return;
     }

     if (options.dryRun) {
       const preview = migrateConfig(oldConfig, { dryRun: true });
       console.log(generateMigrationReport(preview));
       return;
     }

     // Create backup
     if (!options.noBackup) {
       await createBackup(oldConfig);
     }

     // Migrate
     const result = migrateConfig(oldConfig);

     // Validate
     validateMigratedConfig(result.config);

     // Write new config
     await writeYamlConfig(result.config);

     // Show report
     console.log(generateMigrationReport(result));
   }
   ```

**Acceptance Criteria**:
- [ ] Uses SDK migration functions
- [ ] Proper version detection
- [ ] Dry-run mode works
- [ ] Backup functionality preserved
- [ ] Converts JSON to YAML

### Phase 7: Health Command [MEDIUM PRIORITY]

**Objective**: SDK-assisted diagnostics.

**Tasks**:

1. **Update `health.ts`**
   ```typescript
   import { getClient } from '../client';
   import { loadConfig } from '@fractary/codex';

   export async function healthCommand(options) {
     const checks = [];

     // Config check (SDK validation)
     try {
       const config = await loadConfig();
       checks.push({ name: 'Configuration', status: 'ok', config });
     } catch (error) {
       checks.push({ name: 'Configuration', status: 'error', error: error.message });
     }

     // Cache check
     try {
       const client = await getClient();
       const stats = await client.getCacheStats();
       checks.push({ name: 'Cache', status: 'ok', stats });
     } catch (error) {
       checks.push({ name: 'Cache', status: 'error', error: error.message });
     }

     // Storage check (test connectivity)
     try {
       const client = await getClient();
       // Test fetch on a known document
       checks.push({ name: 'Storage', status: 'ok' });
     } catch (error) {
       checks.push({ name: 'Storage', status: 'error', error: error.message });
     }

     if (options.json) {
       console.log(JSON.stringify({ checks }));
     } else {
       formatHealthChecks(checks);
     }
   }
   ```

**Acceptance Criteria**:
- [ ] Config validation via SDK
- [ ] Cache health via CacheManager
- [ ] Storage connectivity check
- [ ] --fix option works
- [ ] SDK version displayed

### Phase 8: Sync Commands [LOWER PRIORITY]

**Objective**: Evaluate and integrate SyncManager.

**Analysis Required**:
- Test SyncManager with project sync scenario
- Verify bidirectional sync works
- Check conflict resolution options
- Document any limitations

**Tasks**:

1. **Evaluate SDK sync capabilities** (investigation task)
2. **Update `sync/project.ts`** (if SDK supports)
3. **Update `sync/org.ts`** (if SDK supports)
4. **Document gaps** (if SDK incomplete)

**Acceptance Criteria**:
- [ ] SDK sync capabilities evaluated
- [ ] Integration completed OR gaps documented
- [ ] Existing functionality preserved

## Testing Strategy

### Unit Tests

```
src/tools/codex/
├── client.ts
├── client.test.ts
├── commands/
│   ├── cache/
│   │   ├── list.ts
│   │   ├── list.test.ts
│   │   ├── clear.ts
│   │   ├── clear.test.ts
│   │   ├── stats.ts
│   │   └── stats.test.ts
│   ├── fetch.ts
│   ├── fetch.test.ts
│   └── ...
```

**Coverage**:
- CodexClient initialization and methods
- Each command: success path, error handling, options
- SDK error class handling
- YAML config loading

### Integration Tests

```
test/integration/
├── codex-init.test.ts
├── codex-fetch.test.ts
├── codex-cache.test.ts
├── codex-types.test.ts
└── codex-migration.test.ts
```

**Scenarios**:
1. Full init → fetch → cache cycle
2. Config migration JSON → YAML
3. Type registration workflow
4. Error handling with SDK errors

### Manual Testing Checklist

| Command | Test Case | Expected |
|---------|-----------|----------|
| `codex init` | No existing config | Creates .fractary/codex.yaml |
| `codex init --org test` | Explicit org | Uses provided org |
| `codex fetch codex://...` | Valid URI | Fetches content |
| `codex fetch --bypass-cache` | Cache bypass | Skips cache |
| `codex cache list` | With entries | Shows entries |
| `codex cache clear --all` | Clear all | Empties cache |
| `codex types list` | Default | Shows built-in types |
| `codex types add custom` | Add type | Registers in YAML |
| `codex migrate` | Old config.json | Creates codex.yaml |
| `codex health` | All checks | Reports status |

## SDK Gap Audit Template

After implementation, document SDK coverage:

| Command | SDK Coverage | Components Used | Notes |
|---------|-------------|-----------------|-------|
| `codex init` | Full | getDefaultConfig(), resolveOrganization() | Creates YAML config |
| `codex fetch` | Full | CodexClient.fetch() | Cache + Storage |
| `codex cache list` | Full | CacheManager.getStats() | Full stats |
| `codex cache clear` | Full | CacheManager.clear/prune/invalidate() | Pattern support |
| `codex cache stats` | Full | CacheManager.getStats() | Memory/disk breakdown |
| `codex types list` | Full | TypeRegistry.list() | Built-in + custom |
| `codex types add` | Full | TypeRegistry.register() | Zod validation |
| `codex migrate` | Full | migrateConfig(), detectVersion() | JSON→YAML |
| `codex health` | Partial | loadConfig(), CacheManager | Custom storage check |
| `codex sync project` | TBD | SyncManager (evaluation needed) | - |
| `codex sync org` | TBD | SyncManager (evaluation needed) | - |

## Migration Guide for Users

### Upgrading from v2.0 Config

When users run commands after upgrading, detect old config and prompt:

```
⚠ Legacy configuration detected at .fractary/plugins/codex/config.json

The Codex SDK now uses YAML configuration format.
Run `fractary codex migrate` to upgrade to the new format.

This will:
- Convert config.json → codex.yaml
- Move from .fractary/plugins/codex/ → .fractary/
- Create backup of old config
- Preserve all your settings
```

## Rollout Plan

### Development Order

1. **Week 1**: Phase 0 (CodexClient wrapper) + Phase 1 (Config migration)
2. **Week 2**: Phase 2 (Cache commands) + Phase 3 (Fetch command)
3. **Week 3**: Phase 4 (Types commands) + Phase 5 (Init command)
4. **Week 4**: Phase 6 (Migrate command) + Phase 7 (Health command)
5. **Week 5**: Phase 8 (Sync evaluation) + Testing + Documentation

### Migration Safety

- Each phase can be merged independently
- Old config.json supported during transition (migration prompt)
- Fallbacks removed only after SDK path verified
- All changes backward compatible where possible

## Success Metrics

1. **Code Reduction**: ~60% reduction in codex command code
2. **Type Safety**: Full TypeScript coverage with SDK types
3. **Test Coverage**: >80% for all commands
4. **SDK Coverage**: >90% of operations use SDK
5. **No Regressions**: All existing behavior preserved
6. **Error Handling**: All SDK error classes properly used

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `src/tools/codex/client.ts` | 0 | NEW - CodexClient wrapper |
| `src/tools/codex/get-client.ts` | 0 | NEW - Singleton getter |
| `src/tools/codex/commands/init.ts` | 1 | YAML config creation |
| `src/tools/codex/commands/migrate.ts` | 1 | JSON→YAML migration |
| `src/tools/codex/commands/cache/list.ts` | 2 | Use CodexClient |
| `src/tools/codex/commands/cache/clear.ts` | 2 | Use CodexClient |
| `src/tools/codex/commands/cache/stats.ts` | 2 | Use CodexClient |
| `src/tools/codex/commands/fetch.ts` | 3 | Full SDK rewrite |
| `src/tools/codex/commands/types/*.ts` | 4 | Use TypeRegistry |
| `src/tools/codex/commands/health.ts` | 7 | SDK validation |
| `src/tools/codex/commands/sync/*.ts` | 8 | Evaluate SyncManager |

## Dependencies

- `@fractary/codex@^0.1.3` (or latest)
- `js-yaml@^4.1.0` (for YAML config)
- Update `package.json` dependencies

## Open Questions

1. **MCP Server Integration**: Standalone or embedded mode?
   - Recommendation: Support both, default to embedded

2. **Storage Provider Tokens**: Config file vs environment only?
   - Recommendation: Environment variables with ${VAR} syntax in YAML

3. **TypeRegistry Persistence**: Where to save custom types?
   - Recommendation: In codex.yaml under `types` section

4. **SyncManager Capabilities**: Full bidirectional support?
   - Recommendation: Evaluate in Phase 8, document gaps

## References

- [Codex SDK Repository](https://github.com/fractary/codex)
- [CLI Integration Guide](https://github.com/fractary/codex/blob/main/docs/guides/cli-integration.md)
- [API Reference](https://github.com/fractary/codex/blob/main/docs/guides/api-reference.md)
- [Configuration Guide](https://github.com/fractary/codex/blob/main/docs/guides/configuration.md)
- [Minimal CLI Example](https://github.com/fractary/codex/blob/main/docs/examples/minimal-cli.ts)

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-14 | 1.0.0 | Initial specification |
| 2025-12-14 | 2.0.0 | Updated with SDK documentation, CodexClient pattern, YAML config |
