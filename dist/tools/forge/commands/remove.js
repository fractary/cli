"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveCommand = void 0;
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class RemoveCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('remove <bundle>')
            .description('Remove a bundle from the project')
            .option('-f, --force', 'Force removal without confirmation')
            .option('--clean-files', 'Remove deployed files from project')
            .option('--dry-run', 'Show what would be removed without doing it')
            .action(async (bundleName, options) => {
            await this.execute(bundleName, options);
        });
    }
    async execute(bundleName, options) {
        try {
            forge_1.logger.info(`Removing bundle: ${chalk_1.default.cyan(bundleName)}`);
            // Load manifest
            const manifestPath = path_1.default.join(process.cwd(), 'fractory.manifest.json');
            if (!(await forge_1.fs.exists(manifestPath))) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, 'No fractory.manifest.json found. Is this a Fractary project?');
            }
            const manifest = await forge_1.fs.readJson(manifestPath);
            // Check if bundle exists
            if (!manifest.bundles) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, 'No bundles are installed in this project');
            }
            const bundleIndex = manifest.bundles.findIndex((b) => b.name === bundleName);
            if (bundleIndex === -1) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, `Bundle '${bundleName}' is not installed in this project`);
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
                    forge_1.logger.info('Bundle removal cancelled');
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
            await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
            forge_1.logger.success(`✓ Bundle '${bundleName}' removed successfully`);
            if (!options.cleanFiles) {
                forge_1.logger.info(`${chalk_1.default.dim('Tip: Use --clean-files to also remove deployed files')}`);
            }
            // Show final status
            const remainingCount = manifest.bundles.length;
            if (remainingCount === 0) {
                forge_1.logger.info(chalk_1.default.dim('No bundles remaining in project'));
            }
            else {
                forge_1.logger.info(chalk_1.default.dim(`${remainingCount} bundle${remainingCount !== 1 ? 's' : ''} remaining`));
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
    async showRemovalPlan(bundle, options) {
        console.log(chalk_1.default.bold.yellow('\n📋 Removal Plan\n'));
        console.log(`${chalk_1.default.bold('Bundle:')} ${bundle.name} ${chalk_1.default.dim(`(${bundle.version || 'latest'})`)}`);
        console.log(`${chalk_1.default.bold('Action:')} Remove from manifest`);
        if (options.cleanFiles && bundle.ownership) {
            console.log(`${chalk_1.default.bold('Files to clean:')}`);
            for (const [pattern, rule] of Object.entries(bundle.ownership)) {
                const action = this.getCleanupAction(rule);
                console.log(`  ${chalk_1.default.cyan(pattern)} ${chalk_1.default.dim(`(${rule} → ${action})`)}`);
            }
        }
        else if (bundle.ownership) {
            console.log(`${chalk_1.default.bold('Files:')} Deployed files will remain (use --clean-files to remove)`);
        }
        console.log(chalk_1.default.dim('\nRun without --dry-run to execute the removal'));
    }
    getCleanupAction(rule) {
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
    async confirmRemoval(bundleName, options) {
        const questions = [
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
        const response = await (0, prompts_1.default)(questions);
        return response.confirmed && (options.cleanFiles ? response.confirmClean : true);
    }
    async cleanDeployedFiles(bundle) {
        if (!bundle.ownership) {
            forge_1.logger.info('No ownership rules defined, nothing to clean');
            return;
        }
        forge_1.logger.info('Cleaning deployed files...');
        let removedCount = 0;
        let skippedCount = 0;
        for (const [pattern, rule] of Object.entries(bundle.ownership)) {
            const result = await this.cleanPattern(pattern, rule);
            removedCount += result.removed;
            skippedCount += result.skipped;
        }
        if (removedCount > 0) {
            forge_1.logger.success(`✓ Removed ${removedCount} file${removedCount !== 1 ? 's' : ''}`);
        }
        if (skippedCount > 0) {
            forge_1.logger.info(`${chalk_1.default.dim(`Skipped ${skippedCount} file${skippedCount !== 1 ? 's' : ''} (user modified or merge rule)`)}`);
        }
    }
    async cleanPattern(pattern, rule) {
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
                    const dirPath = path_1.default.join(process.cwd(), pattern);
                    if (await forge_1.fs.exists(dirPath)) {
                        const entries = await forge_1.fs.readdir(dirPath);
                        if (entries.length === 0) {
                            await forge_1.fs.rmdir(dirPath);
                            removed++;
                            forge_1.logger.info(`${chalk_1.default.gray('●')} Removed empty directory: ${pattern}`);
                        }
                        else {
                            skipped++;
                        }
                    }
                }
            }
        }
        catch (error) {
            // Ignore errors during cleanup
            skipped++;
        }
        return { removed, skipped };
    }
}
exports.RemoveCommand = RemoveCommand;
//# sourceMappingURL=remove.js.map