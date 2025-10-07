import { Command } from 'commander';
import { BaseCommand } from './base';
import {
  logger,
  ResolverManager,
  ConfigManager,
  type CatalogEntry,
} from '@fractary/forge';
import chalk from 'chalk';

export interface SearchOptions {
  type?: 'bundle' | 'starter' | 'all';
  json?: boolean;
  limit?: number;
}

export class SearchCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('search <query>')
      .description('Search for bundles and starters across all catalogs')
      .option('-t, --type <type>', 'Filter by type: bundle, starter, or all', 'all')
      .option('--json', 'Output as JSON')
      .option('-l, --limit <number>', 'Limit number of results', '20')
      .action(async (query: string, options: any) => {
        await this.execute(query, options);
      });
  }

  private async execute(query: string, options: SearchOptions): Promise<void> {
    try {
      logger.startSpinner(`Searching for "${query}"...`);

      // Load config using SDK
      const configMgr = new ConfigManager();
      const config = await configMgr.loadGlobalConfig();

      // Initialize resolver manager
      const manager = new ResolverManager({
        githubToken: config.resolvers.github?.token,
        defaultOrg: config.resolvers.github?.defaultOrg,
        catalogs: config.resolvers.catalog?.sources.map(s => s.url),
      });

      // Search for assets
      logger.updateSpinner(`Searching catalogs for "${query}"...`);
      const searchType = options.type === 'all' ? undefined : options.type;
      const results = await manager.searchAssets(query, searchType);
      logger.stopSpinner();

      // Limit results if specified
      const limit = options.limit ? parseInt(String(options.limit), 10) : 20;
      const limited = results.slice(0, limit);

      // Output results
      if (options.json) {
        console.log(JSON.stringify(limited, null, 2));
      } else {
        if (limited.length === 0) {
          console.log(chalk.yellow(`\n⚠  No results found for "${query}"`));
          console.log();
          console.log('Try:');
          console.log('  • Using different keywords');
          console.log('  • Running "fractary forge list" to see all available assets');
          console.log('  • Adding more catalogs with "fractary forge config add-catalog"');
        } else {
          console.log(chalk.bold.cyan(`\n🔍 Search Results for "${query}":`));
          console.log();

          for (const result of limited) {
            const isStarter =
              result.id.includes('starter') || (result as any).repository?.includes('starter');
            const type = isStarter ? chalk.blue('[STARTER]') : chalk.green('[BUNDLE]');

            console.log(`${type} ${chalk.bold(result.name)}`);
            console.log(`    ${chalk.gray(result.description)}`);
            console.log(`    ${chalk.dim('ID:')} ${result.id}`);
            if ((result as any).repository) {
              console.log(`    ${chalk.dim('Repository:')} ${(result as any).repository}`);
            }
            console.log(`    ${chalk.dim('Version:')} ${result.version}`);
            if (result.tags && result.tags.length > 0) {
              console.log(`    ${chalk.dim('Tags:')} ${result.tags.join(', ')}`);
            }

            // Installation command
            if (isStarter) {
              const repo = (result as any).repository || result.id;
              console.log(`    ${chalk.dim('Install:')} fractary forge create my-project --starter ${repo}`);
            } else {
              const repo = (result as any).repository || result.id;
              console.log(`    ${chalk.dim('Install:')} fractary forge install ${repo}`);
            }
            console.log();
          }

          // Summary
          console.log(chalk.dim('─'.repeat(50)));
          const starterCount = limited.filter(
            (r) => r.id.includes('starter') || (r as any).repository?.includes('starter')
          ).length;
          const bundleCount = limited.length - starterCount;

          if (results.length > limited.length) {
            console.log(
              chalk.bold(
                `Showing ${limited.length} of ${results.length} results (${starterCount} starters, ${bundleCount} bundles)`
              )
            );
            console.log(chalk.dim(`Use --limit to show more results`));
          } else {
            console.log(
              chalk.bold(
                `Found ${results.length} results (${starterCount} starters, ${bundleCount} bundles)`
              )
            );
          }
        }
      }
    } catch (error) {
      logger.failSpinner();
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }
}
