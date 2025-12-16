"use strict";
/**
 * Forge Login Command
 *
 * Authenticate with a registry.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginCommand = createLoginCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const auth_manager_1 = require("../../utils/auth-manager");
const formatters_1 = require("../../utils/formatters");
/**
 * Create login command
 */
function createLoginCommand() {
    const cmd = new commander_1.Command('login');
    cmd
        .description('Authenticate with a registry')
        .argument('[registry]', 'Registry name (default: stockyard)', 'stockyard')
        .option('--token <token>', 'Provide authentication token')
        .option('--token-env <var>', 'Use token from environment variable')
        .option('--username <user>', 'Username for interactive prompt')
        .option('-f, --force', 'Force re-authentication')
        .option('-v, --verbose', 'Show detailed information')
        .action(async (registry, options) => {
        try {
            await loginCommand(registry, options);
        }
        catch (error) {
            handleLoginError(error);
        }
    });
    return cmd;
}
/**
 * Login command implementation
 */
async function loginCommand(registry, options) {
    if (options.verbose) {
        console.log(chalk_1.default.dim(`Registry: ${registry}`));
        console.log();
    }
    // Display login header
    console.log();
    console.log(chalk_1.default.bold(`Login to ${chalk_1.default.cyan(registry)}`));
    console.log();
    // Determine authentication method
    let token;
    // Check token from options
    if (options.token) {
        token = options.token;
        if (options.verbose) {
            console.log(chalk_1.default.dim('Using token from --token option'));
        }
    }
    // Check token from environment variable
    if (!token && options.tokenEnv) {
        token = process.env[options.tokenEnv];
        if (!token) {
            console.error(chalk_1.default.red(`✗ Environment variable ${options.tokenEnv} not found`));
            process.exit(1);
        }
        if (options.verbose) {
            console.log(chalk_1.default.dim(`Using token from ${options.tokenEnv} environment variable`));
        }
    }
    // Interactive authentication
    if (!token) {
        console.log('Choose authentication method:');
        console.log();
        const answers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'authMethod',
                message: 'Authentication method',
                choices: [
                    { name: 'Personal Access Token', value: 'token' },
                    { name: 'Username & Password', value: 'basic' },
                ],
                default: 'token',
            },
        ]);
        console.log();
        if (answers.authMethod === 'token') {
            // Token authentication
            const tokenAnswers = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'token',
                    message: 'Personal Access Token',
                    mask: '*',
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'Email (optional)',
                },
            ]);
            token = tokenAnswers.token;
            try {
                const auth = (0, auth_manager_1.createTokenAuth)(token, tokenAnswers.email || undefined);
                await (0, auth_manager_1.authenticateRegistry)(registry, auth);
                console.log();
                (0, formatters_1.formatSuccess)(`Authenticated with ${registry}`);
                console.log();
                // Show user info
                const status = await (0, auth_manager_1.getAuthStatus)(registry);
                console.log(chalk_1.default.bold('Authentication Details:'));
                console.log();
                console.log((0, auth_manager_1.formatAuthStatus)(status));
                console.log();
            }
            catch (error) {
                console.error(chalk_1.default.red(`✗ Authentication failed`));
                console.error(chalk_1.default.yellow(error.message));
                process.exit(1);
            }
        }
        else {
            // Basic authentication
            const basicAnswers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'username',
                    message: 'Username',
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'Password',
                    mask: '*',
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'Email (optional)',
                },
            ]);
            try {
                const auth = (0, auth_manager_1.createBasicAuth)(basicAnswers.username, basicAnswers.password, basicAnswers.email || undefined);
                await (0, auth_manager_1.authenticateRegistry)(registry, auth);
                console.log();
                (0, formatters_1.formatSuccess)(`Authenticated with ${registry}`);
                console.log();
                const status = await (0, auth_manager_1.getAuthStatus)(registry);
                console.log(chalk_1.default.bold('Authentication Details:'));
                console.log();
                console.log((0, auth_manager_1.formatAuthStatus)(status));
                console.log();
            }
            catch (error) {
                console.error(chalk_1.default.red(`✗ Authentication failed`));
                console.error(chalk_1.default.yellow(error.message));
                process.exit(1);
            }
        }
    }
    else {
        // Non-interactive token authentication
        try {
            const auth = (0, auth_manager_1.createTokenAuth)(token);
            await (0, auth_manager_1.authenticateRegistry)(registry, auth);
            console.log();
            (0, formatters_1.formatSuccess)(`Authenticated with ${registry}`);
            console.log();
            const status = await (0, auth_manager_1.getAuthStatus)(registry);
            console.log(chalk_1.default.bold('Authentication Details:'));
            console.log();
            console.log((0, auth_manager_1.formatAuthStatus)(status));
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red(`✗ Authentication failed`));
            console.error(chalk_1.default.yellow(error.message));
            process.exit(1);
        }
    }
    process.exit(0);
}
/**
 * Handle login command errors
 */
function handleLoginError(error) {
    const err = error;
    const hints = [];
    if (err.message.includes('network')) {
        hints.push('Network error connecting to registry');
        hints.push('Check your internet connection');
    }
    else if (err.message.includes('credential')) {
        hints.push('Invalid credentials');
        hints.push('Check username and password');
    }
    else if (err.message.includes('permission')) {
        hints.push('Permission denied');
        hints.push('Check file/directory permissions');
    }
    (0, formatters_1.formatError)(err, 'Login failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createLoginCommand;
//# sourceMappingURL=login.js.map