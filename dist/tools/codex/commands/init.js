"use strict";
/**
 * Initialize Codex project command (v3.0)
 *
 * Sets up codex configuration with:
 * - Organization detection from git remote
 * - Cache directory initialization
 * - Type registry configuration
 * - Optional MCP server registration
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
exports.initCommand = initCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const file_scanner_1 = require("../utils/file-scanner");
// Try to import SDK functions, but handle gracefully if not available
let resolveOrganization;
let extractOrgFromRepoName;
try {
    const codex = require('@fractary/codex');
    resolveOrganization = codex.resolveOrganization;
    extractOrgFromRepoName = codex.extractOrgFromRepoName;
}
catch {
    // SDK functions not available, will use fallbacks
}
/**
 * Get default v3.0 configuration
 */
function getDefaultV3Config(org) {
    return {
        version: '3.0',
        organization: org,
        cache: {
            directory: '.fractary/plugins/codex/cache',
            defaultTtl: '24h',
            maxSize: '100MB',
            cleanupInterval: '1h'
        },
        storage: {
            providers: {
                github: {
                    token: '${GITHUB_TOKEN}',
                    baseUrl: 'https://api.github.com'
                }
            },
            defaultProvider: 'github'
        },
        types: {
            custom: []
        },
        sync: {
            environments: {
                dev: 'develop',
                staging: 'staging',
                prod: 'main'
            },
            defaultEnvironment: 'dev'
        },
        mcp: {
            enabled: false,
            port: 3000
        }
    };
}
/**
 * Extract org from git remote URL
 */
async function getOrgFromGitRemote() {
    try {
        const { execSync } = require('child_process');
        const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf-8' }).trim();
        // Parse GitHub URL: git@github.com:org/repo.git or https://github.com/org/repo.git
        const sshMatch = remote.match(/git@github\.com:([^/]+)\//);
        const httpsMatch = remote.match(/github\.com\/([^/]+)\//);
        return sshMatch?.[1] || httpsMatch?.[1] || null;
    }
    catch {
        return null;
    }
}
function initCommand() {
    const cmd = new commander_1.Command('init');
    cmd
        .description('Initialize Codex configuration with cache, storage, and type registry')
        .option('--org <slug>', 'Organization slug (e.g., "fractary")')
        .option('--mcp', 'Enable MCP server registration')
        .option('--force', 'Overwrite existing configuration')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.blue('Initializing Codex v3.0...\n'));
            // Resolve organization
            let org = options.org;
            if (!org) {
                // Try git remote first
                org = await getOrgFromGitRemote();
            }
            if (!org && resolveOrganization) {
                org = resolveOrganization({
                    repoName: path.basename(process.cwd())
                });
            }
            if (!org && extractOrgFromRepoName) {
                org = extractOrgFromRepoName(path.basename(process.cwd()));
            }
            if (!org) {
                // Default fallback
                org = path.basename(process.cwd()).split('-')[0] || 'default';
                console.log(chalk_1.default.yellow(`⚠ Could not detect organization, using: ${org}`));
                console.log(chalk_1.default.dim('  Use --org <slug> to specify explicitly\n'));
            }
            else {
                console.log(chalk_1.default.dim(`Organization: ${chalk_1.default.cyan(org)}\n`));
            }
            // Config path (v3.0 location)
            const configDir = path.join(process.cwd(), '.fractary', 'plugins', 'codex');
            const configPath = path.join(configDir, 'config.json');
            const configExists = await (0, file_scanner_1.fileExists)(configPath);
            if (configExists && !options.force) {
                console.log(chalk_1.default.yellow('⚠ Configuration already exists at .fractary/plugins/codex/config.json'));
                console.log(chalk_1.default.dim('Use --force to overwrite'));
                process.exit(1);
            }
            // Create directory structure
            console.log('Creating directory structure...');
            const dirs = [
                '.fractary/plugins/codex',
                '.fractary/plugins/codex/cache',
                '.fractary/plugins/codex/types'
            ];
            for (const dir of dirs) {
                await (0, file_scanner_1.ensureDirectory)(path.join(process.cwd(), dir));
                console.log(chalk_1.default.green('✓'), chalk_1.default.dim(dir + '/'));
            }
            // Create configuration file
            console.log('\nCreating configuration file...');
            const config = getDefaultV3Config(org);
            // Enable MCP if requested
            if (options.mcp) {
                config.mcp.enabled = true;
            }
            const configContent = JSON.stringify(config, null, 2);
            await (0, file_scanner_1.writeFileContent)(configPath, configContent);
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/plugins/codex/config.json'));
            // Create cache index file
            const cacheIndexPath = path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'cache', 'index.json');
            const cacheIndex = {
                version: '1.0',
                created: new Date().toISOString(),
                entries: {}
            };
            await (0, file_scanner_1.writeFileContent)(cacheIndexPath, JSON.stringify(cacheIndex, null, 2));
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/plugins/codex/cache/index.json'));
            // Success message
            console.log(chalk_1.default.green('\n✓ Codex v3.0 initialized successfully!\n'));
            console.log(chalk_1.default.bold('Configuration:'));
            console.log(chalk_1.default.dim(`  Organization: ${org}`));
            console.log(chalk_1.default.dim(`  Cache: .fractary/plugins/codex/cache/`));
            console.log(chalk_1.default.dim(`  Config: .fractary/plugins/codex/config.json`));
            if (options.mcp) {
                console.log(chalk_1.default.dim(`  MCP Server: Enabled (port 3000)`));
            }
            console.log(chalk_1.default.bold('\nNext steps:'));
            console.log(chalk_1.default.dim('  1. Set your GitHub token: export GITHUB_TOKEN="your_token"'));
            console.log(chalk_1.default.dim('  2. Fetch a document: fractary codex fetch codex://org/project/path'));
            console.log(chalk_1.default.dim('  3. Check cache: fractary codex cache list'));
            console.log(chalk_1.default.dim('  4. Run diagnostics: fractary codex health'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=init.js.map