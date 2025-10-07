"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployCommand = void 0;
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
class DeployCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('deploy')
            .description('Deploy managed assets from bundles')
            .option('-f, --force', 'Overwrite local changes')
            .option('-v, --verbose', 'Show detailed operations')
            .option('--dry-run', 'Preview changes without applying')
            .action(async (options) => {
            await this.execute(options);
        });
    }
    async execute(options) {
        try {
            await this.executeInProject(process.cwd(), options);
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
    async executeInProject(projectPath, options = {}) {
        forge_1.logger.info('Deploying bundle assets...');
        // Load manifest
        const manifestPath = path_1.default.join(projectPath, 'fractory.manifest.json');
        if (!(await forge_1.fs.exists(manifestPath))) {
            throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, 'No fractory.manifest.json found. Is this a Fractary project?');
        }
        const manifest = await forge_1.fs.readJson(manifestPath);
        if (!manifest.bundles || manifest.bundles.length === 0) {
            forge_1.logger.info('No bundles configured in manifest');
            return;
        }
        const results = [];
        // Process each bundle
        for (const bundle of manifest.bundles) {
            forge_1.logger.info(`Processing bundle: ${chalk_1.default.cyan(bundle.name)}`);
            const bundleResults = await this.deployBundle(projectPath, bundle.name, bundle.ownership || {}, options, manifest.checksums || {});
            results.push(...bundleResults);
        }
        // Update checksums in manifest
        if (!options.dryRun && results.length > 0) {
            const newChecksums = {};
            for (const result of results) {
                if (result.action !== 'skipped') {
                    const filePath = path_1.default.join(projectPath, result.path);
                    if (await forge_1.fs.exists(filePath)) {
                        const content = await forge_1.fs.readFile(filePath);
                        newChecksums[result.path] = this.calculateChecksum(content);
                    }
                }
            }
            manifest.checksums = { ...manifest.checksums, ...newChecksums };
            manifest.lastUpdated = new Date().toISOString();
            await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
        }
        // Report results
        this.reportResults(results, options);
    }
    async deployBundle(projectPath, bundleName, ownership, options, existingChecksums) {
        const results = [];
        const bundlePath = path_1.default.join(__dirname, '../../embedded/bundles', bundleName);
        if (!(await forge_1.fs.exists(bundlePath))) {
            // For now, create minimal bundle structure
            forge_1.logger.warn(`Bundle ${bundleName} not found in embedded assets`);
            return results;
        }
        // Get all files in bundle
        const bundleFiles = await this.getBundleFiles(bundlePath);
        for (const file of bundleFiles) {
            const relativePath = path_1.default.relative(bundlePath, file);
            const targetPath = path_1.default.join(projectPath, relativePath);
            const rule = this.getOwnershipRule(relativePath, ownership);
            if (options.verbose) {
                forge_1.logger.debug(`Processing ${relativePath} with rule: ${rule}`);
            }
            const result = await this.applyFile(file, targetPath, relativePath, rule, options, existingChecksums[relativePath]);
            results.push(result);
        }
        return results;
    }
    async getBundleFiles(bundlePath) {
        const files = await forge_1.fs.findFiles('**/*', {
            cwd: bundlePath,
            ignore: ['node_modules/**', '.git/**', '*.log'],
        });
        // Filter out directories
        const fileList = [];
        for (const file of files) {
            if (await forge_1.fs.isFile(file)) {
                fileList.push(file);
            }
        }
        return fileList;
    }
    getOwnershipRule(filePath, ownership) {
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
            }
            else if (pattern.includes('*')) {
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
    async applyFile(sourcePath, targetPath, relativePath, rule, options, existingChecksum) {
        const targetExists = await forge_1.fs.exists(targetPath);
        // Handle dry-run
        if (options.dryRun) {
            let action = 'created';
            if (targetExists) {
                if (rule === 'ignore')
                    action = 'skipped';
                else if (rule === 'copy-if-absent')
                    action = 'skipped';
                else if (rule === 'merge')
                    action = 'merged';
                else
                    action = 'updated';
            }
            forge_1.logger.info(`[DRY-RUN] Would ${action}: ${relativePath}`);
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
                await forge_1.fs.ensureDir(path_1.default.dirname(targetPath));
                await forge_1.fs.copyFile(sourcePath, targetPath);
                return { path: relativePath, action: 'created' };
            case 'copy':
                if (targetExists && !options.force) {
                    // Check if file has been modified
                    const currentContent = await forge_1.fs.readFile(targetPath);
                    const currentChecksum = this.calculateChecksum(currentContent);
                    if (existingChecksum && currentChecksum !== existingChecksum) {
                        forge_1.logger.warn(`File modified locally: ${relativePath} (use --force to overwrite)`);
                        return { path: relativePath, action: 'skipped' };
                    }
                }
                await forge_1.fs.ensureDir(path_1.default.dirname(targetPath));
                await forge_1.fs.copyFile(sourcePath, targetPath, { overwrite: true });
                return { path: relativePath, action: targetExists ? 'updated' : 'created' };
            case 'merge': {
                if (!targetExists) {
                    await forge_1.fs.ensureDir(path_1.default.dirname(targetPath));
                    await forge_1.fs.copyFile(sourcePath, targetPath);
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
    async mergeFile(sourcePath, targetPath, relativePath) {
        const ext = path_1.default.extname(relativePath);
        // For now, simple merge strategies
        if (ext === '.json') {
            try {
                const source = await forge_1.fs.readJson(sourcePath);
                const target = await forge_1.fs.readJson(targetPath);
                const merged = this.mergeJson(target, source);
                await forge_1.fs.writeJson(targetPath, merged, { spaces: 2 });
                return { path: relativePath, action: 'merged' };
            }
            catch (error) {
                forge_1.logger.warn(`Failed to merge JSON file: ${relativePath}`);
                return { path: relativePath, action: 'skipped' };
            }
        }
        // For other files, skip merging for now
        return { path: relativePath, action: 'skipped' };
    }
    mergeJson(target, source) {
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
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    calculateChecksum(content) {
        return (0, crypto_1.createHash)('sha256').update(content).digest('hex');
    }
    reportResults(results, options) {
        const created = results.filter((r) => r.action === 'created').length;
        const updated = results.filter((r) => r.action === 'updated').length;
        const merged = results.filter((r) => r.action === 'merged').length;
        const skipped = results.filter((r) => r.action === 'skipped').length;
        if (options.verbose) {
            forge_1.logger.info('\nDeployment Summary:');
            if (created > 0)
                forge_1.logger.info(`  ${chalk_1.default.green(`Created: ${created}`)}`);
            if (updated > 0)
                forge_1.logger.info(`  ${chalk_1.default.yellow(`Updated: ${updated}`)}`);
            if (merged > 0)
                forge_1.logger.info(`  ${chalk_1.default.blue(`Merged: ${merged}`)}`);
            if (skipped > 0)
                forge_1.logger.info(`  ${chalk_1.default.gray(`Skipped: ${skipped}`)}`);
        }
        const totalChanges = created + updated + merged;
        if (totalChanges > 0) {
            forge_1.logger.success(`✓ Deployed ${totalChanges} file(s) successfully`);
        }
        else {
            forge_1.logger.info('No changes needed');
        }
    }
}
exports.DeployCommand = DeployCommand;
//# sourceMappingURL=deploy.js.map