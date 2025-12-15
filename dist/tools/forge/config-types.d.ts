/**
 * Forge Configuration Types
 *
 * TypeScript interfaces for forge YAML configuration
 */
export interface LocalRegistryConfig {
    enabled: boolean;
    agents_path: string;
    tools_path: string;
}
export interface GlobalRegistryConfig {
    enabled: boolean;
    path: string;
}
export interface StockyardRegistryConfig {
    enabled: boolean;
    url?: string;
    api_key?: string;
}
export interface RegistryConfig {
    local: LocalRegistryConfig;
    global: GlobalRegistryConfig;
    stockyard: StockyardRegistryConfig;
}
export interface LockfileConfig {
    path: string;
    auto_generate: boolean;
    validate_on_install: boolean;
}
export type UpdatePolicy = 'prompt' | 'block' | 'allow';
export interface UpdatesConfig {
    check_frequency: 'daily' | 'weekly' | 'never';
    auto_update: boolean;
    breaking_changes_policy: UpdatePolicy;
}
export interface DefaultAgentModelConfig {
    provider: string;
    name: string;
}
export interface DefaultAgentLLMConfig {
    temperature: number;
    max_tokens: number;
}
export interface DefaultAgentConfig {
    model: DefaultAgentModelConfig;
    config: DefaultAgentLLMConfig;
}
export interface DefaultToolImplementationConfig {
    type: string;
}
export interface DefaultToolConfig {
    implementation: DefaultToolImplementationConfig;
}
export interface DefaultsConfig {
    agent: DefaultAgentConfig;
    tool: DefaultToolConfig;
}
export interface ForgeYamlConfig {
    organization: string;
    registry: RegistryConfig;
    lockfile: LockfileConfig;
    updates: UpdatesConfig;
    defaults: DefaultsConfig;
}
/**
 * Get default YAML configuration
 */
export declare function getDefaultYamlConfig(organization: string): ForgeYamlConfig;
/**
 * Resolve environment variables in a string
 * Supports ${VAR_NAME} syntax
 */
export declare function resolveEnvVars(value: string): string;
/**
 * Resolve environment variables in configuration object
 */
export declare function resolveEnvVarsInConfig(config: any): any;
//# sourceMappingURL=config-types.d.ts.map