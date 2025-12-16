"use strict";
/**
 * Forge Whoami Command
 *
 * Display current authenticated user information.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhoamiCommand = createWhoamiCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const auth_manager_1 = require("../../utils/auth-manager");
const credential_storage_1 = require("../../utils/credential-storage");
const formatters_1 = require("../../utils/formatters");
/**
 * Create whoami command
 */
function createWhoamiCommand() {
    const cmd = new commander_1.Command('whoami');
    cmd
        .description('Show current authenticated user')
        .argument('[registry]', 'Registry name (default: stockyard)', 'stockyard')
        .option('--json', 'Output as JSON for scripting')
        .option('-v, --verbose', 'Show detailed user information')
        .option('-a, --all', 'Show user info for all authenticated registries')
        .action(async (registry, options) => {
        try {
            await whoamiCommand(registry, options);
        }
        catch (error) {
            handleWhoamiError(error);
        }
    });
    return cmd;
}
/**
 * Whoami command implementation
 */
async function whoamiCommand(registry, options) {
    if (options.all) {
        // Show all authenticated registries
        const authenticated = await (0, credential_storage_1.getAuthenticatedRegistries)();
        if (options.json) {
            // JSON output
            const results = [];
            for (const reg of authenticated) {
                const status = await (0, auth_manager_1.getAuthStatus)(reg);
                results.push({
                    registry: status.registry,
                    authenticated: status.authenticated,
                    username: status.username,
                    email: status.email,
                    auth_type: status.auth_type,
                    authenticated_at: status.authenticated_at,
                    expires_at: status.expires_at,
                    is_expired: status.is_expired,
                });
            }
            console.log(JSON.stringify(results, null, 2));
        }
        else {
            // Text output
            console.log();
            console.log(chalk_1.default.bold('Authenticated Registries'));
            console.log();
            if (authenticated.length === 0) {
                console.log(chalk_1.default.yellow('ℹ No authenticated registries'));
                process.exit(0);
            }
            const table = new cli_table3_1.default({
                head: ['Registry', 'Username', 'Email', 'Auth Type', 'Status'],
                colWidths: [20, 20, 30, 12, 20],
                style: { head: [], border: ['grey'] },
            });
            for (const reg of authenticated) {
                const status = await (0, auth_manager_1.getAuthStatus)(reg);
                const statusStr = status.is_expired ? chalk_1.default.red('Expired') : chalk_1.default.green('Active');
                table.push([
                    reg,
                    status.username || '-',
                    status.email || '-',
                    status.auth_type || '-',
                    statusStr,
                ]);
            }
            console.log(table.toString());
            console.log();
        }
    }
    else {
        // Single registry
        const status = await (0, auth_manager_1.getAuthStatus)(registry);
        if (options.json) {
            // JSON output
            console.log(JSON.stringify({
                registry: status.registry,
                authenticated: status.authenticated,
                username: status.username,
                email: status.email,
                auth_type: status.auth_type,
                authenticated_at: status.authenticated_at,
                expires_at: status.expires_at,
                is_expired: status.is_expired,
            }, null, 2));
        }
        else {
            // Text output
            console.log();
            if (!status.authenticated && !status.username) {
                console.log(chalk_1.default.bold(`Registry: ${chalk_1.default.cyan(registry)}`));
                console.log();
                console.log(chalk_1.default.yellow('Not authenticated'));
                console.log();
                console.log(chalk_1.default.dim('Run: fractary forge login ' + registry));
            }
            else {
                console.log(chalk_1.default.bold(`Registry: ${chalk_1.default.cyan(registry)}`));
                console.log();
                if (status.username) {
                    console.log(`Username:  ${chalk_1.default.cyan(status.username)}`);
                }
                if (status.email) {
                    console.log(`Email:     ${chalk_1.default.cyan(status.email)}`);
                }
                if (status.auth_type) {
                    console.log(`Auth Type: ${chalk_1.default.cyan(status.auth_type)}`);
                }
                if (status.authenticated_at) {
                    console.log(`Logged In:  ${chalk_1.default.dim(new Date(status.authenticated_at).toLocaleString())}`);
                }
                if (status.expires_at) {
                    const expiresAt = new Date(status.expires_at);
                    const isExpired = status.is_expired;
                    const expiresStr = isExpired ? chalk_1.default.red(expiresAt.toLocaleString()) : expiresAt.toLocaleString();
                    console.log(`Expires:   ${chalk_1.default.dim(expiresStr)}`);
                }
                if (status.is_expired) {
                    console.log();
                    console.log(chalk_1.default.yellow('⚠ Session expired'));
                }
            }
            console.log();
            if (options.verbose) {
                console.log(chalk_1.default.bold('Additional Information:'));
                console.log();
                console.log(chalk_1.default.dim('Registry Details:'));
                console.log(chalk_1.default.dim(`  URL: https://stockyard.fractary.dev`));
                console.log(chalk_1.default.dim(`  Type: Stockyard`));
                console.log();
                console.log(chalk_1.default.dim('Auth Configuration:'));
                console.log(chalk_1.default.dim(`  Location: ~/.fractary/auth/credentials.json`));
                console.log(chalk_1.default.dim(`  Encryption: AES-256-CBC`));
                console.log();
            }
        }
    }
    process.exit(0);
}
/**
 * Handle whoami command errors
 */
function handleWhoamiError(error) {
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
    (0, formatters_1.formatError)(err, 'Whoami failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createWhoamiCommand;
//# sourceMappingURL=whoami.js.map