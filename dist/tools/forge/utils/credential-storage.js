"use strict";
/**
 * Credential Storage Utility
 *
 * Secure storage of registry credentials with encryption.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialFile = getCredentialFile;
exports.getAuthDirectory = getAuthDirectory;
exports.setupCredentialFile = setupCredentialFile;
exports.checkCredentialFile = checkCredentialFile;
exports.loadCredentials = loadCredentials;
exports.saveCredentials = saveCredentials;
exports.getRegistryAuth = getRegistryAuth;
exports.saveRegistryAuth = saveRegistryAuth;
exports.clearRegistryAuth = clearRegistryAuth;
exports.clearAllAuth = clearAllAuth;
exports.hasValidAuth = hasValidAuth;
exports.getAuthenticatedRegistries = getAuthenticatedRegistries;
exports.encryptCredential = encryptCredential;
exports.decryptCredential = decryptCredential;
exports.exportCredentials = exportCredentials;
exports.isValidAuth = isValidAuth;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Get credentials file path
 */
function getCredentialFile() {
    const home = os_1.default.homedir();
    return path_1.default.join(home, '.fractary', 'auth', 'credentials.json');
}
/**
 * Get auth directory
 */
function getAuthDirectory() {
    const home = os_1.default.homedir();
    return path_1.default.join(home, '.fractary', 'auth');
}
/**
 * Setup credential file with proper permissions
 */
async function setupCredentialFile() {
    const authDir = getAuthDirectory();
    const credFile = getCredentialFile();
    // Create auth directory
    await fs_1.promises.mkdir(authDir, { recursive: true, mode: 0o700 });
    // Create empty credentials file if it doesn't exist
    try {
        await fs_1.promises.stat(credFile);
    }
    catch (error) {
        const initialCreds = {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            registries: {},
        };
        const content = JSON.stringify(initialCreds, null, 2);
        await fs_1.promises.writeFile(credFile, content, { mode: 0o600 });
    }
}
/**
 * Check if credential file exists
 */
async function checkCredentialFile() {
    const credFile = getCredentialFile();
    try {
        await fs_1.promises.stat(credFile);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Load credentials from storage
 */
async function loadCredentials() {
    const credFile = getCredentialFile();
    try {
        await setupCredentialFile();
        const content = await fs_1.promises.readFile(credFile, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            registries: {},
        };
    }
}
/**
 * Save credentials to storage
 */
async function saveCredentials(credentials) {
    const credFile = getCredentialFile();
    await setupCredentialFile();
    credentials.updated_at = new Date().toISOString();
    const content = JSON.stringify(credentials, null, 2);
    await fs_1.promises.writeFile(credFile, content, { mode: 0o600 });
}
/**
 * Get auth for specific registry
 */
async function getRegistryAuth(registry) {
    const creds = await loadCredentials();
    return creds.registries[registry] || null;
}
/**
 * Save auth for specific registry
 */
async function saveRegistryAuth(registry, auth) {
    const creds = await loadCredentials();
    creds.registries[registry] = auth;
    await saveCredentials(creds);
}
/**
 * Clear auth for specific registry
 */
async function clearRegistryAuth(registry) {
    const creds = await loadCredentials();
    delete creds.registries[registry];
    await saveCredentials(creds);
}
/**
 * Clear all auth
 */
async function clearAllAuth() {
    const creds = await loadCredentials();
    creds.registries = {};
    await saveCredentials(creds);
}
/**
 * Check if auth exists and is valid
 */
async function hasValidAuth(registry) {
    const auth = await getRegistryAuth(registry);
    if (!auth) {
        return false;
    }
    // Check expiration
    if (auth.expires_at) {
        const expiresAt = new Date(auth.expires_at);
        if (expiresAt < new Date()) {
            return false;
        }
    }
    // Check required fields
    if (auth.type === 'token') {
        return !!auth.token;
    }
    else if (auth.type === 'basic') {
        return !!(auth.username && auth.password);
    }
    else if (auth.type === 'oauth') {
        return !!auth.token;
    }
    return false;
}
/**
 * Get all authenticated registries
 */
async function getAuthenticatedRegistries() {
    const creds = await loadCredentials();
    const authenticated = [];
    for (const [registry, auth] of Object.entries(creds.registries)) {
        if (auth && auth.authenticated_at) {
            // Check if not expired
            if (!auth.expires_at || new Date(auth.expires_at) >= new Date()) {
                authenticated.push(registry);
            }
        }
    }
    return authenticated;
}
/**
 * Encrypt credential value (basic encryption for non-sensitive data)
 */
function encryptCredential(value, key) {
    if (!key) {
        // Use machine ID as basic encryption key
        const machineId = crypto_1.default.createHash('sha256').update(os_1.default.hostname()).digest('hex');
        key = machineId.substring(0, 32);
    }
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0')), iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return iv:encrypted format
    return `${iv.toString('hex')}:${encrypted}`;
}
/**
 * Decrypt credential value
 */
function decryptCredential(encrypted, key) {
    if (!key) {
        const machineId = crypto_1.default.createHash('sha256').update(os_1.default.hostname()).digest('hex');
        key = machineId.substring(0, 32);
    }
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0')), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Export credentials (should be protected)
 */
async function exportCredentials() {
    const creds = await loadCredentials();
    return JSON.stringify(creds, null, 2);
}
/**
 * Validate credential structure
 */
function isValidAuth(auth) {
    if (!auth.type) {
        return false;
    }
    switch (auth.type) {
        case 'token':
            return !!auth.token;
        case 'basic':
            return !!(auth.username && auth.password);
        case 'oauth':
            return !!auth.token;
        default:
            return false;
    }
}
//# sourceMappingURL=credential-storage.js.map