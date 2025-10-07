import { Command } from 'commander';
import path from 'path';
// @ts-ignore - No types for Ajv
import Ajv from 'ajv';
import { BaseCommand } from './base';
import {
  ProjectManifest,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  fs,
  ForgeError,
  ErrorCode,
  logger,
} from '@fractary/forge';
import chalk from 'chalk';

interface ValidateOptions {
  fix?: boolean;
  strict?: boolean;
  schema?: string;
}

export class ValidateCommand extends BaseCommand {
  private ajv: Ajv;

  constructor() {
    super();
    this.ajv = new Ajv({ allErrors: true, verbose: true });
  }

  register(program: Command): Command {
    return program
      .command('validate')
      .description('Validate project manifest and configuration')
      .option('--fix', 'Auto-fix simple issues')
      .option('--strict', 'Fail on warnings')
      .option('--schema <path>', 'Custom schema file path')
      .action(async (options: any) => {
        await this.execute(options);
      });
  }

  private async execute(options: ValidateOptions): Promise<void> {
    try {
      logger.info('Validating project configuration...\n');

      // Load or create manifest
      const manifestPath = path.join(process.cwd(), 'fractory.manifest.json');
      let manifest: ProjectManifest;

      if (!(await fs.exists(manifestPath))) {
        if (options.fix) {
          logger.warn('No fractory.manifest.json found. Creating one...');

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
          throw new ForgeError(
            ErrorCode.FILE_NOT_FOUND,
            'No fractory.manifest.json found. Run "forge validate --fix" to create one.'
          );
        }
      } else {
        manifest = await fs.readJson<ProjectManifest>(manifestPath);
      }
      const result = await this.validateManifest(manifest, options);

      // Auto-fix if requested
      if (options.fix && (result.errors.length > 0 || result.warnings.length > 0)) {
        logger.info('Attempting auto-fix...\n');
        manifest = await this.autoFix(manifest, result);
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });

        // Re-validate after fixes
        const newResult = await this.validateManifest(manifest, options);
        this.reportResults(newResult, options);

        if (newResult.valid) {
          logger.success('\n✓ Issues fixed successfully');
        }
      } else {
        this.reportResults(result, options);
      }

