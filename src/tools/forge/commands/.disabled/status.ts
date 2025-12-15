import { Command } from 'commander';
import path from 'path';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  Bundle,
  fs,
  logger,
} from '@fractary/forge';
import chalk from 'chalk';

interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
}

export class StatusCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('status')
      .description('Show project status and installed bundles')
      .option('--json', 'Output as JSON')
      .option('-v, --verbose', 'Show detailed information')
      .action(async (options: any) => {
        await this.execute(options);
      });
  }

  private async execute(options: StatusOptions): Promise<void> {
    try {
      // Check if we're in a Fractary project
      const manifestPath = path.join(process.cwd(), 'fractory.manifest.json');
      if (!(await fs.exists(manifestPath))) {
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                error: 'Not a Fractary project',
                message: 'No fractory.manifest.json found',
              },
              null,
              2
            )
          );
        } else {
          logger.error('Not a Fractary project. Run "fractary forge validate --fix" to initialize.');
        }
        process.exit(1);
      }

      const manifest = await fs.readJson<ProjectManifest>(manifestPath);
      const status = await this.generateStatus(manifest, options);

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        this.displayStatus(status, options);
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }

  private async generateStatus(manifest: ProjectManifest, _options: StatusOptions) {
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
        installed: [] as Array<{
          name: string;
          version: string;
          status: 'available' | 'missing' | 'unknown';
          files?: number;
          lastDeployed?: string;
        }>,
      },
      health: {
        manifestValid: true,
        allBundlesAvailable: true,
        issues: [] as string[],
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

  private async checkBundleStatus(bundle: Bundle) {
    const embeddedPath = path.join(__dirname, '../../embedded/bundles', bundle.name);

    let bundleStatus: 'available' | 'missing' | 'unknown' = 'unknown';
    let fileCount = 0;

    try {
      if (await fs.exists(embeddedPath)) {
        bundleStatus = 'available';

        // Count files if verbose
        const stat = await fs.stat(embeddedPath);
        if (stat.isDirectory()) {
          fileCount = await this.countFiles(embeddedPath);
        }
      } else {
        bundleStatus = 'missing';
      }
    } catch {
      bundleStatus = 'unknown';
    }

    return {
      name: bundle.name,
      version: bundle.version || 'latest',
      status: bundleStatus,
      files: fileCount > 0 ? fileCount : undefined,
    };
  }

  private async countFiles(dir: string): Promise<number> {
    let count = 0;
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          count++;
        } else if (stat.isDirectory()) {
          count += await this.countFiles(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
    return count;
  }

  private async performHealthChecks(status: any, manifest: ProjectManifest): Promise<void> {
    // Check for package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!(await fs.exists(packageJsonPath))) {
      status.health.issues.push('No package.json found');
    }

    // Check for src directory
    const srcPath = path.join(process.cwd(), 'src');
    if (!(await fs.exists(srcPath))) {
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

  private displayStatus(status: any, options: StatusOptions): void {
    // Project info
    console.log(chalk.bold.blue('\n📊 Project Status\n'));
    console.log(`${chalk.bold('Project:')} ${status.project.name}`);
    console.log(`${chalk.bold('Version:')} ${status.project.version}`);
    console.log(`${chalk.bold('Starter:')} ${status.project.starter}`);
    console.log(`${chalk.bold('Environment:')} ${status.project.environment}`);
    if (status.project.lastUpdated !== 'unknown') {
      console.log(`${chalk.bold('Last Updated:')} ${status.project.lastUpdated}`);
    }

    // Bundles
    console.log(chalk.bold.magenta('\n🎁 Installed Bundles\n'));

    if (status.bundles.total === 0) {
      console.log(chalk.gray('No bundles installed'));
      console.log(chalk.dim('Use "fractary forge install <bundle-name>" to add bundles'));
    } else {
      for (const bundle of status.bundles.installed) {
        const statusColor = bundle.status === 'available' ? 'green' : 'red';
        const statusIcon = bundle.status === 'available' ? '✓' : '✗';

        console.log(
          `  ${chalk[statusColor](statusIcon)} ${chalk.bold(bundle.name)} ${chalk.dim(`(${bundle.version})`)}`
        );
        console.log(`    Status: ${chalk[statusColor](bundle.status)}`);

        if (options.verbose && bundle.files) {
          console.log(`    Files: ${bundle.files}`);
        }
        console.log('');
      }
    }

    // Health
    console.log(chalk.bold.yellow('\n🏥 Health Check\n'));

    if (status.health.issues.length === 0) {
      console.log(`${chalk.green('✓')} All checks passed`);
    } else {
      console.log(
        `${chalk.red('✗')} Found ${status.health.issues.length} issue${status.health.issues.length !== 1 ? 's' : ''}:`
      );
      for (const issue of status.health.issues) {
        console.log(`  ${chalk.red('•')} ${issue}`);
      }
    }

    // Summary
    console.log(
      chalk.dim(
        `\nSummary: ${status.bundles.total} bundle${status.bundles.total !== 1 ? 's' : ''}, ${status.health.issues.length} issue${status.health.issues.length !== 1 ? 's' : ''}`
      )
    );

    // Suggestions
    if (status.health.issues.length > 0) {
      console.log(chalk.dim('\nSuggestions:'));
      console.log(chalk.dim('  Run "fractary forge validate --fix" to resolve manifest issues'));
      console.log(chalk.dim('  Run "fractary forge deploy" to ensure bundles are properly deployed'));
    }
  }
}
