"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCommand = void 0;
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class ListCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('list')
            .description('List available starters and bundles')
            .option('-s, --starters-only', 'Show only starters')
            .option('-b, --bundles-only', 'Show only bundles')
            .option('--json', 'Output as JSON')
            .option('--no-embedded', 'Exclude embedded assets')
            .action(async (options) => {
            await this.execute(options);
        });
    }
    async execute(options) {
        try {
            forge_1.logger.startSpinner('Loading configuration...');
            // Load config using SDK
            const configMgr = new forge_1.ConfigManager();
            const config = await configMgr.loadGlobalConfig();
            // Initialize resolver manager with config
            const manager = new forge_1.ResolverManager({
                githubToken: config.resolvers.github?.token,
                defaultOrg: config.resolvers.github?.defaultOrg,
                catalogs: config.resolvers.catalog?.sources.map(s => s.url),
            });
            forge_1.logger.updateSpinner('Loading available assets...');
            // Use ResolverManager's listAssets method
            const allAssets = await manager.listAssets();
            const results = {
                starters: [],
                bundles: [],
            };
            // Separate by type
            for (const asset of allAssets) {
                // Determine type based on repository name or ID
                if (asset.repository.includes('starter') || asset.id.includes('starter')) {
                    if (!options.bundlesOnly) {
                        results.starters.push(asset);
                    }
                }
                else {
                    if (!options.startersOnly) {
                        results.bundles.push(asset);
                    }
                }
            }
            forge_1.logger.stopSpinner();
            // Output results
            if (options.json) {
                console.log(JSON.stringify(results, null, 2));
            }
            else {
                // Display starters
                if (!options.bundlesOnly && results.starters.length > 0) {
                    console.log(chalk_1.default.bold.cyan('\n📚 Available Starters:'));
                    console.log();
                    for (const starter of results.starters) {
                        console.log(chalk_1.default.green(`  ${starter.name}`));
                        console.log(`    ${chalk_1.default.gray(starter.description)}`);
                        console.log(`    ${chalk_1.default.dim('Repository:')} ${starter.repository}`);
                        console.log(`    ${chalk_1.default.dim('Version:')} ${starter.version}`);
                        if (starter.tags && starter.tags.length > 0) {
                            console.log(`    ${chalk_1.default.dim('Tags:')} ${starter.tags.join(', ')}`);
                        }
                        console.log(`    ${chalk_1.default.dim('Install:')} fractary forge create my-project --starter ${starter.repository}`);
                        console.log();
                    }
                }
                else if (!options.bundlesOnly) {
                    forge_1.logger.info('No starters available');
                }
                // Display bundles
                if (!options.startersOnly && results.bundles.length > 0) {
                    console.log(chalk_1.default.bold.cyan('\n📦 Available Bundles:'));
                    console.log();
                    for (const bundle of results.bundles) {
                        console.log(chalk_1.default.green(`  ${bundle.name}`));
                        console.log(`    ${chalk_1.default.gray(bundle.description)}`);
                        console.log(`    ${chalk_1.default.dim('Repository:')} ${bundle.repository}`);
                        console.log(`    ${chalk_1.default.dim('Version:')} ${bundle.version}`);
                        if (bundle.tags && bundle.tags.length > 0) {
                            console.log(`    ${chalk_1.default.dim('Tags:')} ${bundle.tags.join(', ')}`);
                        }
                        console.log(`    ${chalk_1.default.dim('Install:')} fractary forge install ${bundle.repository}`);
                        console.log();
                    }
                }
                else if (!options.startersOnly) {
                    forge_1.logger.info('No bundles available');
                }
                // Summary
                const totalCount = results.starters.length + results.bundles.length;
                console.log(chalk_1.default.dim('─'.repeat(50)));
                console.log(chalk_1.default.bold(`Total: ${totalCount} assets (${results.starters.length} starters, ${results.bundles.length} bundles)`));
                if (totalCount === 0) {
                    console.log();
                    forge_1.logger.info('No assets found. Try adding a catalog:');
                    forge_1.logger.info('  fractary forge config add-catalog <url>');
                }
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
}
exports.ListCommand = ListCommand;
//# sourceMappingURL=list.js.map