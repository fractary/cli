"use strict";
/**
 * Initialize Forge Configuration Command
 *
 * Creates .fractary/forge/config.yaml with:
 * - Organization detection from git remote
 * - Registry configuration (local, global, stockyard)
 * - Lockfile configuration
 * - Update settings
 * - Default agent/tool settings
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
const migrate_config_1 = require("../migrate-config");
/**
 * Extract organization from git remote URL
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
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
}
function initCommand() {
    const cmd = new commander_1.Command('init');
    cmd
        .description('Initialize Forge configuration for agent/tool management')
        .option('--org <slug>', 'Organization slug (e.g., "fractary")')
        .option('--global', 'Also initialize global registry (~/.fractary/registry)')
        .option('--force', 'Overwrite existing configuration')
        .action(async (options) => {
        try {
            console.log(chalk_1.default.blue('Initializing Forge configuration...\n'));
            // Resolve organization
            let org = options.org;
            if (!org) {
                // Try git remote first
                org = await getOrgFromGitRemote();
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
            // Config paths
            const configDir = path.join(process.cwd(), '.fractary/forge');
            const configPath = path.join(configDir, 'config.yaml');
            const exists = await (0, migrate_config_1.configExists)(configPath);
            if (exists && !options.force) {
                console.log(chalk_1.default.yellow('⚠ Configuration already exists at .fractary/forge/config.yaml'));
                console.log(chalk_1.default.dim('Use --force to overwrite'));
                process.exit(1);
            }
            // Create directory structure
            console.log(chalk_1.default.dim('Creating directory structure...'));
            await ensureDir(configDir);
            await ensureDir(path.join(process.cwd(), '.fractary/agents'));
            await ensureDir(path.join(process.cwd(), '.fractary/tools'));
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/forge/'));
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/agents/'));
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('.fractary/tools/'));
            // Create global registry if requested
            if (options.global) {
                const globalDir = path.join(require('os').homedir(), '.fractary/registry');
                await ensureDir(path.join(globalDir, 'agents'));
                await ensureDir(path.join(globalDir, 'tools'));
                console.log(chalk_1.default.green('✓'), chalk_1.default.dim('~/.fractary/registry/'));
            }
            // Create configuration
            console.log(chalk_1.default.dim('\nGenerating configuration...'));
            await (0, migrate_config_1.createDefaultConfig)(configPath, org);
            console.log(chalk_1.default.green('✓'), chalk_1.default.dim('config.yaml created'));
            // Success message
            console.log(chalk_1.default.green('\n✨ Forge initialized successfully!\n'));
            console.log(chalk_1.default.bold('Configuration:'));
            console.log(chalk_1.default.dim('  File: .fractary/forge/config.yaml'));
            console.log(chalk_1.default.dim('  Organization:'), chalk_1.default.cyan(org));
            console.log(chalk_1.default.dim('  Agents:'), '.fractary/agents/');
            console.log(chalk_1.default.dim('  Tools:'), '.fractary/tools/');
            console.log(chalk_1.default.bold('\nNext steps:'));
            console.log(chalk_1.default.dim('  1. Create an agent:'), chalk_1.default.cyan('fractary forge agent-create <name>'));
            console.log(chalk_1.default.dim('  2. Create a tool:'), chalk_1.default.cyan('fractary forge tool-create <name>'));
            console.log(chalk_1.default.dim('  3. List agents:'), chalk_1.default.cyan('fractary forge agent-list'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=init.js.map