/**
 * ForgeClient - Unified client wrapper for Forge SDK
 *
 * Wraps AgentAPI, ToolAPI, DefinitionResolver, and other SDK managers
 * to provide a clean interface for CLI commands.
 */
import type { DefinitionResolver, ResolvedAgent, ResolvedTool, AgentInfo, ToolInfo } from '@fractary/forge';
import type { ForgeYamlConfig } from './config-types';
export interface ForgeClientOptions {
    projectRoot?: string;
    organization?: string;
}
/**
 * Unified Forge client
 *
 * Provides high-level operations for:
 * - Agent resolution and management
 * - Tool resolution and execution
 * - Registry operations
 */
export declare class ForgeClient {
    private resolver;
    private agentAPI;
    private toolAPI;
    private organization;
    private projectRoot;
    private config;
    /**
     * Private constructor - use ForgeClient.create() instead
     */
    private constructor();
    /**
     * Create ForgeClient instance
     */
    static create(options?: ForgeClientOptions): Promise<ForgeClient>;
    /**
     * Build resolver configuration from YAML config
     */
    private static buildResolverConfig;
    /**
     * Resolve an agent definition
     */
    resolveAgent(name: string): Promise<ResolvedAgent>;
    /**
     * Get agent information
     */
    getAgentInfo(name: string): Promise<AgentInfo>;
    /**
     * Check if agent exists
     */
    hasAgent(name: string): Promise<boolean>;
    /**
     * List available agents
     */
    listAgents(filters?: {
        tags?: string[];
    }): Promise<AgentInfo[]>;
    /**
     * Health check an agent
     */
    healthCheckAgent(name: string): Promise<import("@fractary/forge").HealthCheckResult>;
    /**
     * Refresh agent prompt cache
     */
    refreshAgentCache(name: string): Promise<void>;
    /**
     * Resolve a tool definition
     */
    resolveTool(name: string): Promise<ResolvedTool>;
    /**
     * Get tool information
     */
    getToolInfo(name: string): Promise<ToolInfo>;
    /**
     * Check if tool exists
     */
    hasTool(name: string): Promise<boolean>;
    /**
     * List available tools
     */
    listTools(filters?: {
        tags?: string[];
    }): Promise<ToolInfo[]>;
    /**
     * Execute a tool
     */
    executeTool(name: string, params: Record<string, any>, options?: any): Promise<import("@fractary/forge").ToolResult>;
    getOrganization(): string;
    getProjectRoot(): string;
    getConfig(): ForgeYamlConfig;
    getResolver(): DefinitionResolver;
}
//# sourceMappingURL=client.d.ts.map