      // Exit with error if validation failed
      if (!result.valid || (options.strict && result.warnings.length > 0)) {
        process.exit(1);
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

  private async validateManifest(
    manifest: ProjectManifest,
    options: ValidateOptions
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Load schema
    const schema = await this.loadSchema(options.schema);
    const validate = this.ajv.compile(schema);

    // Validate against JSON schema
    const valid = validate(manifest);
    if (!valid && validate.errors) {
      for (const error of validate.errors) {
        errors.push({
          path: error.instancePath || '/',
          message: error.message || 'Invalid value',
          code: `SCHEMA_${error.keyword?.toUpperCase()}`,
        });
      }
    }

    // Custom validations

    // Check project name
    if (!this.isValidProjectName(manifest.name)) {
      errors.push({
        path: '/name',
        message: 'Project name must be lowercase with hyphens only',
        code: 'INVALID_NAME',
      });
    }

    // Check version format
    if (!this.isValidVersion(manifest.version)) {
      errors.push({
        path: '/version',
        message: 'Version must follow semver format (e.g., 1.0.0)',
        code: 'INVALID_VERSION',
      });
    }

    // Check bundles
    if (manifest.bundles) {
      const bundleNames = new Set<string>();

      for (let i = 0; i < manifest.bundles.length; i++) {
        const bundle = manifest.bundles[i];

        // Check for duplicate bundles
        if (bundleNames.has(bundle.name)) {
          errors.push({
            path: `/bundles/${i}/name`,
            message: `Duplicate bundle: ${bundle.name}`,
            code: 'DUPLICATE_BUNDLE',
          });
        }
        bundleNames.add(bundle.name);

        // Check bundle exists
        const bundlePath = path.join(__dirname, '../../embedded/bundles', bundle.name);
        if (!(await fs.exists(bundlePath))) {
          warnings.push({
            path: `/bundles/${i}/name`,
            message: `Bundle not found in embedded assets: ${bundle.name}`,
            code: 'BUNDLE_NOT_FOUND',
          });
        }

        // Validate ownership rules
        if (bundle.ownership) {
          for (const [pattern, rule] of Object.entries(bundle.ownership)) {
            if (!['copy', 'copy-if-absent', 'merge', 'ignore'].includes(rule)) {
              errors.push({
                path: `/bundles/${i}/ownership/${pattern}`,
                message: `Invalid ownership rule: ${rule}`,
                code: 'INVALID_OWNERSHIP',
              });
            }
          }
        }
      }
    }

    // Check starter if specified
    if (manifest.starter) {
      const starterPath = path.join(__dirname, '../../embedded/starters', manifest.starter);
      if (!(await fs.exists(starterPath))) {
        warnings.push({
          path: '/starter',
          message: `Starter not found in embedded assets: ${manifest.starter}`,
          code: 'STARTER_NOT_FOUND',
        });
      }
    }

    // Check environment
    if (manifest.environment && !['test', 'prod'].includes(manifest.environment)) {
      errors.push({
        path: '/environment',
        message: 'Environment must be either "test" or "prod"',
        code: 'INVALID_ENVIRONMENT',
      });
    }

    // Check for required fields
    if (!manifest.name) {
      errors.push({
        path: '/name',
        message: 'Project name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!manifest.version) {
      errors.push({
        path: '/version',
        message: 'Project version is required',
        code: 'REQUIRED_FIELD',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async loadSchema(customPath?: string): Promise<any> {
    if (customPath) {
      if (!(await fs.exists(customPath))) {
        throw new ForgeError(ErrorCode.FILE_NOT_FOUND, `Schema file not found: ${customPath}`);
      }
      return await fs.readJson(customPath);
    }

    // Default schema
    return {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        starter: { type: 'string' },
        bundles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              ownership: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                  enum: ['copy', 'copy-if-absent', 'merge', 'ignore'],
                },
              },
            },
            required: ['name', 'version'],
          },
        },
        environment: {
          type: 'string',
          enum: ['test', 'prod'],
        },
        lastUpdated: { type: 'string' },
        checksums: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['name', 'version'],
      additionalProperties: false,
    };
  }

  private async autoFix(
    manifest: ProjectManifest,
    result: ValidationResult
  ): Promise<ProjectManifest> {
    const fixed = { ...manifest };

    // Fix version format
    const versionError = result.errors.find((e) => e.code === 'INVALID_VERSION');
    if (versionError && fixed.version) {
      // Try to fix common version issues
      fixed.version = fixed.version.replace(/^v/, ''); // Remove 'v' prefix
      if (!/^\d+\.\d+\.\d+/.test(fixed.version)) {
        fixed.version = '0.1.0'; // Default to 0.1.0
      }
      logger.info(`  Fixed version: ${fixed.version}`);
    }

    // Fix project name
    const nameError = result.errors.find((e) => e.code === 'INVALID_NAME');
    if (nameError && fixed.name) {
      fixed.name = fixed.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      logger.info(`  Fixed project name: ${fixed.name}`);
    }

    // Fix invalid environment
    const envError = result.errors.find((e) => e.path === '/environment');
    if (envError) {
      fixed.environment = 'test';
      logger.info(`  Fixed environment: test`);
    }

    // Remove duplicate bundles
    if (fixed.bundles) {
      const seen = new Set<string>();
      fixed.bundles = fixed.bundles.filter((b) => {
        if (seen.has(b.name)) {
          logger.info(`  Removed duplicate bundle: ${b.name}`);
          return false;
        }
        seen.add(b.name);
        return true;
      });
    }

    // Add missing required fields
    if (!fixed.name) {
      fixed.name = path.basename(process.cwd());
      logger.info(`  Added project name: ${fixed.name}`);
    }

    if (!fixed.version) {
      fixed.version = '0.1.0';
      logger.info(`  Added version: ${fixed.version}`);
    }

    // Update lastUpdated
    fixed.lastUpdated = new Date().toISOString();

    return fixed;
  }

  private isValidProjectName(name: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(name);
  }

  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version);
  }

  private reportResults(result: ValidationResult, options: ValidateOptions): void {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      logger.success('✓ Validation passed - no issues found');
      return;
    }

    // Report errors
    if (result.errors.length > 0) {
      logger.error(`Found ${result.errors.length} error(s):\n`);
      for (const error of result.errors) {
        logger.error(`  ${chalk.red('✗')} ${error.path}: ${error.message}`);
      }
      logger.info('');
    }

    // Report warnings
    if (result.warnings.length > 0) {
      logger.warn(`Found ${result.warnings.length} warning(s):\n`);
      for (const warning of result.warnings) {
        logger.warn(`  ${chalk.yellow('⚠')} ${warning.path}: ${warning.message}`);
      }
      logger.info('');
    }

    // Suggest fix
    if (!options.fix && (result.errors.length > 0 || result.warnings.length > 0)) {
      logger.info(chalk.gray('Tip: Use --fix to automatically fix some issues'));
    }
  }
}
