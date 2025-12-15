"use strict";
/**
 * Singleton Forge Client Getter
 *
 * Provides a singleton instance of ForgeClient for use across commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.resetClient = resetClient;
exports.isClientInitialized = isClientInitialized;
const client_1 = require("./client");
let clientInstance = null;
/**
 * Get singleton ForgeClient instance
 *
 * Creates a new client if one doesn't exist, otherwise returns the existing instance.
 * The client is lazily initialized on first use.
 */
async function getClient(options) {
    if (!clientInstance) {
        clientInstance = await client_1.ForgeClient.create(options);
    }
    return clientInstance;
}
/**
 * Reset the client instance
 *
 * Useful for testing or when configuration changes require a fresh client.
 */
function resetClient() {
    clientInstance = null;
}
/**
 * Check if client is initialized
 */
function isClientInitialized() {
    return clientInstance !== null;
}
//# sourceMappingURL=get-client.js.map