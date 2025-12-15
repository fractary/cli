/**
 * Singleton getter for CodexClient
 *
 * Provides lazy initialization of the CodexClient instance.
 * This ensures we only create one client instance across all command invocations,
 * avoiding repeated configuration loading and manager initialization.
 *
 * @example
 * ```typescript
 * import { getClient } from './get-client';
 *
 * export async function fetchCommand(uri: string) {
 *   const client = await getClient();
 *   const result = await client.fetch(uri);
 *   console.log(result.content.toString());
 * }
 * ```
 */
import { CodexClient, type CodexClientOptions } from './client';
/**
 * Get the CodexClient singleton instance
 *
 * On first call, creates and initializes the client.
 * Subsequent calls return the same instance.
 *
 * @param options - Optional configuration (only used on first call)
 * @returns Promise resolving to CodexClient instance
 *
 * @example
 * ```typescript
 * const client = await getClient();
 * const stats = await client.getCacheStats();
 * ```
 */
export declare function getClient(options?: CodexClientOptions): Promise<CodexClient>;
/**
 * Reset the singleton instance
 *
 * Useful for testing or when configuration changes require a fresh client.
 *
 * @example
 * ```typescript
 * // After changing configuration
 * resetClient();
 * const client = await getClient(); // Will create new instance
 * ```
 */
export declare function resetClient(): void;
/**
 * Check if client has been initialized
 *
 * @returns true if client instance exists
 */
export declare function isClientInitialized(): boolean;
//# sourceMappingURL=get-client.d.ts.map