"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffCommand = void 0;
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
class DiffCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('diff [bundle]')
            .description('Show differences between local files and bundle versions')
            .option('--format <format>', 'Output format (summary|detailed|json)', 'summary')
            .action(async (bundle, options) => {
            await this.execute(bundle, options);
        });
    }
    async execute(bundleName, options) {
        try {
            forge_1.logger.info('Analyzing differences...\n');
            // Load manifest
            const manifestPath = path_1.default.join(process.cwd(), 'fractory.manifest.json');
            if (!(await forge_1.fs.exists(manifestPath))) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.FILE_NOT_FOUND, 'No fractory.manifest.json found. Is this a Fractary project?');
            }
            const manifest = await forge_1.fs.readJson(manifestPath);
            if (!manifest.bundles || manifest.bundles.length === 0) {
                forge_1.logger.info('No bundles to compare');
                return;
            }
            // Filter bundles to check
            const bundlesToCheck = bundleName
                ? manifest.bundles.filter((b) => b.name === bundleName)
                : manifest.bundles;
            if (bundlesToCheck.length === 0) {
                throw new forge_1.ForgeError(forge_1.ErrorCode.BUNDLE_NOT_FOUND, `Bundle ${bundleName} not found in manifest`);
            }
            const allDiffs = new Map();
            // Check each bundle
            for (const bundle of bundlesToCheck) {
                const diffs = await this.calculateDiffs(process.cwd(), bundle.name, manifest.checksums || {});
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
    async calculateDiffs(projectPath, bundleName, storedChecksums) {
        const diffs = [];
        const bundlePath = path_1.default.join(__dirname, '../../embedded/bundles', bundleName);
        if (!(await forge_1.fs.exists(bundlePath))) {
            forge_1.logger.warn(`Bundle ${bundleName} not found in embedded assets`);
            return diffs;
        }
        // Get all files in bundle
        const bundleFiles = await this.getBundleFiles(bundlePath);
        const processedPaths = new Set();
        // Check bundle files
        for (const file of bundleFiles) {
            const relativePath = path_1.default.relative(bundlePath, file);
            const targetPath = path_1.default.join(projectPath, relativePath);
            processedPaths.add(relativePath);
            const bundleContent = await forge_1.fs.readFile(file);
            const bundleChecksum = this.calculateChecksum(bundleContent);
            if (await forge_1.fs.exists(targetPath)) {
                const localContent = await forge_1.fs.readFile(targetPath);
                const localChecksum = this.calculateChecksum(localContent);
                if (localChecksum === bundleChecksum) {
                    diffs.push({
                        path: relativePath,
                        status: 'unchanged',
                        localChecksum,
                        bundleChecksum,
                    });
                }
                else {
                    diffs.push({
                        path: relativePath,
                        status: 'modified',
                        localChecksum,
                        bundleChecksum,
                    });
                }
            }
            else {
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
                const targetPath = path_1.default.join(projectPath, filePath);
                if (await forge_1.fs.exists(targetPath)) {
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
    async getBundleFiles(bundlePath) {
        const files = await forge_1.fs.findFiles('**/*', {
            cwd: bundlePath,
            ignore: ['node_modules/**', '.git/**', '*.log'],
        });
        const fileList = [];
        for (const file of files) {
            if (await forge_1.fs.isFile(file)) {
                fileList.push(file);
            }
        }
        return fileList;
    }
    calculateChecksum(content) {
        return (0, crypto_1.createHash)('sha256').update(content).digest('hex').substring(0, 8);
    }
    outputSummary(allDiffs) {
        for (const [bundleName, diffs] of allDiffs) {
            const added = diffs.filter((d) => d.status === 'added').length;
            const modified = diffs.filter((d) => d.status === 'modified').length;
            const deleted = diffs.filter((d) => d.status === 'deleted').length;
            const unchanged = diffs.filter((d) => d.status === 'unchanged').length;
            forge_1.logger.info(chalk_1.default.cyan(`Bundle: ${bundleName}`));
            if (added === 0 && modified === 0 && deleted === 0) {
                forge_1.logger.info(`  ${chalk_1.default.green('✓')} No differences found\n`);
            }
            else {
                if (added > 0) {
                    forge_1.logger.info(`  ${chalk_1.default.green('+')} ${added} file(s) to be added`);
                }
                if (modified > 0) {
                    forge_1.logger.info(`  ${chalk_1.default.yellow('~')} ${modified} file(s) modified`);
                }
                if (deleted > 0) {
                    forge_1.logger.info(`  ${chalk_1.default.red('-')} ${deleted} file(s) deleted from bundle`);
                }
                if (unchanged > 0) {
                    forge_1.logger.info(`  ${chalk_1.default.gray('=')} ${unchanged} file(s) unchanged`);
                }
                forge_1.logger.info('');
            }
        }
    }
    outputDetailed(allDiffs) {
        for (const [bundleName, diffs] of allDiffs) {
            forge_1.logger.info(chalk_1.default.cyan(`Bundle: ${bundleName}\n`));
            const sorted = [...diffs].sort((a, b) => {
                const order = { added: 0, modified: 1, deleted: 2, unchanged: 3 };
                return order[a.status] - order[b.status] || a.path.localeCompare(b.path);
            });
            for (const diff of sorted) {
                const statusSymbol = {
                    added: chalk_1.default.green('+'),
                    modified: chalk_1.default.yellow('~'),
                    deleted: chalk_1.default.red('-'),
                    unchanged: chalk_1.default.gray('='),
                }[diff.status];
                forge_1.logger.info(`  ${statusSymbol} ${diff.path}`);
                if (diff.status === 'modified' && diff.localChecksum && diff.bundleChecksum) {
                    forge_1.logger.info(`    Local:  ${diff.localChecksum}`);
                    forge_1.logger.info(`    Bundle: ${diff.bundleChecksum}`);
                }
            }
            forge_1.logger.info('');
        }
    }
    outputJson(allDiffs) {
        const output = {};
        for (const [bundleName, diffs] of allDiffs) {
            output[bundleName] = diffs;
        }
        console.log(JSON.stringify(output, null, 2));
    }
}
exports.DiffCommand = DiffCommand;
//# sourceMappingURL=diff.js.map