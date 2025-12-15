"use strict";
/**
 * Configuration types for Codex v3.0 YAML format
 *
 * Based on the SDK's Configuration Guide:
 * https://github.com/fractary/codex/blob/main/docs/guides/configuration.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDuration = parseDuration;
exports.parseSize = parseSize;
exports.resolveEnvVars = resolveEnvVars;
exports.resolveEnvVarsInConfig = resolveEnvVarsInConfig;
/**
 * Parse a duration string to seconds
 *
 * Supports formats like: "1h", "24h", "7d", "1w", "1M", "1y"
 */
function parseDuration(duration) {
    if (typeof duration === 'number') {
        return duration;
    }
    const match = duration.match(/^(\d+)([smhdwMy])$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }
    const [, valueStr, unit] = match;
    const value = parseInt(valueStr, 10);
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        case 'w': return value * 604800;
        case 'M': return value * 2592000; // 30 days
        case 'y': return value * 31536000; // 365 days
        default: throw new Error(`Unknown duration unit: ${unit}`);
    }
}
/**
 * Parse a size string to bytes
 *
 * Supports formats like: "100MB", "1GB", "50MB"
 */
function parseSize(size) {
    if (typeof size === 'number') {
        return size;
    }
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) {
        throw new Error(`Invalid size format: ${size}`);
    }
    const [, valueStr, unit] = match;
    const value = parseFloat(valueStr);
    switch (unit.toUpperCase()) {
        case 'B': return value;
        case 'KB': return value * 1024;
        case 'MB': return value * 1024 * 1024;
        case 'GB': return value * 1024 * 1024 * 1024;
        default: throw new Error(`Unknown size unit: ${unit}`);
    }
}
/**
 * Resolve environment variables in a string
 *
 * Supports ${VAR_NAME} syntax
 */
function resolveEnvVars(value) {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        const envValue = process.env[varName];
        if (envValue === undefined) {
            console.warn(`Warning: Environment variable ${varName} is not set`);
            return `\${${varName}}`; // Keep original if not found
        }
        return envValue;
    });
}
/**
 * Deep resolve environment variables in an object
 */
function resolveEnvVarsInConfig(config) {
    if (typeof config === 'string') {
        return resolveEnvVars(config);
    }
    if (Array.isArray(config)) {
        return config.map(item => resolveEnvVarsInConfig(item));
    }
    if (config !== null && typeof config === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(config)) {
            result[key] = resolveEnvVarsInConfig(value);
        }
        return result;
    }
    return config;
}
//# sourceMappingURL=config-types.js.map