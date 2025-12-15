import { Command } from 'commander';
import prompts from 'prompts';
import path from 'path';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  fs,
  ForgeError,
  ErrorCode,
  logger,
  ConfigManager,
  ResolverManager,
} from '@fractary/forge';
import { execSync } from 'child_process';
import chalk from 'chalk';

interface CreateOptions {
  starter?: string;
  bundle?: string;
  env?: string;
  dryRun?: boolean;
  force?: boolean;
}

export class CreateCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('create <name>')
      .description('Create a new Fractary project')
      .option('-s, --starter <name>', 'Starter template to use', 'www-astro-blog')
      .option('-b, --bundle <name>', 'Bundle to include', 'www-marketing')
      .option('--env <environment>', 'Environment (test|prod)', 'test')
      .option('--dry-run', 'Preview without creating')
      .option('-f, --force', 'Overwrite existing directory')
      .action(async (name: string, options: any) => {
        await this.execute(name, options as CreateOptions);
      });
  }

  private async execute(name: string, options: CreateOptions): Promise<void> {
    try {
      logger.info(`Creating new project: ${chalk.cyan(name)}`);

      // Validate project name
      if (!this.isValidProjectName(name)) {
        throw new ForgeError(
          ErrorCode.INVALID_ARGUMENT,
          'Project name must be lowercase with hyphens only'
        );
      }

      const projectPath = path.resolve(process.cwd(), name);

      // Check if directory exists
      if (await fs.exists(projectPath)) {
        if (!options.force) {
          throw new ForgeError(
            ErrorCode.FILE_EXISTS,
            `Directory ${name} already exists. Use --force to overwrite.`
          );
        }
        logger.warn(`Overwriting existing directory: ${name}`);
        await fs.remove(projectPath);
      }

      // Interactive prompts if starter not specified
      if (!options.starter && !options.dryRun) {
        const response = await prompts([
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
        logger.info('Dry run mode - no files will be created');
        logger.info(`Would create project at: ${projectPath}`);
        logger.info(`Starter: ${options.starter}`);
        if (options.bundle) {
          logger.info(`Bundle: ${options.bundle}`);
        }
        return;
      }

      // Create project directory
      logger.startSpinner('Creating project structure...');
      await fs.ensureDir(projectPath);

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
        environment: options.env as 'test' | 'prod',
        lastUpdated: new Date().toISOString(),
      });

      logger.succeedSpinner('Project structure created');

      // Install dependencies if package.json exists
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.exists(packageJsonPath)) {
        logger.startSpinner('Installing dependencies...');
        try {
          execSync('npm install', {
            cwd: projectPath,
            stdio: 'pipe',
          });
          logger.succeedSpinner('Dependencies installed');
        } catch (error) {
          logger.failSpinner('Failed to install dependencies');
          logger.warn('Please run npm install manually');
        }
      }

      // Deploy initial bundle if specified
      if (options.bundle) {
        logger.info('Deploying initial bundle...');
        try {
          const DeployCommand = (await import('./deploy')).DeployCommand;
          const deployCmd = new DeployCommand();
          await deployCmd.executeInProject(projectPath);
        } catch (error) {
          logger.warn('Failed to deploy bundle. Run "forge deploy" manually.');
        }
      }

      // Success message
      logger.success(`\n✨ Project ${chalk.green(name)} created successfully!\n`);
      logger.info('Next steps:');
      logger.info(`  ${chalk.cyan(`cd ${name}`)}`);
      if (options.bundle) {
        logger.info(`  ${chalk.cyan('fractary forge deploy')} - Deploy bundle assets`);
      }
      logger.info(`  ${chalk.cyan('npm run dev')} - Start development server`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }

  private isValidProjectName(name: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(name);
  }

  private async copyStarter(
    starter: string,
    projectPath: string,
    projectName: string
  ): Promise<void> {
    const starterPath = path.join(__dirname, '../../embedded/starters', starter);

    if (!(await fs.exists(starterPath))) {
      // For now, create a minimal starter
      logger.warn(`Starter ${starter} not found, creating minimal project`);
      await this.createMinimalStarter(projectPath, projectName);
      return;
    }

    await fs.copyTemplate(starterPath, projectPath, {
      PROJECT_NAME: projectName,
      PROJECT_NAME_CAPITALIZED: projectName.charAt(0).toUpperCase() + projectName.slice(1),
    });
  }

  private async createMinimalStarter(projectPath: string, projectName: string): Promise<void> {
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

    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson);

    // Create basic directories
    await fs.ensureDir(path.join(projectPath, 'src'));
    await fs.ensureDir(path.join(projectPath, 'docs'));
    await fs.ensureDir(path.join(projectPath, '.claude'));

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

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  private async createManifest(projectPath: string, manifest: ProjectManifest): Promise<void> {
    const manifestPath = path.join(projectPath, 'fractory.manifest.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }
}
