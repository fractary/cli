import { Command } from 'commander';
import path from 'path';
import prompts from 'prompts';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  fs,
  ForgeError,
  ErrorCode,
  logger,
} from '@fractary/forge';
import chalk from 'chalk';

interface RemoveOptions {
  force?: boolean;
  cleanFiles?: boolean;
  dryRun?: boolean;
}

export class RemoveCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('remove <bundle>')
      .description('Remove a bundle from the project')
      .option('-f, --force', 'Force removal without confirmation')
      .option('--clean-files', 'Remove deployed files from project')
      .option('--dry-run', 'Show what would be removed without doing it')
      .action(async (bundleName: string, options: any) => {
        await this.execute(bundleName, options);
      });
  }

  private async execute(bundleName: string, options: RemoveOptions): Promise<void> {
    try {
      logger.info(`Removing bundle: ${chalk.cyan(bundleName)}`);

      // Load manifest
      const manifestPath = path.join(process.cwd(), 'fractory.manifest.json');
      if (!(await fs.exists(manifestPath))) {
        throw new ForgeError(
          ErrorCode.FILE_NOT_FOUND,
          'No fractory.manifest.json found. Is this a Fractary project?'
        );
      }

      const manifest = await fs.readJson<ProjectManifest>(manifestPath);

      // Check if bundle exists
      if (!manifest.bundles) {
        throw new ForgeError(ErrorCode.FILE_NOT_FOUND, 'No bundles are installed in this project');
      }

      const bundleIndex = manifest.bundles.findIndex((b) => b.name === bundleName);
      if (bundleIndex === -1) {
        throw new ForgeError(
          ErrorCode.FILE_NOT_FOUND,
          `Bundle '${bundleName}' is not installed in this project`
        );
      }

      const bundle = manifest.bundles[bundleIndex];

      // Show what will be removed
      if (options.dryRun) {
        await this.showRemovalPlan(bundle, options);
        return;
      }

      // Confirm removal unless --force
      if (!options.force) {
        const confirmed = await this.confirmRemoval(bundleName, options);
        if (!confirmed) {
          logger.info('Bundle removal cancelled');
          return;
        }
      }

      // Clean up deployed files if requested
      if (options.cleanFiles) {
        await this.cleanDeployedFiles(bundle);
      }

      // Remove from manifest
      manifest.bundles.splice(bundleIndex, 1);
      manifest.lastUpdated = new Date().toISOString();

      // Save updated manifest
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });

      logger.success(`✓ Bundle '${bundleName}' removed successfully`);

      if (!options.cleanFiles) {
        logger.info(`${chalk.dim('Tip: Use --clean-files to also remove deployed files')}`);
      }

      // Show final status
      const remainingCount = manifest.bundles.length;
      if (remainingCount === 0) {
        logger.info(chalk.dim('No bundles remaining in project'));
      } else {
        logger.info(
          chalk.dim(`${remainingCount} bundle${remainingCount !== 1 ? 's' : ''} remaining`)
        );
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

  private async showRemovalPlan(
    bundle: { name: string; version?: string; ownership?: Record<string, string> },
    options: RemoveOptions
  ): Promise<void> {
    console.log(chalk.bold.yellow('\n📋 Removal Plan\n'));

    console.log(
      `${chalk.bold('Bundle:')} ${bundle.name} ${chalk.dim(`(${bundle.version || 'latest'})`)}`
    );
    console.log(`${chalk.bold('Action:')} Remove from manifest`);

    if (options.cleanFiles && bundle.ownership) {
      console.log(`${chalk.bold('Files to clean:')}`);

      for (const [pattern, rule] of Object.entries(bundle.ownership)) {
        const action = this.getCleanupAction(rule);
        console.log(`  ${chalk.cyan(pattern)} ${chalk.dim(`(${rule} → ${action})`)}`);
      }
    } else if (bundle.ownership) {
      console.log(
        `${chalk.bold('Files:')} Deployed files will remain (use --clean-files to remove)`
      );
    }

    console.log(chalk.dim('\nRun without --dry-run to execute the removal'));
  }

  private getCleanupAction(rule: string): string {
    switch (rule) {
      case 'copy':
        return 'remove if unchanged';
      case 'copy-if-absent':
        return 'keep (user may have modified)';
      case 'merge':
        return 'keep (contains user data)';
      case 'ignore':
        return 'keep (never managed)';
      default:
        return 'keep';
    }
  }

  private async confirmRemoval(bundleName: string, options: RemoveOptions): Promise<boolean> {
    const questions: prompts.PromptObject[] = [
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Remove bundle '${bundleName}' from this project?`,
        initial: false,
      },
    ];

    if (options.cleanFiles) {
      questions.push({
        type: 'confirm',
        name: 'confirmClean',
        message: 'Also remove deployed files from the project?',
        initial: false,
      });
    }

    const response = await prompts(questions);

    return response.confirmed && (options.cleanFiles ? response.confirmClean : true);
  }

  private async cleanDeployedFiles(bundle: {
    name: string;
    ownership?: Record<string, string>;
  }): Promise<void> {
    if (!bundle.ownership) {
      logger.info('No ownership rules defined, nothing to clean');
      return;
    }

    logger.info('Cleaning deployed files...');
    let removedCount = 0;
    let skippedCount = 0;

    for (const [pattern, rule] of Object.entries(bundle.ownership)) {
      const result = await this.cleanPattern(pattern, rule);
      removedCount += result.removed;
      skippedCount += result.skipped;
    }

    if (removedCount > 0) {
      logger.success(`✓ Removed ${removedCount} file${removedCount !== 1 ? 's' : ''}`);
    }

    if (skippedCount > 0) {
      logger.info(
        `${chalk.dim(`Skipped ${skippedCount} file${skippedCount !== 1 ? 's' : ''} (user modified or merge rule)`)}`
      );
    }
  }

  private async cleanPattern(
    pattern: string,
    rule: string
  ): Promise<{ removed: number; skipped: number }> {
    let removed = 0;
    let skipped = 0;

    try {
      // For 'copy' rules, we can safely remove if the file hasn't been modified
      // For 'merge' and 'copy-if-absent', we should keep them as they may contain user data
      // For 'ignore', we never touch them

      if (rule === 'ignore' || rule === 'merge') {
        // Never remove these
        return { removed, skipped: 1 };
      }

      if (rule === 'copy-if-absent') {
        // These files were created once and may have been modified by the user
        // We'll skip them to be safe
        skipped++;
        return { removed, skipped };
      }

      if (rule === 'copy') {
        // These are managed files - we can remove them if they match the bundle version
        // For now, we'll be conservative and just remove empty directories
        if (pattern.endsWith('/')) {
          const dirPath = path.join(process.cwd(), pattern);
          if (await fs.exists(dirPath)) {
            const entries = await fs.readdir(dirPath);
            if (entries.length === 0) {
              await fs.rmdir(dirPath);
              removed++;
              logger.info(`${chalk.gray('●')} Removed empty directory: ${pattern}`);
            } else {
              skipped++;
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors during cleanup
      skipped++;
    }

    return { removed, skipped };
  }
}
