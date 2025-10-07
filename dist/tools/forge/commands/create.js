"use strict";
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
exports.CreateCommand = void 0;
const prompts_1 = __importDefault(require("prompts"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
class CreateCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('create <name>')
            .description('Create a new Fractary project')
            .option('-s, --starter <name>', 'Starter template to use', 'www-astro-blog')
            .option('-b, --bundle <name>', 'Bundle to include', 'www-marketing')
            .option('--env <environment>', 'Environment (test|prod)', 'test')
            .option('--dry-run', 'Preview without creating')
            .option('-f, --force', 'Overwrite existing directory')
            .action(async (name, options) => {
            await this.execute(name, options);
        });
    }
    async execute(name, options) {
        try {
            forge_1.logger.info(`Creating new project: ${chalk_1.default.cyan(name)}`);
            // Validate project name
            if (!this.isValidProjectName(name)) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.INVALID_ARGUMENT, 'Project name must be lowercase with hyphens only');
            }
            const projectPath = path_1.default.resolve(process.cwd(), name);
            // Check if directory exists
            if (await forge_1.fs.exists(projectPath)) {
                if (!options.force) {
                    throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_EXISTS, `Directory ${name} already exists. Use --force to overwrite.`);
                }
                forge_1.logger.warn(`Overwriting existing directory: ${name}`);
                await forge_1.fs.remove(projectPath);
            }
            // Interactive prompts if starter not specified
            if (!options.starter && !options.dryRun) {
                const response = await (0, prompts_1.default)([
                    {
                        type: 'select',
                        name: 'starter',
                        message: 'Select a starter template',
                        choices: [
                            { title: 'Astro Blog', value: 'www-astro-blog' },
                            { title: 'Next.js App', value: 'www-nextjs-app' },
                            { title: 'Express API', value: 'api-express' },
                        ],
                        initial: 0,
                    },
                    {
                        type: 'select',
                        name: 'bundle',
                        message: 'Select a bundle to include',
                        choices: [
                            { title: 'Marketing Bundle', value: 'www-marketing' },
                            { title: 'None', value: null },
                        ],
                        initial: 0,
                    },
                ]);
                options.starter = response.starter || 'www-astro-blog';
                options.bundle = response.bundle;
            }
            if (options.dryRun) {
                forge_1.logger.info('Dry run mode - no files will be created');
                forge_1.logger.info(`Would create project at: ${projectPath}`);
                forge_1.logger.info(`Starter: ${options.starter}`);
                if (options.bundle) {
                    forge_1.logger.info(`Bundle: ${options.bundle}`);
                }
                return;
            }
            // Create project directory
            forge_1.logger.startSpinner('Creating project structure...');
            await forge_1.fs.ensureDir(projectPath);
            // Copy starter template
            await this.copyStarter(options.starter || 'www-astro-blog', projectPath, name);
            // Create manifest file
            await this.createManifest(projectPath, {
                name,
                version: '0.1.0',
                starter: options.starter,
                bundles: options.bundle
                    ? [
                        {
                            name: options.bundle,
                            version: 'latest',
                            ownership: {
                                '.claude/': 'copy',
                                'docs/': 'merge',
                                'src/': 'copy-if-absent',
                            },
                        },
                    ]
                    : [],
                environment: options.env,
                lastUpdated: new Date().toISOString(),
            });
            forge_1.logger.succeedSpinner('Project structure created');
            // Install dependencies if package.json exists
            const packageJsonPath = path_1.default.join(projectPath, 'package.json');
            if (await forge_1.fs.exists(packageJsonPath)) {
                forge_1.logger.startSpinner('Installing dependencies...');
                try {
                    (0, child_process_1.execSync)('npm install', {
                        cwd: projectPath,
                        stdio: 'pipe',
                    });
                    forge_1.logger.succeedSpinner('Dependencies installed');
                }
                catch (error) {
                    forge_1.logger.failSpinner('Failed to install dependencies');
                    forge_1.logger.warn('Please run npm install manually');
                }
            }
            // Deploy initial bundle if specified
            if (options.bundle) {
                forge_1.logger.info('Deploying initial bundle...');
                try {
                    const DeployCommand = (await Promise.resolve().then(() => __importStar(require('./deploy')))).DeployCommand;
                    const deployCmd = new DeployCommand();
                    await deployCmd.executeInProject(projectPath);
                }
                catch (error) {
                    forge_1.logger.warn('Failed to deploy bundle. Run "forge deploy" manually.');
                }
            }
            // Success message
            forge_1.logger.success(`\n✨ Project ${chalk_1.default.green(name)} created successfully!\n`);
            forge_1.logger.info('Next steps:');
            forge_1.logger.info(`  ${chalk_1.default.cyan(`cd ${name}`)}`);
            if (options.bundle) {
                forge_1.logger.info(`  ${chalk_1.default.cyan('fractary forge deploy')} - Deploy bundle assets`);
            }
            forge_1.logger.info(`  ${chalk_1.default.cyan('npm run dev')} - Start development server`);
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
    isValidProjectName(name) {
        return /^[a-z][a-z0-9-]*$/.test(name);
    }
    async copyStarter(starter, projectPath, projectName) {
        const starterPath = path_1.default.join(__dirname, '../../embedded/starters', starter);
        if (!(await forge_1.fs.exists(starterPath))) {
            // For now, create a minimal starter
            forge_1.logger.warn(`Starter ${starter} not found, creating minimal project`);
            await this.createMinimalStarter(projectPath, projectName);
            return;
        }
        await forge_1.fs.copyTemplate(starterPath, projectPath, {
            PROJECT_NAME: projectName,
            PROJECT_NAME_CAPITALIZED: projectName.charAt(0).toUpperCase() + projectName.slice(1),
        });
    }
    async createMinimalStarter(projectPath, projectName) {
        // Create a minimal package.json
        const packageJson = {
            name: projectName,
            version: '0.1.0',
            description: `${projectName} - Created with Fractary Forge`,
            scripts: {
                dev: 'echo "Add your dev script here"',
                build: 'echo "Add your build script here"',
                test: 'echo "Add your test script here"',
            },
            keywords: ['fractary'],
            author: '',
            license: 'MIT',
        };
        await forge_1.fs.writeJson(path_1.default.join(projectPath, 'package.json'), packageJson);
        // Create basic directories
        await forge_1.fs.ensureDir(path_1.default.join(projectPath, 'src'));
        await forge_1.fs.ensureDir(path_1.default.join(projectPath, 'docs'));
        await forge_1.fs.ensureDir(path_1.default.join(projectPath, '.claude'));
        // Create a simple README
        const readme = `# ${projectName}

Created with [Fractary Forge](https://github.com/fractary/forge-cli)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure

- \`src/\` - Source code
- \`docs/\` - Documentation
- \`.claude/\` - Claude AI agents and configurations

## License

MIT`;
        await forge_1.fs.writeFile(path_1.default.join(projectPath, 'README.md'), readme);
    }
    async createManifest(projectPath, manifest) {
        const manifestPath = path_1.default.join(projectPath, 'fractory.manifest.json');
        await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }
}
exports.CreateCommand = CreateCommand;
//# sourceMappingURL=create.js.map