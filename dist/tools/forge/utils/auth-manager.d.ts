/**
 * Auth Manager Utility
 *
 * Manage registry authentication and user sessions.
 */
import { RegistryAuth } from './credential-storage';
/**
 * User information
 */
export interface UserInfo {
    id: string;
    username: string;
    email: string;
    name?: string;
    avatar_url?: string;
    profile_url?: string;
    organizations?: Organization[];
}
/**
 * Organization information
 */
export interface Organization {
    id: string;
    name: string;
    slug: string;
    type: string;
}
/**
 * Auth status
 */
export interface AuthStatus {
    authenticated: boolean;
    registry: string;
    auth_type?: string;
    username?: string;
    email?: string;
    authenticated_at?: string;
    expires_at?: string;
    is_expired: boolean;
}
/**
 * Authenticate with registry
 */
export declare function authenticateRegistry(registry: string, auth: RegistryAuth, userInfo?: UserInfo): Promise<UserInfo>;
/**
 * Check if authenticated
 */
export declare function isAuthenticated(registry: string): Promise<boolean>;
/**
 * Get auth status for registry
 */
export declare function getAuthStatus(registry: string): Promise<AuthStatus>;
/**
 * Get stored auth
 */
export declare function getStoredAuth(registry: string): Promise<RegistryAuth | null>;
/**
 * Save auth
 */
export declare function saveAuth(registry: string, auth: RegistryAuth): Promise<void>;
/**
 * Clear auth
 */
export declare function clearAuth(registry: string): Promise<void>;
/**
 * Validate credentials
 */
export declare function validateCredentials(auth: RegistryAuth): boolean;
/**
 * Create token auth
 */
export declare function createTokenAuth(token: string, email?: string): RegistryAuth;
/**
 * Create basic auth
 */
export declare function createBasicAuth(username: string, password: string, email?: string): RegistryAuth;
/**
 * Create OAuth auth
 */
export declare function createOAuthAuth(token: string, email?: string, scopes?: string[]): RegistryAuth;
/**
 * Check if auth is expired
 */
export declare function isAuthExpired(auth: RegistryAuth): boolean;
/**
 * Get time until expiration
 */
export declare function getTimeUntilExpiration(auth: RegistryAuth): number | null;
/**
 * Mock fetch user info (for testing)
 */
export declare function fetchUserInfo(registry: string, auth: RegistryAuth): Promise<UserInfo>;
/**
 * Format auth status for display
 */
export declare function formatAuthStatus(status: AuthStatus): string;
//# sourceMappingURL=auth-manager.d.ts.map