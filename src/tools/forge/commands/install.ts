import { Command } from 'commander';
import path from 'path';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  Bundle,
  OwnershipRule,
  fs,
  ForgeError,
  ErrorCode,
  logger,
  ConfigManager,
  ResolverManager,
} from '@fractary/forge';
import chalk from 'chalk';

interface InstallOptions {
  save?: boolean;
  force?: boolean;
  ownership?: string | Record<string, string>;
  fromGithub?: boolean;
  fromEmbedded?: boolean;
}

export class InstallCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('install <bundle>')
      .description('Add a bundle to the project')
      .option('--save', 'Save to manifest (default: true)', true)
      .option('-f, --force', 'Force install even if already present')
      .option('--ownership <rules>', 'Custom ownership rules (JSON string)')
      .option('--from-github', 'Force GitHub resolution (skip catalog)')
      .option('--from-embedded', 'Force embedded resolution (for testing)')
      .action(async (bundle: string, options: any) => {
        await this.execute(bundle, options);
      });
  }

  private async execute(
    bundleName: string,
    options: InstallOptions & { fromGithub?: boolean; fromEmbedded?: boolean }
  ): Promise<void> {
    try {
      logger.info(`Installing bundle: ${chalk.cyan(bundleName)}`);

      // Load or create manifest
      const manifestPath = path.join(process.cwd(), 'fractory.manifest.json');
      let manifest: ProjectManifest;

      if (!(await fs.exists(manifestPath))) {
        logger.warn('No fractory.manifest.json found. Creating one for you...');

        // Get project name from package.json or directory name
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let projectName = path.basename(process.cwd());
        const _projectDescription = 'Fractary-managed project';

        if (await fs.exists(packageJsonPath)) {
          const packageJson = await fs.readJson<any>(packageJsonPath);
          projectName = packageJson.name || projectName;
          // projectDescription = packageJson.description || projectDescription;
        }

        // Create initial manifest
        manifest = {
          name: projectName,
          version: '1.0.0',
          bundles: [],
          environment: 'test',
          lastUpdated: new Date().toISOString(),
        };

        // Save the new manifest
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });
        logger.success('✓ Created fractory.manifest.json');
      } else {
        manifest = await fs.readJson<ProjectManifest>(manifestPath);
      }

      // Check if bundle already exists
      if (manifest.bundles) {
        const existing = manifest.bundles.find((b) => b.name === bundleName);
        if (existing && !options.force) {
          throw new ForgeError(
            ErrorCode.FILE_EXISTS,
            `Bundle ${bundleName} is already installed. Use --force to reinstall.`
          );
        }
        if (existing) {
          logger.warn(`Reinstalling bundle: ${bundleName}`);
          manifest.bundles = manifest.bundles.filter((b) => b.name !== bundleName);
        }
      } else {
        manifest.bundles = [];
      }

      // Resolve and fetch the bundle
      logger.startSpinner('Resolving bundle...');

      try {
        const resolver = new ResolverManager({
          useLocal: !options.fromGithub,
        });

        const assetPackage = await resolver.resolveAsset(bundleName, 'bundle');

        logger.succeedSpinner(`Resolved bundle: ${assetPackage.metadata.source}`);

        // Check for deprecation warning
        if (assetPackage.metadata.source.startsWith('embedded:')) {
          logger.warn(
            chalk.yellow(`⚠ This bundle is using embedded assets which are deprecated.`)
          );
          logger.warn(chalk.yellow(`  Please update to use: fractary forge install fractary/${bundleName}`));
        }

        // Parse ownership rules if provided
        let ownership: Record<string, OwnershipRule> =
          ('ownership' in assetPackage.manifest ? assetPackage.manifest.ownership : undefined) ||
          this.getDefaultOwnership(bundleName);
        if (options.ownership && typeof options.ownership === 'string') {
          try {
            ownership = JSON.parse(options.ownership) as Record<string, OwnershipRule>;
          } catch (error) {
            throw new ForgeError(ErrorCode.INVALID_ARGUMENT, 'Invalid ownership rules JSON');
          }
        } else if (options.ownership && typeof options.ownership === 'object') {
          ownership = options.ownership as Record<string, OwnershipRule>;
        }

        // Add bundle to manifest
        const newBundle: Bundle = {
          name: bundleName,
          version: assetPackage.metadata.version,
          ownership,
        };

        manifest.bundles.push(newBundle);

        // Save manifest if requested
        if (options.save !== false) {
          manifest.lastUpdated = new Date().toISOString();
          await fs.writeJson(manifestPath, manifest, { spaces: 2 });
          logger.success(`✓ Bundle ${bundleName} added to manifest`);
        }

        // Deploy the bundle assets
        logger.info('Deploying bundle assets...');
        await this.deployBundleAssets(assetPackage, ownership);

        logger.success(`✨ Bundle ${chalk.green(bundleName)} installed successfully!`);

        // Show post-install instructions if available
        if (assetPackage.manifest.scripts?.['post-install']) {
          logger.info(chalk.dim('Post-install script:'));
          logger.info(chalk.dim(`  ${assetPackage.manifest.scripts['post-install']}`));
        }
      } catch (error) {
        logger.failSpinner('Failed to resolve bundle');
        throw error;
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

  private async deployBundleAssets(
    assetPackage: any,
    ownership: Record<string, 'copy' | 'copy-if-absent' | 'merge' | 'ignore'>
  ): Promise<void> {
    const projectDir = process.cwd();
    let deployedCount = 0;
    let skippedCount = 0;

    for (const [filePath, content] of assetPackage.files) {
      // Determine ownership rule for this file
      let rule: 'copy' | 'copy-if-absent' | 'merge' | 'ignore' = 'copy-if-absent';

      for (const [pattern, patternRule] of Object.entries(ownership)) {
        if (filePath.startsWith(pattern) || this.matchesPattern(filePath, pattern)) {
          rule = patternRule as any;
          break;
        }
      }

      if (rule === 'ignore') {
        skippedCount++;
        continue;
      }

      const targetPath = path.join(projectDir, filePath);
      const targetExists = await fs.exists(targetPath);

      // Apply ownership rule
      if (rule === 'copy' || (rule === 'copy-if-absent' && !targetExists)) {
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, content);
        deployedCount++;
        logger.debug(`  ✓ ${filePath}`);
      } else if (rule === 'merge' && targetExists) {
        // For now, simple overwrite for merge - could be enhanced
        await fs.writeFile(targetPath, content);
        deployedCount++;
        logger.debug(`  ⟲ ${filePath} (merged)`);
      } else {
        skippedCount++;
        logger.debug(`  - ${filePath} (skipped)`);
      }
    }

    logger.info(`Deployed ${deployedCount} files, skipped ${skippedCount} files`);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with glob
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern);
    }
    return filePath === pattern;
  }

  private getDefaultOwnership(
    bundleName: string
  ): Record<string, OwnershipRule> {
    // Default ownership rules based on bundle type
    const defaults: Record<
      string,
      Record<string, OwnershipRule>
    > = {
      'www-marketing': {
        '.claude/': 'copy',
        'docs/': 'merge',
        'src/components/': 'copy-if-absent',
        'src/styles/': 'copy-if-absent',
        'public/': 'copy-if-absent',
      },
      'auth-jwt': {
        '.claude/': 'copy',
        'docs/': 'merge',
        'src/middleware/': 'copy-if-absent',
        'src/utils/': 'copy-if-absent',
        'src/types/': 'copy-if-absent',
        'config/': 'merge',
        '.env.example': 'copy-if-absent',
        '.env': 'ignore',
      },
      'api-auth': {
        '.claude/': 'copy',
        'docs/': 'merge',
        'src/middleware/': 'copy-if-absent',
        'src/models/': 'copy-if-absent',
        'config/': 'merge',
      },
      'cicd-github': {
        '.github/workflows/': 'copy',
        '.claude/': 'copy',
        'scripts/': 'copy-if-absent',
        '.env.example': 'copy-if-absent',
        '.env': 'ignore',
        'README.md': 'merge',
        'docs/': 'merge',
      },
      'agents-engineering': {
        '.claude/agents/': 'copy',
        'src/analyzers/': 'copy',
        'src/generators/': 'copy',
        'src/utils/': 'copy',
        'src/hooks/': 'copy-if-absent',
        'config/': 'merge',
        'scripts/': 'copy-if-absent',
        'templates/': 'copy-if-absent',
        'docs/': 'merge',
        '.github/workflows/code-review.yml': 'copy-if-absent',
        '.pre-commit-config.yaml': 'copy-if-absent',
      },
      default: {
        '.claude/': 'copy',
        'docs/': 'merge',
        'src/': 'copy-if-absent',
        'config/': 'merge',
        'scripts/': 'copy-if-absent',
        '.env.example': 'copy-if-absent',
        '.env': 'ignore',
        'package.json': 'merge',
        'README.md': 'merge',
      },
    };

    // Check for exact match first
    if (bundleName in defaults) {
      return defaults[bundleName];
    }

    // Check for partial match (e.g., forge-bundle-www-marketing -> www-marketing)
    const simpleName = bundleName.replace(/^forge-bundle-/, '');
    if (simpleName in defaults) {
      return defaults[simpleName];
    }

    // Return default rules
    return defaults.default;
  }
}
