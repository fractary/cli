import { Command } from 'commander';
import path from 'path';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  fs,
  ForgeError,
  ErrorCode,
  logger,
} from '@fractary/forge';
import chalk from 'chalk';
import { createHash } from 'crypto';

interface DiffOptions {
  format?: 'summary' | 'detailed' | 'json';
}

interface DiffResult {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'unchanged';
  localChecksum?: string;
  bundleChecksum?: string;
}

export class DiffCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('diff [bundle]')
      .description('Show differences between local files and bundle versions')
      .option('--format <format>', 'Output format (summary|detailed|json)', 'summary')
      .action(async (bundle: string | undefined, options: any) => {
        await this.execute(bundle, options);
      });
  }

  private async execute(bundleName: string | undefined, options: DiffOptions): Promise<void> {
    try {
      logger.info('Analyzing differences...\n');

      // Load manifest
      const manifestPath = path.join(process.cwd(), 'fractory.manifest.json');
      if (!(await fs.exists(manifestPath))) {
        throw new ForgeError(
          ErrorCode.FILE_NOT_FOUND,
          'No fractory.manifest.json found. Is this a Fractary project?'
        );
      }

      const manifest = await fs.readJson<ProjectManifest>(manifestPath);

      if (!manifest.bundles || manifest.bundles.length === 0) {
        logger.info('No bundles to compare');
        return;
      }

      // Filter bundles to check
      const bundlesToCheck = bundleName
        ? manifest.bundles.filter((b) => b.name === bundleName)
        : manifest.bundles;

      if (bundlesToCheck.length === 0) {
        throw new ForgeError(
          ErrorCode.BUNDLE_NOT_FOUND,
          `Bundle ${bundleName} not found in manifest`
        );
      }

      const allDiffs: Map<string, DiffResult[]> = new Map();

      // Check each bundle
      for (const bundle of bundlesToCheck) {
        const diffs = await this.calculateDiffs(
          process.cwd(),
          bundle.name,
          manifest.checksums || {}
        );
        allDiffs.set(bundle.name, diffs);
      }

      // Output results based on format
      switch (options.format) {
        case 'json':
          this.outputJson(allDiffs);
          break;
        case 'detailed':
          this.outputDetailed(allDiffs);
          break;
        case 'summary':
        default:
          this.outputSummary(allDiffs);
          break;
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

  private async calculateDiffs(
    projectPath: string,
    bundleName: string,
    storedChecksums: Record<string, string>
  ): Promise<DiffResult[]> {
    const diffs: DiffResult[] = [];
    const bundlePath = path.join(__dirname, '../../embedded/bundles', bundleName);

    if (!(await fs.exists(bundlePath))) {
      logger.warn(`Bundle ${bundleName} not found in embedded assets`);
      return diffs;
    }

    // Get all files in bundle
    const bundleFiles = await this.getBundleFiles(bundlePath);
    const processedPaths = new Set<string>();

    // Check bundle files
    for (const file of bundleFiles) {
      const relativePath = path.relative(bundlePath, file);
      const targetPath = path.join(projectPath, relativePath);
      processedPaths.add(relativePath);

      const bundleContent = await fs.readFile(file);
      const bundleChecksum = this.calculateChecksum(bundleContent);

      if (await fs.exists(targetPath)) {
        const localContent = await fs.readFile(targetPath);
        const localChecksum = this.calculateChecksum(localContent);

        if (localChecksum === bundleChecksum) {
          diffs.push({
            path: relativePath,
            status: 'unchanged',
            localChecksum,
            bundleChecksum,
          });
        } else {
          diffs.push({
            path: relativePath,
            status: 'modified',
            localChecksum,
            bundleChecksum,
          });
        }
      } else {
        diffs.push({
          path: relativePath,
          status: 'added',
          bundleChecksum,
        });
      }
    }

    // Check for deleted files (in stored checksums but not in bundle)
    for (const [filePath, checksum] of Object.entries(storedChecksums)) {
      if (!processedPaths.has(filePath)) {
        const targetPath = path.join(projectPath, filePath);
        if (await fs.exists(targetPath)) {
          diffs.push({
            path: filePath,
            status: 'deleted',
            localChecksum: checksum,
          });
        }
      }
    }

    return diffs;
  }

  private async getBundleFiles(bundlePath: string): Promise<string[]> {
    const files = await fs.findFiles('**/*', {
      cwd: bundlePath,
      ignore: ['node_modules/**', '.git/**', '*.log'],
    });

    const fileList: string[] = [];
    for (const file of files) {
      if (await fs.isFile(file)) {
        fileList.push(file);
      }
    }

    return fileList;
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  private outputSummary(allDiffs: Map<string, DiffResult[]>): void {
    for (const [bundleName, diffs] of allDiffs) {
      const added = diffs.filter((d) => d.status === 'added').length;
      const modified = diffs.filter((d) => d.status === 'modified').length;
      const deleted = diffs.filter((d) => d.status === 'deleted').length;
      const unchanged = diffs.filter((d) => d.status === 'unchanged').length;

      logger.info(chalk.cyan(`Bundle: ${bundleName}`));

      if (added === 0 && modified === 0 && deleted === 0) {
        logger.info(`  ${chalk.green('✓')} No differences found\n`);
      } else {
        if (added > 0) {
          logger.info(`  ${chalk.green('+')} ${added} file(s) to be added`);
        }
        if (modified > 0) {
          logger.info(`  ${chalk.yellow('~')} ${modified} file(s) modified`);
        }
        if (deleted > 0) {
          logger.info(`  ${chalk.red('-')} ${deleted} file(s) deleted from bundle`);
        }
        if (unchanged > 0) {
          logger.info(`  ${chalk.gray('=')} ${unchanged} file(s) unchanged`);
        }
        logger.info('');
      }
    }
  }

  private outputDetailed(allDiffs: Map<string, DiffResult[]>): void {
    for (const [bundleName, diffs] of allDiffs) {
      logger.info(chalk.cyan(`Bundle: ${bundleName}\n`));

      const sorted = [...diffs].sort((a, b) => {
        const order = { added: 0, modified: 1, deleted: 2, unchanged: 3 };
        return order[a.status] - order[b.status] || a.path.localeCompare(b.path);
      });

      for (const diff of sorted) {
        const statusSymbol = {
          added: chalk.green('+'),
          modified: chalk.yellow('~'),
          deleted: chalk.red('-'),
          unchanged: chalk.gray('='),
        }[diff.status];

        logger.info(`  ${statusSymbol} ${diff.path}`);

        if (diff.status === 'modified' && diff.localChecksum && diff.bundleChecksum) {
          logger.info(`    Local:  ${diff.localChecksum}`);
          logger.info(`    Bundle: ${diff.bundleChecksum}`);
        }
      }
      logger.info('');
    }
  }

  private outputJson(allDiffs: Map<string, DiffResult[]>): void {
    const output: Record<string, DiffResult[]> = {};
    for (const [bundleName, diffs] of allDiffs) {
      output[bundleName] = diffs;
    }
    console.log(JSON.stringify(output, null, 2));
  }
}
