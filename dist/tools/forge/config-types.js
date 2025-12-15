"use strict";
/**
 * Forge Configuration Types
 *
 * TypeScript interfaces for forge YAML configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultYamlConfig = getDefaultYamlConfig;
exports.resolveEnvVars = resolveEnvVars;
exports.resolveEnvVarsInConfig = resolveEnvVarsInConfig;
/**
 * Get default YAML configuration
 */
function getDefaultYamlConfig(organization) {
    return {
        organization,
        registry: {
            local: {
                enabled: true,
                agents_path: '.fractary/agents',
                tools_path: '.fractary/tools',
            },
            global: {
                enabled: true,
                path: '~/.fractary/registry',
            },
            stockyard: {
                enabled: false,
                url: 'https://stockyard.fractary.dev',
            },
        },
        lockfile: {
            path: '.fractary/forge/lockfile.json',
            auto_generate: true,
            validate_on_install: true,
        },
        updates: {
            check_frequency: 'daily',
            auto_update: false,
            breaking_changes_policy: 'prompt',
        },
        defaults: {
            agent: {
                model: {
                    provider: 'anthropic',
                    name: 'claude-sonnet-4',
                },
                config: {
                    temperature: 0.7,
                    max_tokens: 4096,
                },
            },
            tool: {
                implementation: {
                    type: 'function',
                },
            },
        },
    };
}
/**
 * Resolve environment variables in a string
 * Supports ${VAR_NAME} syntax
 */
function resolveEnvVars(value) {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || '';
    });
}
/**
 * Resolve environment variables in configuration object
 */
function resolveEnvVarsInConfig(config) {
    if (typeof config === 'string') {
        return resolveEnvVars(config);
    }
    if (Array.isArray(config)) {
        return config.map(item => resolveEnvVarsInConfig(item));
    }
    if (config !== null && typeof config === 'object') {
        const resolved = {};
        for (const [key, value] of Object.entries(config)) {
            resolved[key] = resolveEnvVarsInConfig(value);
        }
        return resolved;
    }
    return config;
}
//# sourceMappingURL=config-types.js.map