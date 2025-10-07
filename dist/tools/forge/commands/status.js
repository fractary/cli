"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusCommand = void 0;
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class StatusCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('status')
            .description('Show project status and installed bundles')
            .option('--json', 'Output as JSON')
            .option('-v, --verbose', 'Show detailed information')
            .action(async (options) => {
            await this.execute(options);
        });
    }
    async execute(options) {
        try {
            // Check if we're in a Fractary project
            const manifestPath = path_1.default.join(process.cwd(), 'fractory.manifest.json');
            if (!(await forge_1.fs.exists(manifestPath))) {
                if (options.json) {
                    console.log(JSON.stringify({
                        error: 'Not a Fractary project',
                        message: 'No fractory.manifest.json found',
                    }, null, 2));
                }
                else {
                    forge_1.logger.error('Not a Fractary project. Run "fractary forge validate --fix" to initialize.');
                }
                process.exit(1);
            }
            const manifest = await forge_1.fs.readJson(manifestPath);
            const status = await this.generateStatus(manifest, options);
            if (options.json) {
                console.log(JSON.stringify(status, null, 2));
            }
            else {
                this.displayStatus(status, options);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                forge_1.logger.error(error.message);
            }
            else {
                forge_1.logger.error(String(error));
            }
            process.exit(1);
        }
    }
    async generateStatus(manifest, _options) {
        const status = {
            project: {
                name: manifest.name,
                version: manifest.version,
                starter: manifest.starter || 'none',
                environment: manifest.environment || 'unknown',
                lastUpdated: manifest.lastUpdated || 'unknown',
            },
            bundles: {
                total: manifest.bundles?.length || 0,
                installed: [],
            },
            health: {
                manifestValid: true,
                allBundlesAvailable: true,
                issues: [],
            },
        };
        // Check installed bundles
        if (manifest.bundles && manifest.bundles.length > 0) {
            for (const bundle of manifest.bundles) {
                const bundleStatus = await this.checkBundleStatus(bundle);
                status.bundles.installed.push(bundleStatus);
                if (bundleStatus.status !== 'available') {
                    status.health.allBundlesAvailable = false;
                    status.health.issues.push(`Bundle '${bundle.name}' is ${bundleStatus.status}`);
                }
            }
        }
        // Additional health checks
        await this.performHealthChecks(status, manifest);
        return status;
    }
    async checkBundleStatus(bundle) {
        const embeddedPath = path_1.default.join(__dirname, '../../embedded/bundles', bundle.name);
        let bundleStatus = 'unknown';
        let fileCount = 0;
        try {
            if (await forge_1.fs.exists(embeddedPath)) {
                bundleStatus = 'available';
                // Count files if verbose
                const stat = await forge_1.fs.stat(embeddedPath);
                if (stat.isDirectory()) {
                    fileCount = await this.countFiles(embeddedPath);
                }
            }
            else {
                bundleStatus = 'missing';
            }
        }
        catch {
            bundleStatus = 'unknown';
        }
        return {
            name: bundle.name,
            version: bundle.version || 'latest',
            status: bundleStatus,
            files: fileCount > 0 ? fileCount : undefined,
        };
    }
    async countFiles(dir) {
        let count = 0;
        try {
            const entries = await forge_1.fs.readdir(dir);
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry);
                const stat = await forge_1.fs.stat(fullPath);
                if (stat.isFile()) {
                    count++;
                }
                else if (stat.isDirectory()) {
                    count += await this.countFiles(fullPath);
                }
            }
        }
        catch {
            // Ignore errors
        }
        return count;
    }
    async performHealthChecks(status, manifest) {
        // Check for package.json
        const packageJsonPath = path_1.default.join(process.cwd(), 'package.json');
        if (!(await forge_1.fs.exists(packageJsonPath))) {
            status.health.issues.push('No package.json found');
        }
        // Check for src directory
        const srcPath = path_1.default.join(process.cwd(), 'src');
        if (!(await forge_1.fs.exists(srcPath))) {
            status.health.issues.push('No src/ directory found');
        }
        // Check manifest structure
        if (!manifest.name) {
            status.health.manifestValid = false;
            status.health.issues.push('Project name missing in manifest');
        }
        if (!manifest.version) {
            status.health.manifestValid = false;
            status.health.issues.push('Project version missing in manifest');
        }
    }
    displayStatus(status, options) {
        // Project info
        console.log(chalk_1.default.bold.blue('\n📊 Project Status\n'));
        console.log(`${chalk_1.default.bold('Project:')} ${status.project.name}`);
        console.log(`${chalk_1.default.bold('Version:')} ${status.project.version}`);
        console.log(`${chalk_1.default.bold('Starter:')} ${status.project.starter}`);
        console.log(`${chalk_1.default.bold('Environment:')} ${status.project.environment}`);
        if (status.project.lastUpdated !== 'unknown') {
            console.log(`${chalk_1.default.bold('Last Updated:')} ${status.project.lastUpdated}`);
        }
        // Bundles
        console.log(chalk_1.default.bold.magenta('\n🎁 Installed Bundles\n'));
        if (status.bundles.total === 0) {
            console.log(chalk_1.default.gray('No bundles installed'));
            console.log(chalk_1.default.dim('Use "fractary forge install <bundle-name>" to add bundles'));
        }
        else {
            for (const bundle of status.bundles.installed) {
                const statusColor = bundle.status === 'available' ? 'green' : 'red';
                const statusIcon = bundle.status === 'available' ? '✓' : '✗';
                console.log(`  ${chalk_1.default[statusColor](statusIcon)} ${chalk_1.default.bold(bundle.name)} ${chalk_1.default.dim(`(${bundle.version})`)}`);
                console.log(`    Status: ${chalk_1.default[statusColor](bundle.status)}`);
                if (options.verbose && bundle.files) {
                    console.log(`    Files: ${bundle.files}`);
                }
                console.log('');
            }
        }
        // Health
        console.log(chalk_1.default.bold.yellow('\n🏥 Health Check\n'));
        if (status.health.issues.length === 0) {
            console.log(`${chalk_1.default.green('✓')} All checks passed`);
        }
        else {
            console.log(`${chalk_1.default.red('✗')} Found ${status.health.issues.length} issue${status.health.issues.length !== 1 ? 's' : ''}:`);
            for (const issue of status.health.issues) {
                console.log(`  ${chalk_1.default.red('•')} ${issue}`);
            }
        }
        // Summary
        console.log(chalk_1.default.dim(`\nSummary: ${status.bundles.total} bundle${status.bundles.total !== 1 ? 's' : ''}, ${status.health.issues.length} issue${status.health.issues.length !== 1 ? 's' : ''}`));
        // Suggestions
        if (status.health.issues.length > 0) {
            console.log(chalk_1.default.dim('\nSuggestions:'));
            console.log(chalk_1.default.dim('  Run "fractary forge validate --fix" to resolve manifest issues'));
            console.log(chalk_1.default.dim('  Run "fractary forge deploy" to ensure bundles are properly deployed'));
        }
    }
}
exports.StatusCommand = StatusCommand;
//# sourceMappingURL=status.js.map