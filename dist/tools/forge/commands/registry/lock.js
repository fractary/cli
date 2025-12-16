"use strict";
/**
 * Forge Lock Command
 *
 * Generate or update lockfile with exact versions of installed components.
 * Enables reproducible installations across machines.
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
exports.createLockCommand = createLockCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const lockfile_manager_1 = require("../../utils/lockfile-manager");
const formatters_1 = require("../../utils/formatters");
/**
 * Create lock command
 */
function createLockCommand() {
    const cmd = new commander_1.Command('lock');
    cmd
        .description('Generate or update lockfile with exact component versions')
        .option('-u, --update', 'Update existing lockfile with current versions')
        .option('-f, --force', 'Force regenerate lockfile even if already exists')
        .option('-v, --verbose', 'Show detailed lockfile information')
        .action(async (options) => {
        try {
            await lockCommand(options);
        }
        catch (error) {
            handleLockError(error);
        }
    });
    return cmd;
}
/**
 * Lock command implementation
 */
async function lockCommand(options) {
    const lockfilePath = await (0, lockfile_manager_1.getLocalLockfilePath)();
    const lockfileRelPath = path.relative(process.cwd(), lockfilePath);
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Lockfile path: ${lockfileRelPath}`));
        console.log();
    }
    // Check if lockfile exists
    const existingLock = await (0, lockfile_manager_1.loadLockfile)(lockfilePath);
    if (existingLock && !options.update && !options.force) {
        console.log(chalk_1.default.yellow(`⚠ Lockfile already exists at ${lockfileRelPath}`));
        console.log();
        console.log(chalk_1.default.dim('Use one of:'));
        console.log(chalk_1.default.cyan('  fractary forge lock --update'));
        console.log(chalk_1.default.cyan('  fractary forge lock --force'));
        process.exit(1);
    }
    if (options.verbose) {
        console.log(chalk_1.default.cyan('Generating lockfile from installed components...'));
        console.log();
    }
    try {
        // Generate lockfile from current installed components
        const lockfile = await (0, lockfile_manager_1.generateLockfile)(process.cwd(), {
            update: options.update,
        });
        // Save lockfile
        await (0, lockfile_manager_1.saveLockfile)(lockfile, lockfilePath);
        // Display summary
        const summary = (0, lockfile_manager_1.summarizeLockfile)(lockfile);
        console.log();
        (0, formatters_1.formatSuccess)(`Lockfile created: ${lockfileRelPath}`);
        console.log();
        // Show component counts
        if (summary.agents > 0) {
            console.log(`  • ${summary.agents} agent(s)`);
        }
        if (summary.tools > 0) {
            console.log(`  • ${summary.tools} tool(s)`);
        }
        if (summary.workflows > 0) {
            console.log(`  • ${summary.workflows} workflow(s)`);
        }
        if (summary.templates > 0) {
            console.log(`  • ${summary.templates} template(s)`);
        }
        if (summary.totalComponents === 0) {
            console.log(chalk_1.default.dim('  (no components installed)'));
        }
        else {
            console.log();
            console.log(chalk_1.default.dim(`Total: ${summary.totalComponents} component(s) locked`));
        }
        if (options.verbose) {
            console.log();
            console.log(chalk_1.default.dim(`Timestamp: ${lockfile.timestamp}`));
            console.log(chalk_1.default.dim(`Version: ${lockfile.lockfile_version}`));
        }
        console.log();
        if (existingLock && options.update) {
            console.log(chalk_1.default.dim('Lockfile updated. Commit changes to track in version control.'));
        }
        else {
            console.log(chalk_1.default.dim('Lockfile created. Commit to version control for reproducible installations.'));
        }
        process.exit(0);
    }
    catch (error) {
        throw error;
    }
}
/**
 * Handle lock command errors
 */
function handleLockError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('permission') || err.message.includes('EACCES')) {
        hints.push('Permission denied writing to .fractary directory');
        hints.push('Check file permissions or run with sudo');
    }
    else if (err.message.includes('ENOENT')) {
        hints.push('Directory not found');
        hints.push('Run: fractary forge init');
    }
    else if (err.message.includes('no components')) {
        hints.push('No components currently installed');
        hints.push('Install components first: fractary forge install <plugin>');
    }
    (0, formatters_1.formatError)(err, 'Lockfile generation failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createLockCommand;
//# sourceMappingURL=lock.js.map