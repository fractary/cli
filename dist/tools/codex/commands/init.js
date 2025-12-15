"use strict";
/**
 * Initialize Codex project command (v3.0 YAML)
 *
 * Creates .fractary/codex.yaml configuration with:
 * - Organization detection from git remote
 * - Multi-provider storage configuration
 * - Cache configuration
 * - Type registry setup
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
const fs = __importStar(require("fs/promises"));
const codex_1 = require("@fractary/codex");
const migrate_config_1 = require("../migrate-config");
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
function initCommand() {
    const cmd = new commander_1.Command('init');
    cmd
        .description('Initialize Codex v3.0 with YAML configuration')
        .option('--org <slug>', 'Organization slug (e.g., "fractary")')
        .option('--mcp', 'Enable MCP server registration')
        .option('--force', 'Overwrite existing configuration')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.blue('Initializing Codex v3.0 (YAML format)...\n'));
            // Resolve organization
            let org = options.org;
            if (!org) {
                // Try git remote first
                org = await getOrgFromGitRemote();
            }
            if (!org) {
                // Try SDK's resolveOrganization
                try {
                    org = (0, codex_1.resolveOrganization)({
                        repoName: path.basename(process.cwd())
                    });
                }
                catch {
                    // SDK method failed, continue
                }
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
            // Config path (v3.0 YAML location)
            const configDir = path.join(process.cwd(), '.fractary');
            const configPath = path.join(configDir, 'codex.yaml');
            const configExists = await fileExists(configPath);
            // Check for legacy config
            const legacyConfigPath = path.join(process.cwd(), '.fractary', 'plugins', 'codex', 'config.json');
            const legacyExists = await fileExists(legacyConfigPath);
            if (configExists && !options.force) {
                console.log(chalk_1.default.yellow('⚠ Configuration already exists at .fractary/codex.yaml'));
                console.log(chalk_1.default.dim('Use --force to overwrite'));
                process.exit(1);
            }
            if (legacyExists && !configExists) {
                console.log(chalk_1.default.yellow('⚠ Legacy configuration detected at .fractary/plugins/codex/config.json'));
                console.log(chalk_1.default.dim('Run "fractary codex migrate" to upgrade to YAML format\n'));
            }
            // Create directory structure
            console.log('Creating directory structure...');
            const dirs = [
                '.fractary',
                '.codex-cache'
            ];
            for (const dir of dirs) {
                await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
                console.log(chalk_1.default.green('✓'), chalk_1.default.dim(dir + '/'));
            }
            // Create configuration
            console.log('\nCreating YAML configuration...');
            const config = (0, migrate_config_1.getDefaultYamlConfig)(org);
            // Enable MCP if requested
            if (options.mcp && config.mcp) {
                config.mcp.enabled = true;
            }
            // Write YAML config
            await (0, migrate_config_1.writeYamlConfig)(config, configPath);
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/codex.yaml'));
            // Success message
            console.log(chalk_1.default.green('\n✓ Codex v3.0 initialized successfully!\n'));
            console.log(chalk_1.default.bold('Configuration:'));
            console.log(chalk_1.default.dim(`  Organization: ${org}`));
            console.log(chalk_1.default.dim(`  Cache: .codex-cache/`));
            console.log(chalk_1.default.dim(`  Config: .fractary/codex.yaml`));
            if (options.mcp) {
                console.log(chalk_1.default.dim(`  MCP Server: Enabled (port 3000)`));
            }
            console.log(chalk_1.default.bold('\nStorage providers configured:'));
            console.log(chalk_1.default.dim('  - Local filesystem (./knowledge)'));
            console.log(chalk_1.default.dim('  - GitHub (requires GITHUB_TOKEN)'));
            console.log(chalk_1.default.dim('  - HTTP endpoint'));
            console.log(chalk_1.default.bold('\nNext steps:'));
            console.log(chalk_1.default.dim('  1. Set your GitHub token: export GITHUB_TOKEN="your_token"'));
            console.log(chalk_1.default.dim('  2. Edit .fractary/codex.yaml to configure storage providers'));
            console.log(chalk_1.default.dim('  3. Fetch a document: fractary codex fetch codex://org/project/path'));
            console.log(chalk_1.default.dim('  4. Check cache: fractary codex cache list'));
            if (legacyExists) {
                console.log(chalk_1.default.yellow('\n⚠ Legacy config detected:'));
                console.log(chalk_1.default.dim('  Run "fractary codex migrate" to convert your existing config'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=init.js.map