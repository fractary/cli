/**
 * Credential Storage Utility
 *
 * Secure storage of registry credentials with encryption.
 */
/**
 * Registry authentication
 */
export interface RegistryAuth {
    type: 'oauth' | 'token' | 'basic';
    token?: string;
    username?: string;
    password?: string;
    email?: string;
    authenticated_at?: string;
    expires_at?: string;
    scopes?: string[];
}
/**
 * Credentials storage
 */
export interface Credentials {
    version: string;
    created_at: string;
    updated_at: string;
    registries: Record<string, RegistryAuth>;
}
/**
 * Get credentials file path
 */
export declare function getCredentialFile(): string;
/**
 * Get auth directory
 */
export declare function getAuthDirectory(): string;
/**
 * Setup credential file with proper permissions
 */
export declare function setupCredentialFile(): Promise<void>;
/**
 * Check if credential file exists
 */
export declare function checkCredentialFile(): Promise<boolean>;
/**
 * Load credentials from storage
 */
export declare function loadCredentials(): Promise<Credentials>;
/**
 * Save credentials to storage
 */
export declare function saveCredentials(credentials: Credentials): Promise<void>;
/**
 * Get auth for specific registry
 */
export declare function getRegistryAuth(registry: string): Promise<RegistryAuth | null>;
/**
 * Save auth for specific registry
 */
export declare function saveRegistryAuth(registry: string, auth: RegistryAuth): Promise<void>;
/**
 * Clear auth for specific registry
 */
export declare function clearRegistryAuth(registry: string): Promise<void>;
/**
 * Clear all auth
 */
export declare function clearAllAuth(): Promise<void>;
/**
 * Check if auth exists and is valid
 */
export declare function hasValidAuth(registry: string): Promise<boolean>;
/**
 * Get all authenticated registries
 */
export declare function getAuthenticatedRegistries(): Promise<string[]>;
/**
 * Encrypt credential value (basic encryption for non-sensitive data)
 */
export declare function encryptCredential(value: string, key?: string): string;
/**
 * Decrypt credential value
 */
export declare function decryptCredential(encrypted: string, key?: string): string;
/**
 * Export credentials (should be protected)
 */
export declare function exportCredentials(): Promise<string>;
/**
 * Validate credential structure
 */
export declare function isValidAuth(auth: RegistryAuth): boolean;
//# sourceMappingURL=credential-storage.d.ts.map