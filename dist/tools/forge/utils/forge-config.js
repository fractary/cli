"use strict";
/**
 * Forge Configuration Utilities
 *
 * Helper functions for loading and managing Forge configuration.
 * Integrates with @fractary/forge Registry SDK.
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
exports.getForgeDir = getForgeDir;
exports.getGlobalRegistryDir = getGlobalRegistryDir;
exports.getProjectConfigPath = getProjectConfigPath;
exports.getGlobalConfigPath = getGlobalConfigPath;
exports.isForgeInitialized = isForgeInitialized;
exports.loadForgeConfig = loadForgeConfig;
exports.saveForgeConfig = saveForgeConfig;
exports.getRegistryConfig = getRegistryConfig;
exports.getAuthToken = getAuthToken;
exports.isAuthenticated = isAuthenticated;
exports.requireAuth = requireAuth;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Get project-level Forge directory (.fractary/plugins/forge/)
 */
async function getForgeDir(cwd = process.cwd()) {
    return path.join(cwd, '.fractary', 'plugins', 'forge');
}
/**
 * Get global Forge registry directory (~/.fractary/registry/)
 */
function getGlobalRegistryDir() {
    return path.join(os.homedir(), '.fractary', 'registry');
}
/**
 * Get project config path
 */
async function getProjectConfigPath(cwd = process.cwd()) {
    const forgeDir = await getForgeDir(cwd);
    return path.join(forgeDir, 'config.json');
}
/**
 * Get global config path
 */
function getGlobalConfigPath() {
    return path.join(os.homedir(), '.fractary', 'config.json');
}
/**
 * Check if Forge is initialized in current project
 */
async function isForgeInitialized(cwd = process.cwd()) {
    const configPath = await getProjectConfigPath(cwd);
    return fs.pathExists(configPath);
}
/**
 * Load Forge configuration from project or global config
 *
 * Returns merged configuration suitable for Registry SDK
 */
async function loadForgeConfig(cwd = process.cwd()) {
    const projectRoot = cwd;
    const projectConfigPath = await getProjectConfigPath(cwd);
    const globalConfigPath = getGlobalConfigPath();
    // Try project config first
    if (await fs.pathExists(projectConfigPath)) {
        const config = await fs.readJson(projectConfigPath);
        return {
            config: normalizeConfig(config),
            projectRoot,
            configSource: 'project',
        };
    }
    // Fall back to global config
    if (await fs.pathExists(globalConfigPath)) {
        const config = await fs.readJson(globalConfigPath);
        return {
            config: normalizeConfig(config),
            projectRoot,
            configSource: 'global',
        };
    }
    // Use default config
    return {
        config: getDefaultConfig(),
        projectRoot,
        configSource: 'default',
    };
}
/**
 * Get default Forge configuration
 */
function getDefaultConfig() {
    return {
        registries: [
            {
                name: 'fractary',
                type: 'manifest',
                url: 'https://registry.fractary.dev/manifest.json',
                enabled: true,
                priority: 10,
                cache_ttl: 3600,
            },
        ],
    };
}
/**
 * Normalize configuration to match ForgeConfig type
 */
function normalizeConfig(config) {
    // Handle both old and new config formats
    if (config.registries) {
        return config;
    }
    // Convert old format to new format
    const registries = [];
    // Add Stockyard if configured
    if (config.stockyard?.enabled) {
        registries.push({
            name: 'stockyard',
            type: 'manifest',
            url: config.stockyard.url || 'https://stockyard.fractary.dev/manifest.json',
            enabled: true,
            priority: 10,
            cache_ttl: 3600,
        });
    }
    return {
        registries: registries.length > 0 ? registries : getDefaultConfig().registries,
    };
}
/**
 * Save Forge configuration to project config file
 */
async function saveForgeConfig(config, cwd = process.cwd()) {
    const configPath = await getProjectConfigPath(cwd);
    const forgeDir = path.dirname(configPath);
    // Ensure directory exists
    await fs.ensureDir(forgeDir);
    // Write config
    await fs.writeJson(configPath, config, { spaces: 2 });
}
/**
 * Get registry configuration from environment and config
 */
async function getRegistryConfig(cwd = process.cwd()) {
    const { config } = await loadForgeConfig(cwd);
    return {
        local: {
            enabled: true,
            paths: [
                path.join(cwd, '.fractary', 'agents'),
                path.join(cwd, '.fractary', 'tools'),
                path.join(cwd, '.fractary', 'workflows'),
                path.join(cwd, '.fractary', 'templates'),
            ],
        },
        global: {
            enabled: true,
            path: getGlobalRegistryDir(),
        },
        remote: {
            enabled: config.registries.length > 0,
            registries: config.registries,
        },
    };
}
/**
 * Get authentication token from environment
 */
function getAuthToken() {
    return process.env.FRACTARY_TOKEN;
}
/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getAuthToken();
}
/**
 * Require authentication, throw if not authenticated
 */
function requireAuth() {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Authentication required. Set FRACTARY_TOKEN environment variable.\\n' +
            'Get your token at: https://stockyard.fractary.dev/settings/tokens');
    }
    return token;
}
//# sourceMappingURL=forge-config.js.map