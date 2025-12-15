/**
 * Singleton Forge Client Getter
 *
 * Provides a singleton instance of ForgeClient for use across commands
 */
import { ForgeClient, type ForgeClientOptions } from './client';
/**
 * Get singleton ForgeClient instance
 *
 * Creates a new client if one doesn't exist, otherwise returns the existing instance.
 * The client is lazily initialized on first use.
 */
export declare function getClient(options?: ForgeClientOptions): Promise<ForgeClient>;
/**
 * Reset the client instance
 *
 * Useful for testing or when configuration changes require a fresh client.
 */
export declare function resetClient(): void;
/**
 * Check if client is initialized
 */
export declare function isClientInitialized(): boolean;
//# sourceMappingURL=get-client.d.ts.map