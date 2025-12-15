"use strict";
/**
 * Configuration migration utility
 *
 * Converts legacy v2.x JSON config to v3.0 YAML format
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
exports.isLegacyConfig = isLegacyConfig;
exports.migrateConfig = migrateConfig;
exports.writeYamlConfig = writeYamlConfig;
exports.getDefaultYamlConfig = getDefaultYamlConfig;
exports.readYamlConfig = readYamlConfig;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * Detect if a config file is legacy JSON format
 */
async function isLegacyConfig(configPath) {
    try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        // Check for legacy v2.x structure
        return (config.version === '3.0' ||
            config.organizationSlug !== undefined ||
            config.directories !== undefined ||
            config.rules !== undefined);
    }
    catch {
        return false;
    }
}
/**
 * Migrate legacy JSON config to v3.0 YAML format
 */
async function migrateConfig(legacyConfigPath, options) {
    const warnings = [];
    try {
        // Read legacy config
        const content = await fs.readFile(legacyConfigPath, 'utf-8');
        const legacy = JSON.parse(content);
        // Create backup if requested
        let backupPath;
        if (options?.createBackup !== false) {
            const suffix = options?.backupSuffix || new Date().toISOString().replace(/[:.]/g, '-');
            backupPath = `${legacyConfigPath}.backup-${suffix}`;
            await fs.writeFile(backupPath, content, 'utf-8');
        }
        // Build YAML config
        const yamlConfig = {
            organization: legacy.organization || legacy.organizationSlug || 'default'
        };
        // Migrate cache configuration
        if (legacy.cache) {
            yamlConfig.cacheDir = legacy.cache.directory || '.codex-cache';
            // Note: Legacy config had cache.defaultTtl, cache.maxSize with string formats
            // These are now handled by CacheManager config separately
        }
        // Migrate storage providers
        if (legacy.storage?.providers) {
            yamlConfig.storage = [];
            // Convert providers object to array
            for (const [type, config] of Object.entries(legacy.storage.providers)) {
                if (type === 'github') {
                    const githubConfig = config;
                    yamlConfig.storage.push({
                        type: 'github',
                        token: githubConfig.token || '${GITHUB_TOKEN}',
                        apiBaseUrl: githubConfig.baseUrl || 'https://api.github.com',
                        branch: githubConfig.branch || 'main',
                        priority: 50
                    });
                }
                else if (type === 'http') {
                    const httpConfig = config;
                    yamlConfig.storage.push({
                        type: 'http',
                        baseUrl: httpConfig.baseUrl,
                        headers: httpConfig.headers,
                        timeout: httpConfig.timeout || 30000,
                        priority: 100
                    });
                }
                else if (type === 'local') {
                    const localConfig = config;
                    yamlConfig.storage.push({
                        type: 'local',
                        basePath: localConfig.basePath || './knowledge',
                        followSymlinks: localConfig.followSymlinks || false,
                        priority: 10
                    });
                }
                else {
                    warnings.push(`Unknown storage provider type: ${type}`);
                }
            }
            // If no providers configured, add default GitHub
            if (yamlConfig.storage.length === 0) {
                yamlConfig.storage.push({
                    type: 'github',
                    token: '${GITHUB_TOKEN}',
                    apiBaseUrl: 'https://api.github.com',
                    branch: 'main',
                    priority: 50
                });
                warnings.push('No storage providers found, added default GitHub provider');
            }
        }
        // Migrate custom types
        if (legacy.types?.custom && Array.isArray(legacy.types.custom)) {
            yamlConfig.types = {
                custom: {}
            };
            for (const customType of legacy.types.custom) {
                if (customType.name) {
                    yamlConfig.types.custom[customType.name] = {
                        description: customType.description,
                        patterns: customType.patterns || [],
                        defaultTtl: customType.defaultTtl,
                        archiveAfterDays: customType.archiveAfterDays,
                        archiveStorage: customType.archiveStorage
                    };
                }
            }
        }
        // Migrate sync configuration
        if (legacy.sync) {
            yamlConfig.sync = {
                bidirectional: true,
                conflictResolution: 'prompt',
                exclude: [
                    'node_modules/**',
                    '.git/**',
                    '**/*.log',
                    '.env'
                ]
            };
            if (legacy.sync.environments) {
                warnings.push('Sync environments are not directly supported in v3.0 - please configure sync rules manually');
            }
        }
        // Migrate MCP configuration
        if (legacy.mcp) {
            yamlConfig.mcp = {
                enabled: legacy.mcp.enabled || false,
                port: legacy.mcp.port || 3000
            };
        }
        return {
            success: true,
            yamlConfig,
            warnings,
            backupPath
        };
    }
    catch (error) {
        throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Write YAML config to file
 */
async function writeYamlConfig(config, outputPath) {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    // Convert to YAML with nice formatting
    const yamlContent = yaml.dump(config, {
        indent: 2,
        lineWidth: 80,
        noRefs: true,
        sortKeys: false
    });
    // Write to file
    await fs.writeFile(outputPath, yamlContent, 'utf-8');
}
/**
 * Get default YAML config
 */
function getDefaultYamlConfig(organization) {
    return {
        organization,
        cacheDir: '.codex-cache',
        storage: [
            {
                type: 'local',
                basePath: './knowledge',
                followSymlinks: false,
                priority: 10
            },
            {
                type: 'github',
                token: '${GITHUB_TOKEN}',
                apiBaseUrl: 'https://api.github.com',
                branch: 'main',
                priority: 50
            },
            {
                type: 'http',
                baseUrl: 'https://codex.example.com',
                timeout: 30000,
                priority: 100
            }
        ],
        types: {
            custom: {}
        },
        permissions: {
            default: 'read',
            rules: [
                {
                    pattern: 'internal/**',
                    permission: 'none'
                },
                {
                    pattern: 'public/**',
                    permission: 'read'
                }
            ]
        },
        sync: {
            bidirectional: true,
            conflictResolution: 'prompt',
            exclude: [
                'node_modules/**',
                '.git/**',
                '**/*.log',
                '.env'
            ]
        },
        mcp: {
            enabled: false,
            port: 3000
        }
    };
}
/**
 * Read YAML config from file
 */
async function readYamlConfig(configPath) {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(content);
    if (!config.organization) {
        throw new Error('Invalid config: organization is required');
    }
    return config;
}
//# sourceMappingURL=migrate-config.js.map