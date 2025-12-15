"use strict";
/**
 * Singleton getter for CodexClient
 *
 * Provides lazy initialization of the CodexClient instance.
 * This ensures we only create one client instance across all command invocations,
 * avoiding repeated configuration loading and manager initialization.
 *
 * Uses dynamic imports to avoid loading @fractary/codex SDK at module load time,
 * which prevents CLI hangs when running simple commands like --help.
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.resetClient = resetClient;
exports.isClientInitialized = isClientInitialized;
/**
 * Singleton instance
 */
let clientInstance = null;
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
async function getClient(options) {
    if (!clientInstance) {
        // Dynamic import to avoid loading SDK at module time
        const { CodexClient } = await Promise.resolve().then(() => __importStar(require('./client')));
        clientInstance = await CodexClient.create(options);
    }
    return clientInstance;
}
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
function resetClient() {
    clientInstance = null;
}
/**
 * Check if client has been initialized
 *
 * @returns true if client instance exists
 */
function isClientInitialized() {
    return clientInstance !== null;
}
//# sourceMappingURL=get-client.js.map