"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommand = void 0;
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class UpdateCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('update [bundle]')
            .description('Update bundles to latest versions')
            .option('-f, --force', 'Force update even with local changes')
            .option('--dry-run', 'Preview updates without applying')
            .action(async (bundle, options) => {
            await this.execute(bundle, options);
        });
    }
    async execute(bundleName, options) {
        try {
            forge_1.logger.info('Checking for bundle updates...');
            // Load manifest
            const manifestPath = path_1.default.join(process.cwd(), 'fractory.manifest.json');
            if (!(await forge_1.fs.exists(manifestPath))) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, 'No fractory.manifest.json found. Is this a Fractary project?');
            }
            const manifest = await forge_1.fs.readJson(manifestPath);
            if (!manifest.bundles || manifest.bundles.length === 0) {
                forge_1.logger.info('No bundles to update');
                return;
            }
            // Filter bundles to update
            const bundlesToUpdate = bundleName
                ? manifest.bundles.filter((b) => b.name === bundleName)
                : manifest.bundles;
            if (bundlesToUpdate.length === 0) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.BUNDLE_NOT_FOUND, `Bundle ${bundleName} not found in manifest`);
            }
            // Check each bundle for updates
            let hasUpdates = false;
            for (const bundle of bundlesToUpdate) {
                forge_1.logger.info(`Checking ${chalk_1.default.cyan(bundle.name)}...`);
                // In a real implementation, this would check a registry
                // For now, we'll simulate checking
                const hasUpdate = await this.checkForUpdate(bundle.name, bundle.version);
                if (hasUpdate) {
                    hasUpdates = true;
                    forge_1.logger.info(`  ${chalk_1.default.yellow('→')} Update available for ${bundle.name}`);
                    if (!options.dryRun) {
                        // Update version in manifest
                        bundle.version = 'latest'; // In reality, would get the actual version
                        forge_1.logger.success(`  ${chalk_1.default.green('✓')} Updated ${bundle.name} to latest`);
                    }
                    else {
                        forge_1.logger.info(`  [DRY-RUN] Would update ${bundle.name} to latest`);
                    }
                }
                else {
                    forge_1.logger.info(`  ${chalk_1.default.green('✓')} ${bundle.name} is up to date`);
                }
            }
            if (hasUpdates && !options.dryRun) {
                // Save updated manifest
                manifest.lastUpdated = new Date().toISOString();
                await forge_1.fs.writeJson(manifestPath, manifest, { spaces: 2 });
                // Deploy updated bundles
                forge_1.logger.info('\nDeploying updated bundles...');
                const DeployCommand = (await Promise.resolve().then(() => __importStar(require('./deploy')))).DeployCommand;
                const deployCmd = new DeployCommand();
                await deployCmd.executeInProject(process.cwd(), { force: options.force });
                forge_1.logger.success('\n✨ Bundles updated successfully!');
            }
            else if (!hasUpdates) {
                forge_1.logger.success('\n✓ All bundles are up to date');
            }
            else {
                forge_1.logger.info('\n[DRY-RUN] No changes applied');
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
    async checkForUpdate(_bundleName, _currentVersion) {
        // In a real implementation, this would:
        // 1. Query the package registry (GitHub Packages)
        // 2. Compare versions using semver
        // 3. Return true if a newer version is available
        // For now, simulate random updates for demo
        return Math.random() > 0.5;
    }
}
exports.UpdateCommand = UpdateCommand;
//# sourceMappingURL=update.js.map