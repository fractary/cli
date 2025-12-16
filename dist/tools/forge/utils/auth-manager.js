"use strict";
/**
 * Auth Manager Utility
 *
 * Manage registry authentication and user sessions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRegistry = authenticateRegistry;
exports.isAuthenticated = isAuthenticated;
exports.getAuthStatus = getAuthStatus;
exports.getStoredAuth = getStoredAuth;
exports.saveAuth = saveAuth;
exports.clearAuth = clearAuth;
exports.validateCredentials = validateCredentials;
exports.createTokenAuth = createTokenAuth;
exports.createBasicAuth = createBasicAuth;
exports.createOAuthAuth = createOAuthAuth;
exports.isAuthExpired = isAuthExpired;
exports.getTimeUntilExpiration = getTimeUntilExpiration;
exports.fetchUserInfo = fetchUserInfo;
exports.formatAuthStatus = formatAuthStatus;
const credential_storage_1 = require("./credential-storage");
/**
 * Authenticate with registry
 */
async function authenticateRegistry(registry, auth, userInfo) {
    // Store authentication
    const authEntry = {
        ...auth,
        authenticated_at: new Date().toISOString(),
    };
    // Set default expiration to 24 hours if not specified
    if (!authEntry.expires_at) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        authEntry.expires_at = expiresAt.toISOString();
    }
    // Add user info if provided
    if (userInfo) {
        authEntry.username = userInfo.username;
        authEntry.email = userInfo.email;
    }
    await (0, credential_storage_1.saveRegistryAuth)(registry, authEntry);
    return userInfo || {
        id: 'unknown',
        username: authEntry.username || 'unknown',
        email: authEntry.email || '',
    };
}
/**
 * Check if authenticated
 */
async function isAuthenticated(registry) {
    return (0, credential_storage_1.hasValidAuth)(registry);
}
/**
 * Get auth status for registry
 */
async function getAuthStatus(registry) {
    const auth = await (0, credential_storage_1.getRegistryAuth)(registry);
    if (!auth) {
        return {
            authenticated: false,
            registry,
            is_expired: false,
        };
    }
    const isExpired = auth.expires_at ? new Date(auth.expires_at) < new Date() : false;
    return {
        authenticated: !isExpired && !!auth.token,
        registry,
        auth_type: auth.type,
        username: auth.username,
        email: auth.email,
        authenticated_at: auth.authenticated_at,
        expires_at: auth.expires_at,
        is_expired: isExpired,
    };
}
/**
 * Get stored auth
 */
async function getStoredAuth(registry) {
    const auth = await (0, credential_storage_1.getRegistryAuth)(registry);
    if (!auth) {
        return null;
    }
    // Check expiration
    if (auth.expires_at && new Date(auth.expires_at) < new Date()) {
        // Clear expired auth
        await (0, credential_storage_1.clearRegistryAuth)(registry);
        return null;
    }
    return auth;
}
/**
 * Save auth
 */
async function saveAuth(registry, auth) {
    await (0, credential_storage_1.saveRegistryAuth)(registry, auth);
}
/**
 * Clear auth
 */
async function clearAuth(registry) {
    await (0, credential_storage_1.clearRegistryAuth)(registry);
}
/**
 * Validate credentials
 */
function validateCredentials(auth) {
    if (!auth.type) {
        return false;
    }
    switch (auth.type) {
        case 'token':
            if (!auth.token || auth.token.trim().length === 0) {
                return false;
            }
            break;
        case 'basic':
            if (!auth.username || !auth.password) {
                return false;
            }
            break;
        case 'oauth':
            if (!auth.token) {
                return false;
            }
            break;
        default:
            return false;
    }
    return true;
}
/**
 * Create token auth
 */
function createTokenAuth(token, email) {
    return {
        type: 'token',
        token,
        email,
    };
}
/**
 * Create basic auth
 */
function createBasicAuth(username, password, email) {
    return {
        type: 'basic',
        username,
        password,
        email,
    };
}
/**
 * Create OAuth auth
 */
function createOAuthAuth(token, email, scopes) {
    return {
        type: 'oauth',
        token,
        email,
        scopes,
    };
}
/**
 * Check if auth is expired
 */
function isAuthExpired(auth) {
    if (!auth.expires_at) {
        return false;
    }
    return new Date(auth.expires_at) < new Date();
}
/**
 * Get time until expiration
 */
function getTimeUntilExpiration(auth) {
    if (!auth.expires_at) {
        return null;
    }
    const expiresAt = new Date(auth.expires_at);
    const now = new Date();
    const millisUntilExpiration = expiresAt.getTime() - now.getTime();
    return Math.max(0, millisUntilExpiration);
}
/**
 * Mock fetch user info (for testing)
 */
async function fetchUserInfo(registry, auth) {
    // This would be implemented to actually fetch user info from the registry
    // For now, return mock data based on auth
    const username = auth.username || 'anonymous';
    const email = auth.email || `${username}@${registry}`;
    return {
        id: `user_${username}`,
        username,
        email,
        name: username,
        avatar_url: `https://api.example.com/avatars/${username}.jpg`,
        profile_url: `https://example.com/${username}`,
        organizations: [],
    };
}
/**
 * Format auth status for display
 */
function formatAuthStatus(status) {
    if (!status.authenticated) {
        return `Not authenticated with ${status.registry}`;
    }
    let message = `Authenticated as ${status.username}`;
    if (status.email) {
        message += ` (${status.email})`;
    }
    if (status.expires_at) {
        const expiresAt = new Date(status.expires_at);
        message += ` [expires ${expiresAt.toLocaleString()}]`;
    }
    return message;
}
//# sourceMappingURL=auth-manager.js.map