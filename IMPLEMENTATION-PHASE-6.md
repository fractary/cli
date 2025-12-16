# Phase 6 Implementation Plan: Stockyard and Authentication

**Status**: In Progress
**Date**: 2025-12-15
**Target Completion**: 2025-12-15
**Scope**: 4 commands + enhanced search, ~700 lines

## Overview

Phase 6 implements Stockyard integration and authentication management. Users can authenticate with Stockyard registries, search across multiple sources, and manage their authentication state.

## Commands to Implement

### 1. `forge login [registry]`
**File**: `src/tools/forge/commands/registry/login.ts`
**Purpose**: Authenticate with Stockyard or custom registry

**Implementation Points**:
- Prompt for credentials (username/password or token)
- Store credentials securely in keychain/environment
- Support token-based authentication
- Support OAuth/SSO if available
- Test credentials before saving
- Store authentication state and expiration

**Example Usage**:
```bash
fractary forge login
fractary forge login stockyard
fractary forge login custom-registry
fractary forge login --token YOUR_TOKEN
fractary forge login --token-env STOCKYARD_TOKEN
```

**Options**:
- `[registry]` - Optional registry name (default: Stockyard)
- `--token <token>` - Provide token directly
- `--token-env <var>` - Use environment variable for token
- `--username <user>` - Username for interactive prompt
- `--force` - Force re-authentication
- `--verbose` - Show authentication details

### 2. `forge logout [registry]`
**File**: `src/tools/forge/commands/registry/logout.ts`
**Purpose**: Deauthenticate from registry

**Implementation Points**:
- Remove stored credentials
- Clear authentication tokens
- Support logout from all registries
- Preserve configuration but remove auth
- Confirmation prompt for safety

**Example Usage**:
```bash
fractary forge logout
fractary forge logout stockyard
fractary forge logout custom-registry
fractary forge logout --all
```

**Options**:
- `[registry]` - Optional registry name (default: Stockyard)
- `--all` - Logout from all registries
- `--force` - Skip confirmation
- `--verbose` - Show logout details

### 3. `forge whoami [registry]`
**File**: `src/tools/forge/commands/registry/whoami.ts`
**Purpose**: Show current authenticated user

**Implementation Points**:
- Fetch current user information
- Display user profile details
- Show authentication status per registry
- Display token expiration if applicable
- Show user's organizations/teams

**Example Usage**:
```bash
fractary forge whoami
fractary forge whoami stockyard
fractary forge whoami --json
fractary forge whoami --verbose
```

**Options**:
- `[registry]` - Optional registry name (default: Stockyard)
- `--json` - Output as JSON
- `--verbose` - Show detailed user information
- `--all` - Show user info for all registries

### 4. Enhanced `forge search` (Phase 1 existing command)
**File**: Update `src/tools/forge/commands/registry/search.ts`
**Purpose**: Enhanced search with Stockyard support

**Implementation Points**:
- Add authentication-aware search
- Search across multiple registries
- Filter by component type, tags, author
- Support full-text search
- Display search results with ratings/downloads
- Pagination support

**Example Usage**:
```bash
fractary forge search keyword
fractary forge search --type agent keyword
fractary forge search --author username keyword
fractary forge search --registry stockyard keyword
fractary forge search --tags tag1,tag2 keyword
fractary forge search --limit 50 keyword
```

**Options**:
- `--type <agent|tool|workflow|template>` - Filter by type
- `--author <name>` - Filter by author
- `--registry <name>` - Search specific registry
- `--tags <tags>` - Filter by tags (comma-separated)
- `--limit <n>` - Results limit
- `--offset <n>` - Pagination offset
- `--json` - JSON output
- `--sort <relevance|downloads|rating|recent>` - Sort results

## Authentication Storage

### Credential Storage Strategy

```
~/.fractary/auth/
├── credentials.json (encrypted)
├── tokens.json (encrypted)
└── sessions.json (unencrypted metadata)
```

### Credentials Structure

```json
{
  "version": "1.0.0",
  "registries": {
    "stockyard": {
      "type": "oauth|token|basic",
      "authentication": {
        "token": "encrypted_token",
        "username": "username",
        "email": "email@example.com"
      },
      "session": {
        "authenticated_at": "2025-12-15T10:00:00Z",
        "expires_at": "2025-12-16T10:00:00Z",
        "scopes": ["read", "write"]
      },
      "user": {
        "id": "user_id",
        "username": "username",
        "email": "email@example.com",
        "profile_url": "https://..."
      }
    }
  }
}
```

## File Structure After Phase 6

