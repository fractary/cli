"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchCommand = void 0;
const base_1 = require("./base");
const forge_1 = require("@fractary/forge");
const chalk_1 = __importDefault(require("chalk"));
class SearchCommand extends base_1.BaseCommand {
    register(program) {
        return program
            .command('search <query>')
            .description('Search for bundles and starters across all catalogs')
            .option('-t, --type <type>', 'Filter by type: bundle, starter, or all', 'all')
            .option('--json', 'Output as JSON')
            .option('-l, --limit <number>', 'Limit number of results', '20')
            .action(async (query, options) => {
            await this.execute(query, options);
        });
    }
    async execute(query, options) {
        try {
            forge_1.logger.startSpinner(`Searching for "${query}"...`);
            // Load config using SDK
            const configMgr = new forge_1.ConfigManager();
            const config = await configMgr.loadGlobalConfig();
            // Initialize resolver manager
            const manager = new forge_1.ResolverManager({
                githubToken: config.resolvers.github?.token,
                defaultOrg: config.resolvers.github?.defaultOrg,
                catalogs: config.resolvers.catalog?.sources.map(s => s.url),
            });
            // Search for assets
            forge_1.logger.updateSpinner(`Searching catalogs for "${query}"...`);
            const searchType = options.type === 'all' ? undefined : options.type;
            const results = await manager.searchAssets(query, searchType);
            forge_1.logger.stopSpinner();
            // Limit results if specified
            const limit = options.limit ? parseInt(String(options.limit), 10) : 20;
            const limited = results.slice(0, limit);
            // Output results
            if (options.json) {
                console.log(JSON.stringify(limited, null, 2));
            }
            else {
                if (limited.length === 0) {
                    console.log(chalk_1.default.yellow(`\n⚠  No results found for "${query}"`));
                    console.log();
                    console.log('Try:');
                    console.log('  • Using different keywords');
                    console.log('  • Running "fractary forge list" to see all available assets');
                    console.log('  • Adding more catalogs with "fractary forge config add-catalog"');
                }
                else {
                    console.log(chalk_1.default.bold.cyan(`\n🔍 Search Results for "${query}":`));
                    console.log();
                    for (const result of limited) {
                        const isStarter = result.id.includes('starter') || result.repository?.includes('starter');
                        const type = isStarter ? chalk_1.default.blue('[STARTER]') : chalk_1.default.green('[BUNDLE]');
                        console.log(`${type} ${chalk_1.default.bold(result.name)}`);
                        console.log(`    ${chalk_1.default.gray(result.description)}`);
                        console.log(`    ${chalk_1.default.dim('ID:')} ${result.id}`);
                        if (result.repository) {
                            console.log(`    ${chalk_1.default.dim('Repository:')} ${result.repository}`);
                        }
                        console.log(`    ${chalk_1.default.dim('Version:')} ${result.version}`);
                        if (result.tags && result.tags.length > 0) {
                            console.log(`    ${chalk_1.default.dim('Tags:')} ${result.tags.join(', ')}`);
                        }
                        // Installation command
                        if (isStarter) {
                            const repo = result.repository || result.id;
                            console.log(`    ${chalk_1.default.dim('Install:')} fractary forge create my-project --starter ${repo}`);
                        }
                        else {
                            const repo = result.repository || result.id;
                            console.log(`    ${chalk_1.default.dim('Install:')} fractary forge install ${repo}`);
                        }
                        console.log();
                    }
                    // Summary
                    console.log(chalk_1.default.dim('─'.repeat(50)));
                    const starterCount = limited.filter((r) => r.id.includes('starter') || r.repository?.includes('starter')).length;
                    const bundleCount = limited.length - starterCount;
                    if (results.length > limited.length) {
                        console.log(chalk_1.default.bold(`Showing ${limited.length} of ${results.length} results (${starterCount} starters, ${bundleCount} bundles)`));
                        console.log(chalk_1.default.dim(`Use --limit to show more results`));
                    }
                    else {
                        console.log(chalk_1.default.bold(`Found ${results.length} results (${starterCount} starters, ${bundleCount} bundles)`));
                    }
                }
            }
        }
        catch (error) {
            forge_1.logger.failSpinner();
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
exports.SearchCommand = SearchCommand;
//# sourceMappingURL=search.js.map