"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallCommand = void 0;
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class InstallCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('install <bundle>')
            .description('Add a bundle to the project')
            .option('--save', 'Save to manifest (default: true)', true)
            .option('-f, --force', 'Force install even if already present')
            .option('--ownership <rules>', 'Custom ownership rules (JSON string)')
            .option('--from-github', 'Force GitHub resolution (skip catalog)')
            .option('--from-embedded', 'Force embedded resolution (for testing)')
            .action(async (bundle, options) => {
            await this.execute(bundle, options);
        });
    }
    async execute(bundleName, options) {
        try {
            forge_1.logger.info(`Installing bundle: ${chalk_1.default.cyan(bundleName)}`);
            // Load or create manifest
            const manifestPath = path_1.default.join(process.cwd(), 'fractory.manifest.json');
            let manifest;
            if (!(await forge_1.fs.exists(manifestPath))) {
                forge_1.logger.warn('No fractory.manifest.json found. Creating one for you...');
                // Get project name from package.json or directory name
                const packageJsonPath = path_1.default.join(process.cwd(), 'package.json');
                let projectName = path_1.default.basename(process.cwd());
                const _projectDescription = 'Fractary-managed project';
                if (await forge_1.fs.exists(packageJsonPath)) {
                    const packageJson = await forge_1.fs.readJson(packageJsonPath);
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
                await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
                forge_1.logger.success('✓ Created fractory.manifest.json');
            }
            else {
                manifest = await forge_1.fs.readJson(manifestPath);
            }
            // Check if bundle already exists
            if (manifest.bundles) {
                const existing = manifest.bundles.find((b) => b.name === bundleName);
                if (existing && !options.force) {
                    throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_EXISTS, `Bundle ${bundleName} is already installed. Use --force to reinstall.`);
                }
                if (existing) {
                    forge_1.logger.warn(`Reinstalling bundle: ${bundleName}`);
                    manifest.bundles = manifest.bundles.filter((b) => b.name !== bundleName);
                }
            }
            else {
                manifest.bundles = [];
            }
            // Resolve and fetch the bundle
            forge_1.logger.startSpinner('Resolving bundle...');
            try {
                const resolver = new forge_1.ResolverManager({
                    useLocal: !options.fromGithub,
                });
                const assetPackage = await resolver.resolveAsset(bundleName, 'bundle');
                forge_1.logger.succeedSpinner(`Resolved bundle: ${assetPackage.metadata.source}`);
                // Check for deprecation warning
                if (assetPackage.metadata.source.startsWith('embedded:')) {
                    forge_1.logger.warn(chalk_1.default.yellow(`⚠ This bundle is using embedded assets which are deprecated.`));
                    forge_1.logger.warn(chalk_1.default.yellow(`  Please update to use: fractary forge install fractary/${bundleName}`));
                }
                // Parse ownership rules if provided
                let ownership = ('ownership' in assetPackage.manifest ? assetPackage.manifest.ownership : undefined) ||
                    this.getDefaultOwnership(bundleName);
                if (options.ownership && typeof options.ownership === 'string') {
                    try {
                        ownership = JSON.parse(options.ownership);
                    }
                    catch (error) {
                        throw new forge_1.ForgeError(forge_1.ErrorCode.INVALID_ARGUMENT, 'Invalid ownership rules JSON');
                    }
                }
                else if (options.ownership && typeof options.ownership === 'object') {
                    ownership = options.ownership;
                }
                // Add bundle to manifest
                const newBundle = {
                    name: bundleName,
                    version: assetPackage.metadata.version,
                    ownership,
                };
                manifest.bundles.push(newBundle);
                // Save manifest if requested
                if (options.save !== false) {
                    manifest.lastUpdated = new Date().toISOString();
                    await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
                    forge_1.logger.success(`✓ Bundle ${bundleName} added to manifest`);
                }
                // Deploy the bundle assets
                forge_1.logger.info('Deploying bundle assets...');
                await this.deployBundleAssets(assetPackage, ownership);
                forge_1.logger.success(`✨ Bundle ${chalk_1.default.green(bundleName)} installed successfully!`);
                // Show post-install instructions if available
                if (assetPackage.manifest.scripts?.['post-install']) {
                    forge_1.logger.info(chalk_1.default.dim('Post-install script:'));
                    forge_1.logger.info(chalk_1.default.dim(`  ${assetPackage.manifest.scripts['post-install']}`));
                }
            }
            catch (error) {
                forge_1.logger.failSpinner('Failed to resolve bundle');
                throw error;
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
    async deployBundleAssets(assetPackage, ownership) {
        const projectDir = process.cwd();
        let deployedCount = 0;
        let skippedCount = 0;
        for (const [filePath, content] of assetPackage.files) {
            // Determine ownership rule for this file
            let rule = 'copy-if-absent';
            for (const [pattern, patternRule] of Object.entries(ownership)) {
                if (filePath.startsWith(pattern) || this.matchesPattern(filePath, pattern)) {
                    rule = patternRule;
                    break;
                }
            }
            if (rule === 'ignore') {
                skippedCount++;
                continue;
            }
            const targetPath = path_1.default.join(projectDir, filePath);
            const targetExists = await forge_1.fs.exists(targetPath);
            // Apply ownership rule
            if (rule === 'copy' || (rule === 'copy-if-absent' && !targetExists)) {
                await forge_1.fs.ensureDir(path_1.default.dirname(targetPath));
                await forge_1.fs.writeFile(targetPath, content);
                deployedCount++;
                forge_1.logger.debug(`  ✓ ${filePath}`);
            }
            else if (rule === 'merge' && targetExists) {
                // For now, simple overwrite for merge - could be enhanced
                await forge_1.fs.writeFile(targetPath, content);
                deployedCount++;
                forge_1.logger.debug(`  ⟲ ${filePath} (merged)`);
            }
            else {
                skippedCount++;
                forge_1.logger.debug(`  - ${filePath} (skipped)`);
            }
        }
        forge_1.logger.info(`Deployed ${deployedCount} files, skipped ${skippedCount} files`);
    }
    matchesPattern(filePath, pattern) {
        // Simple pattern matching - could be enhanced with glob
        if (pattern.endsWith('/')) {
            return filePath.startsWith(pattern);
        }
        return filePath === pattern;
    }
    getDefaultOwnership(bundleName) {
        // Default ownership rules based on bundle type
        const defaults = {
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
exports.InstallCommand = InstallCommand;
//# sourceMappingURL=install.js.map