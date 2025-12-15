import { Command } from 'commander';
import path from 'path';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  MergeResult,
  OwnershipRule,
  fs,
  ForgeError,
  ErrorCode,
  logger,
} from '@fractary/forge';
import chalk from 'chalk';
import { createHash } from 'crypto';

interface DeployOptions {
  force?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

export class DeployCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('deploy')
      .description('Deploy managed assets from bundles')
      .option('-f, --force', 'Overwrite local changes')
      .option('-v, --verbose', 'Show detailed operations')
      .option('--dry-run', 'Preview changes without applying')
      .action(async (options: any) => {
        await this.execute(options);
      });
  }

  private async execute(options: DeployOptions): Promise<void> {
    try {
      await this.executeInProject(process.cwd(), options);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }

  async executeInProject(projectPath: string, options: DeployOptions = {}): Promise<void> {
    logger.info('Deploying bundle assets...');

    // Load manifest
    const manifestPath = path.join(projectPath, 'fractory.manifest.json');
    if (!(await fs.exists(manifestPath))) {
      throw new ForgeError(
        ErrorCode.FILE_NOT_FOUND,
        'No fractory.manifest.json found. Is this a Fractary project?'
      );
    }

    const manifest = await fs.readJson<ProjectManifest>(manifestPath);

    if (!manifest.bundles || manifest.bundles.length === 0) {
      logger.info('No bundles configured in manifest');
      return;
    }

    const results: MergeResult[] = [];

    // Process each bundle
    for (const bundle of manifest.bundles) {
      logger.info(`Processing bundle: ${chalk.cyan(bundle.name)}`);

      const bundleResults = await this.deployBundle(
        projectPath,
        bundle.name,
        bundle.ownership || {},
        options,
        manifest.checksums || {}
      );

      results.push(...bundleResults);
    }

    // Update checksums in manifest
    if (!options.dryRun && results.length > 0) {
      const newChecksums: Record<string, string> = {};
      for (const result of results) {
        if (result.action !== 'skipped') {
          const filePath = path.join(projectPath, result.path);
          if (await fs.exists(filePath)) {
            const content = await fs.readFile(filePath);
            newChecksums[result.path] = this.calculateChecksum(content);
          }
        }
      }

      manifest.checksums = { ...manifest.checksums, ...newChecksums };
      manifest.lastUpdated = new Date().toISOString();
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }

    // Report results
    this.reportResults(results, options);
  }

  private async deployBundle(
    projectPath: string,
    bundleName: string,
    ownership: Record<string, OwnershipRule>,
    options: DeployOptions,
    existingChecksums: Record<string, string>
  ): Promise<MergeResult[]> {
    const results: MergeResult[] = [];
    const bundlePath = path.join(__dirname, '../../embedded/bundles', bundleName);

    if (!(await fs.exists(bundlePath))) {
      // For now, create minimal bundle structure
      logger.warn(`Bundle ${bundleName} not found in embedded assets`);
      return results;
    }

    // Get all files in bundle
    const bundleFiles = await this.getBundleFiles(bundlePath);

    for (const file of bundleFiles) {
      const relativePath = path.relative(bundlePath, file);
      const targetPath = path.join(projectPath, relativePath);
      const rule = this.getOwnershipRule(relativePath, ownership);

      if (options.verbose) {
        logger.debug(`Processing ${relativePath} with rule: ${rule}`);
      }

      const result = await this.applyFile(
        file,
        targetPath,
        relativePath,
        rule,
        options,
        existingChecksums[relativePath]
      );

      results.push(result);
    }

    return results;
  }

  private async getBundleFiles(bundlePath: string): Promise<string[]> {
    const files = await fs.findFiles('**/*', {
      cwd: bundlePath,
      ignore: ['node_modules/**', '.git/**', '*.log'],
    });

    // Filter out directories
    const fileList: string[] = [];
    for (const file of files) {
      if (await fs.isFile(file)) {
        fileList.push(file);
      }
    }

    return fileList;
  }

  private getOwnershipRule(
    filePath: string,
    ownership: Record<string, OwnershipRule>
  ): OwnershipRule {
    // Check exact match first
    if (ownership[filePath]) {
      return ownership[filePath];
    }

    // Check directory patterns
    for (const [pattern, rule] of Object.entries(ownership)) {
      if (pattern.endsWith('/')) {
        if (filePath.startsWith(pattern)) {
          return rule;
        }
      } else if (pattern.includes('*')) {
        // Simple glob matching (could be enhanced)
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(filePath)) {
          return rule;
        }
      }
    }

    // Default rule
    return 'copy-if-absent';
  }

  private async applyFile(
    sourcePath: string,
    targetPath: string,
    relativePath: string,
    rule: OwnershipRule,
    options: DeployOptions,
    existingChecksum?: string
  ): Promise<MergeResult> {
    const targetExists = await fs.exists(targetPath);

    // Handle dry-run
    if (options.dryRun) {
      let action: MergeResult['action'] = 'created';
      if (targetExists) {
        if (rule === 'ignore') action = 'skipped';
        else if (rule === 'copy-if-absent') action = 'skipped';
        else if (rule === 'merge') action = 'merged';
        else action = 'updated';
      }

      logger.info(`[DRY-RUN] Would ${action}: ${relativePath}`);
      return { path: relativePath, action };
    }

    // Apply ownership rules
    switch (rule) {
      case 'ignore':
        return { path: relativePath, action: 'skipped' };

      case 'copy-if-absent':
        if (targetExists) {
          return { path: relativePath, action: 'skipped' };
        }
        await fs.ensureDir(path.dirname(targetPath));
        await fs.copyFile(sourcePath, targetPath);
        return { path: relativePath, action: 'created' };

      case 'copy':
        if (targetExists && !options.force) {
          // Check if file has been modified
          const currentContent = await fs.readFile(targetPath);
          const currentChecksum = this.calculateChecksum(currentContent);

          if (existingChecksum && currentChecksum !== existingChecksum) {
            logger.warn(`File modified locally: ${relativePath} (use --force to overwrite)`);
            return { path: relativePath, action: 'skipped' };
          }
        }

        await fs.ensureDir(path.dirname(targetPath));
        await fs.copyFile(sourcePath, targetPath, { overwrite: true });
        return { path: relativePath, action: targetExists ? 'updated' : 'created' };

      case 'merge': {
        if (!targetExists) {
          await fs.ensureDir(path.dirname(targetPath));
          await fs.copyFile(sourcePath, targetPath);
          return { path: relativePath, action: 'created' };
        }

        // Merge based on file type
        const result = await this.mergeFile(sourcePath, targetPath, relativePath);
        return result;
      }

      default:
        return { path: relativePath, action: 'skipped' };
    }
  }

  private async mergeFile(
    sourcePath: string,
    targetPath: string,
    relativePath: string
  ): Promise<MergeResult> {
    const ext = path.extname(relativePath);

    // For now, simple merge strategies
    if (ext === '.json') {
      try {
        const source = await fs.readJson(sourcePath);
        const target = await fs.readJson(targetPath);
        const merged = this.mergeJson(target, source);
        await fs.writeJson(targetPath, merged, { spaces: 2 });
        return { path: relativePath, action: 'merged' };
      } catch (error) {
        logger.warn(`Failed to merge JSON file: ${relativePath}`);
        return { path: relativePath, action: 'skipped' };
      }
    }

    // For other files, skip merging for now
    return { path: relativePath, action: 'skipped' };
  }

  private mergeJson(target: any, source: any): any {
    // Simple deep merge
    if (typeof source !== 'object' || source === null) {
      return source;
    }

    if (typeof target !== 'object' || target === null) {
      return source;
    }

    if (Array.isArray(source)) {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (key in result) {
        result[key] = this.mergeJson(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private reportResults(results: MergeResult[], options: DeployOptions): void {
    const created = results.filter((r) => r.action === 'created').length;
    const updated = results.filter((r) => r.action === 'updated').length;
    const merged = results.filter((r) => r.action === 'merged').length;
    const skipped = results.filter((r) => r.action === 'skipped').length;

    if (options.verbose) {
      logger.info('\nDeployment Summary:');
      if (created > 0) logger.info(`  ${chalk.green(`Created: ${created}`)}`);
      if (updated > 0) logger.info(`  ${chalk.yellow(`Updated: ${updated}`)}`);
      if (merged > 0) logger.info(`  ${chalk.blue(`Merged: ${merged}`)}`);
      if (skipped > 0) logger.info(`  ${chalk.gray(`Skipped: ${skipped}`)}`);
    }

    const totalChanges = created + updated + merged;
    if (totalChanges > 0) {
      logger.success(`✓ Deployed ${totalChanges} file(s) successfully`);
    } else {
      logger.info('No changes needed');
    }
  }
}
