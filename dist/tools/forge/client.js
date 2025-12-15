"use strict";
/**
 * ForgeClient - Unified client wrapper for Forge SDK
 *
 * Wraps AgentAPI, ToolAPI, DefinitionResolver, and other SDK managers
 * to provide a clean interface for CLI commands.
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
exports.ForgeClient = void 0;
const forge_1 = require("@fractary/forge");
const migrate_config_1 = require("./migrate-config");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Unified Forge client
 *
 * Provides high-level operations for:
 * - Agent resolution and management
 * - Tool resolution and execution
 * - Registry operations
 */
class ForgeClient {
    /**
     * Private constructor - use ForgeClient.create() instead
     */
    constructor(resolver, config, projectRoot) {
        this.resolver = resolver;
        this.config = config;
        this.organization = config.organization;
        this.projectRoot = projectRoot;
        // Initialize SDK managers with resolver config
        const sdkConfig = {
            definitions: {
                registry: ForgeClient.buildResolverConfig(config, projectRoot),
            },
        };
        this.agentAPI = new forge_1.AgentAPI(sdkConfig);
        this.toolAPI = new forge_1.ToolAPI(sdkConfig);
    }
    /**
     * Create ForgeClient instance
     */
    static async create(options) {
        const projectRoot = options?.projectRoot || process.cwd();
        const configPath = path.join(projectRoot, '.fractary/forge/config.yaml');
        // Load configuration
        let config;
        try {
            config = await (0, migrate_config_1.readYamlConfig)(configPath);
        }
        catch (error) {
            throw new Error(`Failed to load forge configuration. Run "fractary forge init" to create one.\nError: ${error.message}`);
        }
        // Override organization if provided
        if (options?.organization) {
            config.organization = options.organization;
        }
        // Build resolver config
        const resolverConfig = ForgeClient.buildResolverConfig(config, projectRoot);
        // Create resolver
        const resolver = new forge_1.DefinitionResolver(resolverConfig);
        return new ForgeClient(resolver, config, projectRoot);
    }
    /**
     * Build resolver configuration from YAML config
     */
    static buildResolverConfig(config, projectRoot) {
        return {
            local: {
                enabled: config.registry.local.enabled,
                paths: [
                    path.join(projectRoot, config.registry.local.agents_path),
                    path.join(projectRoot, config.registry.local.tools_path),
                ],
            },
            global: {
                enabled: config.registry.global.enabled,
                path: path.isAbsolute(config.registry.global.path)
                    ? config.registry.global.path
                    : path.join(os.homedir(), config.registry.global.path.replace('~/', '')),
            },
            stockyard: {
                enabled: config.registry.stockyard.enabled,
                url: config.registry.stockyard.url,
                apiKey: config.registry.stockyard.api_key,
            },
        };
    }
    // Agent operations
    /**
     * Resolve an agent definition
     */
    async resolveAgent(name) {
        return this.resolver.resolveAgent(name);
    }
    /**
     * Get agent information
     */
    async getAgentInfo(name) {
        return this.agentAPI.getAgentInfo(name);
    }
    /**
     * Check if agent exists
     */
    async hasAgent(name) {
        return this.agentAPI.hasAgent(name);
    }
    /**
     * List available agents
     */
    async listAgents(filters) {
        return this.agentAPI.listAgents(filters);
    }
    /**
     * Health check an agent
     */
    async healthCheckAgent(name) {
        return this.agentAPI.healthCheck(name);
    }
    /**
     * Refresh agent prompt cache
     */
    async refreshAgentCache(name) {
        return this.agentAPI.refreshCache(name);
    }
    // Tool operations
    /**
     * Resolve a tool definition
     */
    async resolveTool(name) {
        return this.resolver.resolveTool(name);
    }
    /**
     * Get tool information
     */
    async getToolInfo(name) {
        return this.toolAPI.getToolInfo(name);
    }
    /**
     * Check if tool exists
     */
    async hasTool(name) {
        return this.toolAPI.hasTool(name);
    }
    /**
     * List available tools
     */
    async listTools(filters) {
        return this.toolAPI.listTools(filters);
    }
    /**
     * Execute a tool
     */
    async executeTool(name, params, options) {
        return this.toolAPI.executeTool(name, params, options);
    }
    // Getters
    getOrganization() {
        return this.organization;
    }
    getProjectRoot() {
        return this.projectRoot;
    }
    getConfig() {
        return this.config;
    }
    getResolver() {
        return this.resolver;
    }
}
exports.ForgeClient = ForgeClient;
//# sourceMappingURL=client.js.map