```
src/tools/forge/
├── commands/
│   ├── registry/
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   ├── list.ts
│   │   ├── info.ts
│   │   ├── search.ts               # Updated
│   │   ├── lock.ts
│   │   ├── update.ts
│   │   ├── registry-add.ts
│   │   ├── registry-remove.ts
│   │   ├── registry-list.ts
│   │   ├── cache-clear.ts
│   │   ├── cache-stats.ts
│   │   ├── fork.ts
│   │   ├── merge.ts
│   │   ├── login.ts                # NEW
│   │   ├── logout.ts               # NEW
│   │   ├── whoami.ts               # NEW
│   │   └── index.ts                # Updated
├── utils/
│   ├── forge-config.ts
│   ├── formatters.ts
│   ├── lockfile-manager.ts
│   ├── update-checker.ts
│   ├── cache-manager.ts
│   ├── fork-manager.ts
│   ├── merge-manager.ts
│   ├── component-differ.ts
│   ├── auth-manager.ts             # NEW
│   └── credential-storage.ts       # NEW
└── index.ts
```

## Utility Modules

### auth-manager.ts

```typescript
interface RegistryAuth {
  type: 'oauth' | 'token' | 'basic';
  token?: string;
  username?: string;
  password?: string;
  email?: string;
  authenticated_at?: string;
  expires_at?: string;
  scopes?: string[];
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar_url?: string;
  profile_url?: string;
  organizations?: Organization[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
}

// Functions to implement:
- authenticateRegistry(registry: string, auth: RegistryAuth): Promise<UserInfo>
- getStoredAuth(registry: string): Promise<RegistryAuth | null>
- saveAuth(registry: string, auth: RegistryAuth): Promise<void>
- clearAuth(registry: string): Promise<void>
- isAuthenticated(registry: string): Promise<boolean>
- testCredentials(registry: string, auth: RegistryAuth): Promise<boolean>
- fetchUserInfo(registry: string): Promise<UserInfo>
- getAuthStatus(registry: string): Promise<AuthStatus>
```

### credential-storage.ts

```typescript
// Functions to implement:
- encryptCredentials(credentials: string): string
- decryptCredentials(encrypted: string): string
- getCredentialFile(): string
- loadCredentials(): Promise<Credentials>
- saveCredentials(creds: Credentials): Promise<void>
- clearCredentials(registry: string): Promise<void>
- checkCredentialFile(): Promise<boolean>
- setupCredentialFile(): Promise<void>
```

## Acceptance Criteria

- [ ] Login command authenticates with Stockyard
- [ ] Credentials stored securely
- [ ] Logout clears stored credentials
- [ ] Whoami displays current user
- [ ] Search works with authentication
- [ ] Token-based auth supported
- [ ] Session expiration handled
- [ ] Multiple registry auth supported
- [ ] Error messages are helpful
- [ ] Help text is comprehensive

## Integration Points

- Works with existing registry management
- Credentials used for search and install
- Auth status shown in info commands
- Logout triggers on token expiration
- Search results reflect authenticated access

## Security Considerations

- Never log credentials
- Store tokens securely (OS keychain if available)
- Support token rotation
- Validate certificate chains
- Time-limited sessions
- Encryption for stored credentials
- Clear separation of dev/prod credentials

## Command Examples

### Authentication Workflow

```bash
# Login to Stockyard
fractary forge login stockyard

# Check current user
fractary forge whoami

# Search with authentication
fractary forge search agent-type:search

# Logout
fractary forge logout stockyard
```

### Multi-Registry Workflow

```bash
# Login to multiple registries
fractary forge login stockyard
fractary forge login custom-registry

# Check status across registries
fractary forge whoami --all

# Logout from all
fractary forge logout --all
```

## Next Steps

1. Implement credential-storage.ts utility
2. Implement auth-manager.ts utility
3. Implement login.ts command
4. Implement logout.ts command
5. Implement whoami.ts command
6. Enhance search.ts for auth support
7. Test authentication workflows
8. Integrate with main forge command
9. Update Phase 6 documentation

## Technical Notes

- Use native OS keychain (Keychain on macOS, Credential Manager on Windows, secret-service on Linux)
- Fallback to encrypted file storage if keychain unavailable
- Support token-based auth for CI/CD environments
- Implement token refresh for long-lived sessions
- Cache user info with short TTL (5-10 minutes)
- Validate server certificates (no insecure mode for production)

## Phase Summary

Phase 6 completes the Forge CLI specification with:
- **Authentication**: Secure credential storage and token management
- **User Management**: Current user info and multi-registry auth
- **Enhanced Search**: Registry-aware search with authentication
- **Security**: Credential encryption and OS keychain integration

Combined with Phases 1-5, this provides a complete CLI for:
- Component installation and management
- Registry configuration and administration
- Version tracking and updates
- Cache management
- Component forking and merging
- Stockyard integration and authentication
