"use strict";
/**
 * Health command (v3.0)
 *
 * Comprehensive diagnostics for codex SDK setup:
 * - YAML configuration validation
 * - CodexClient initialization
 * - Cache health via CacheManager
 * - Storage provider connectivity
 * - Type registry validation
 * - Legacy configuration detection
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCommand = healthCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const get_client_1 = require("../get-client");
const migrate_config_1 = require("../migrate-config");
/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check YAML configuration
 */
async function checkConfiguration() {
    const configPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
    const legacyConfigPath = path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'config.json');
    try {
        // Check for YAML config
        if (!await fileExists(configPath)) {
            // Check for legacy config
            if (await fileExists(legacyConfigPath)) {
                return {
                    name: 'Configuration',
                    status: 'warn',
                    message: 'Legacy JSON configuration detected',
                    details: 'Run "fractary codex migrate" to upgrade to YAML format'
                };
            }
            return {
                name: 'Configuration',
                status: 'fail',
                message: 'No configuration found',
                details: 'Run "fractary codex init" to create configuration'
            };
        }
        // Validate YAML config
        const config = await (0, migrate_config_1.readYamlConfig)(configPath);
        if (!config.organization) {
            return {
                name: 'Configuration',
                status: 'warn',
                message: 'No organization configured',
                details: 'Organization slug is required'
            };
        }
        // Check storage providers
        const providerCount = config.storage?.length || 0;
        if (providerCount === 0) {
            return {
                name: 'Configuration',
                status: 'warn',
                message: 'No storage providers configured',
                details: 'At least one storage provider is recommended'
            };
        }
        return {
            name: 'Configuration',
            status: 'pass',
            message: 'Valid YAML configuration',
            details: `Organization: ${config.organization}, ${providerCount} storage provider(s)`
        };
    }
    catch (error) {
        return {
            name: 'Configuration',
            status: 'fail',
            message: 'Invalid configuration',
            details: error.message
        };
    }
}
/**
 * Check SDK client initialization
 */
async function checkSDKClient() {
    try {
        const client = await (0, get_client_1.getClient)();
        const organization = client.getOrganization();
        return {
            name: 'SDK Client',
            status: 'pass',
            message: 'CodexClient initialized successfully',
            details: `Organization: ${organization}`
        };
    }
    catch (error) {
        return {
            name: 'SDK Client',
            status: 'fail',
            message: 'Failed to initialize CodexClient',
            details: error.message
        };
    }
}
/**
 * Check cache health
 */
async function checkCache() {
    try {
        const client = await (0, get_client_1.getClient)();
        const stats = await client.getCacheStats();
        if (stats.entryCount === 0) {
            return {
                name: 'Cache',
                status: 'warn',
                message: 'Cache is empty',
                details: 'Fetch some documents to populate cache'
            };
        }
        const healthPercent = stats.entryCount > 0 ? (stats.freshCount / stats.entryCount) * 100 : 100;
        if (healthPercent < 50) {
            return {
                name: 'Cache',
                status: 'warn',
                message: `${stats.entryCount} entries (${healthPercent.toFixed(0)}% fresh)`,
                details: `${stats.expiredCount} expired, ${stats.staleCount} stale`
            };
        }
        return {
            name: 'Cache',
            status: 'pass',
            message: `${stats.entryCount} entries (${healthPercent.toFixed(0)}% fresh)`,
            details: `${formatSize(stats.totalSize)} total`
        };
    }
    catch (error) {
        return {
            name: 'Cache',
            status: 'fail',
            message: 'Cache check failed',
            details: error.message
        };
    }
}
/**
 * Check storage providers
 */
