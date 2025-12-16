"use strict";
/**
 * Forge Logout Command
 *
 * Deauthenticate from a registry.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogoutCommand = createLogoutCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const auth_manager_1 = require("../../utils/auth-manager");
const credential_storage_1 = require("../../utils/credential-storage");
const formatters_1 = require("../../utils/formatters");
/**
 * Create logout command
 */
function createLogoutCommand() {
    const cmd = new commander_1.Command('logout');
    cmd
        .description('Deauthenticate from a registry')
        .argument('[registry]', 'Registry name (default: stockyard)', 'stockyard')
        .option('-a, --all', 'Logout from all registries')
        .option('-f, --force', 'Skip confirmation prompt')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (registry, options) => {
        try {
            await logoutCommand(registry, options);
        }
        catch (error) {
            handleLogoutError(error);
        }
    });
    return cmd;
}
/**
 * Logout command implementation
 */
async function logoutCommand(registry, options) {
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Mode: ${options.all ? 'logout all' : `logout ${registry}`}`));
        console.log();
    }
    // Display logout header
    console.log();
    if (options.all) {
        // Logout from all registries
        console.log(chalk_1.default.bold('Logout from all registries'));
        console.log();
        const authenticated = await (0, credential_storage_1.getAuthenticatedRegistries)();
        if (authenticated.length === 0) {
            console.log(chalk_1.default.yellow('ℹ No authenticated registries found'));
            process.exit(0);
        }
        console.log(`Authenticated registries (${authenticated.length}):`);
        console.log();
        authenticated.forEach((reg) => {
            console.log(`  • ${chalk_1.default.cyan(reg)}`);
        });
        console.log();
        // Confirm
        if (!options.force) {
            const answer = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Logout from ${authenticated.length} registry(ies)?`,
                    default: false,
                },
            ]);
            if (!answer.confirm) {
                console.log(chalk_1.default.dim('Logout cancelled'));
                process.exit(0);
            }
        }
        // Logout from all
        for (const reg of authenticated) {
            await (0, auth_manager_1.clearAuth)(reg);
            if (options.verbose) {
                console.log(chalk_1.default.dim(`Logged out from ${reg}`));
            }
        }
        console.log();
        (0, formatters_1.formatSuccess)(`Logged out from ${authenticated.length} registry(ies)`);
        console.log();
    }
    else {
        // Logout from specific registry
        console.log(chalk_1.default.bold(`Logout from ${chalk_1.default.cyan(registry)}`));
        console.log();
        const status = await (0, auth_manager_1.getAuthStatus)(registry);
        if (!status.authenticated && !status.username) {
            console.log(chalk_1.default.yellow(`ℹ Not authenticated with ${registry}`));
            process.exit(0);
        }
        if (status.username) {
            console.log(`Current user: ${chalk_1.default.cyan(status.username)}`);
            if (status.email) {
                console.log(`Email: ${chalk_1.default.dim(status.email)}`);
            }
            if (status.expires_at && !status.is_expired) {
                const expiresAt = new Date(status.expires_at);
                console.log(`Session expires: ${chalk_1.default.dim(expiresAt.toLocaleString())}`);
            }
            console.log();
        }
        // Confirm logout
        if (!options.force) {
            const answer = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Logout from ${registry}?`,
                    default: false,
                },
            ]);
            if (!answer.confirm) {
                console.log(chalk_1.default.dim('Logout cancelled'));
                process.exit(0);
            }
        }
        // Perform logout
        await (0, auth_manager_1.clearAuth)(registry);
        console.log();
        (0, formatters_1.formatSuccess)(`Logged out from ${registry}`);
        console.log();
        if (options.verbose) {
            console.log(chalk_1.default.dim('Credentials have been removed'));
            console.log(chalk_1.default.dim('Configuration remains unchanged'));
        }
        console.log();
    }
    process.exit(0);
}
/**
 * Handle logout command errors
 */
function handleLogoutError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('auth')) {
        hints.push('Authentication error');
        hints.push('Check your authentication status');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied');
        hints.push('Check file/directory permissions');
    }
    (0, formatters_1.formatError)(err, 'Logout failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createLogoutCommand;
//# sourceMappingURL=logout.js.map