async function checkStorage() {
    const configPath = path.join(process.cwd(), '.fractary', 'codex.yaml');
    try {
        const config = await (0, migrate_config_1.readYamlConfig)(configPath);
        const providers = config.storage || [];
        if (providers.length === 0) {
            return {
                name: 'Storage',
                status: 'warn',
                message: 'No storage providers configured',
                details: 'Configure at least one provider in .fractary/codex.yaml'
            };
        }
        const providerTypes = providers.map(p => p.type).join(', ');
        const hasGitHub = providers.some(p => p.type === 'github');
        if (hasGitHub && !process.env.GITHUB_TOKEN) {
            return {
                name: 'Storage',
                status: 'warn',
                message: `${providers.length} provider(s): ${providerTypes}`,
                details: 'GITHUB_TOKEN not set (required for GitHub provider)'
            };
        }
        return {
            name: 'Storage',
            status: 'pass',
            message: `${providers.length} provider(s): ${providerTypes}`,
            details: 'All configured providers available'
        };
    }
    catch (error) {
        return {
            name: 'Storage',
            status: 'fail',
            message: 'Storage check failed',
            details: error.message
        };
    }
}
/**
 * Check type registry
 */
async function checkTypes() {
    try {
        const client = await (0, get_client_1.getClient)();
        const registry = client.getTypeRegistry();
        const allTypes = registry.list();
        const builtinCount = allTypes.filter(t => registry.isBuiltIn(t.name)).length;
        const customCount = allTypes.length - builtinCount;
        return {
            name: 'Type Registry',
            status: 'pass',
            message: `${allTypes.length} types registered`,
            details: `${builtinCount} built-in, ${customCount} custom`
        };
    }
    catch (error) {
        return {
            name: 'Type Registry',
            status: 'fail',
            message: 'Type registry check failed',
            details: error.message
        };
    }
}
/**
 * Format file size
 */
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function healthCommand() {
    const cmd = new commander_1.Command('health');
    cmd
        .description('Run diagnostics on codex setup')
        .option('--json', 'Output as JSON')
        .action(async (options) => {
        try {
            // Run all health checks
            const checks = [];
            checks.push(await checkConfiguration());
            checks.push(await checkSDKClient());
            checks.push(await checkCache());
            checks.push(await checkStorage());
            checks.push(await checkTypes());
            // Count results
            const passed = checks.filter(c => c.status === 'pass').length;
            const warned = checks.filter(c => c.status === 'warn').length;
            const failed = checks.filter(c => c.status === 'fail').length;
            if (options.json) {
                console.log(JSON.stringify({
                    summary: {
                        total: checks.length,
                        passed,
                        warned,
                        failed,
                        healthy: failed === 0
                    },
                    checks
                }, null, 2));
                return;
            }
            // Display results
            console.log(chalk_1.default.bold('Codex Health Check\n'));
            for (const check of checks) {
                const icon = check.status === 'pass' ? chalk_1.default.green('✓') :
                    check.status === 'warn' ? chalk_1.default.yellow('⚠') :
                        chalk_1.default.red('✗');
                const statusColor = check.status === 'pass' ? chalk_1.default.green :
                    check.status === 'warn' ? chalk_1.default.yellow :
                        chalk_1.default.red;
                console.log(`${icon} ${chalk_1.default.bold(check.name)}`);
                console.log(`  ${statusColor(check.message)}`);
                if (check.details) {
                    console.log(`  ${chalk_1.default.dim(check.details)}`);
                }
                console.log('');
            }
            // Summary
            console.log(chalk_1.default.dim('─'.repeat(60)));
            const overallStatus = failed > 0 ? chalk_1.default.red('UNHEALTHY') :
                warned > 0 ? chalk_1.default.yellow('DEGRADED') :
                    chalk_1.default.green('HEALTHY');
            console.log(`Status: ${overallStatus}`);
            console.log(chalk_1.default.dim(`${passed} passed, ${warned} warnings, ${failed} failed`));
            if (failed > 0 || warned > 0) {
                console.log('');
                console.log(chalk_1.default.dim('Run checks individually for more details:'));
                console.log(chalk_1.default.dim('  fractary codex cache stats'));
                console.log(chalk_1.default.dim('  fractary codex types list'));
            }
            // Exit with error if any checks failed
            if (failed > 0) {
                process.exit(1);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=health.js.map