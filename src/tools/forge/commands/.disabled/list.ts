import { Command } from 'commander';
import { BaseCommand } from './base';
import {
  logger,
  ResolverManager,
  ConfigManager,
  type CatalogEntry,
} from '@fractary/forge';
import chalk from 'chalk';

interface ListOptions {
  startersOnly?: boolean;
  bundlesOnly?: boolean;
  json?: boolean;
}

export class ListCommand extends BaseCommand {
  register(program: Command): Command {
    return program
      .command('list')
      .description('List available starters and bundles')
      .option('-s, --starters-only', 'Show only starters')
      .option('-b, --bundles-only', 'Show only bundles')
      .option('--json', 'Output as JSON')
      .option('--no-embedded', 'Exclude embedded assets')
      .action(async (options: any) => {
        await this.execute(options);
      });
  }

  private async execute(options: ListOptions): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');

      // Load config using SDK
      const configMgr = new ConfigManager();
      const config = await configMgr.loadGlobalConfig();

      // Initialize resolver manager with config
      const manager = new ResolverManager({
        githubToken: config.resolvers.github?.token,
        defaultOrg: config.resolvers.github?.defaultOrg,
        catalogs: config.resolvers.catalog?.sources.map(s => s.url),
      });

      logger.updateSpinner('Loading available assets...');

      // Use ResolverManager's listAssets method
      const allAssets = await manager.listAssets();

      const results: {
        starters: CatalogEntry[];
        bundles: CatalogEntry[];
      } = {
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
        } else {
          if (!options.startersOnly) {
            results.bundles.push(asset);
          }
        }
      }

      logger.stopSpinner();

      // Output results
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        // Display starters
        if (!options.bundlesOnly && results.starters.length > 0) {
          console.log(chalk.bold.cyan('\n📚 Available Starters:'));
          console.log();

          for (const starter of results.starters) {
            console.log(chalk.green(`  ${starter.name}`));
            console.log(`    ${chalk.gray(starter.description)}`);
            console.log(`    ${chalk.dim('Repository:')} ${starter.repository}`);
            console.log(`    ${chalk.dim('Version:')} ${starter.version}`);
            if (starter.tags && starter.tags.length > 0) {
              console.log(`    ${chalk.dim('Tags:')} ${starter.tags.join(', ')}`);
            }
            console.log(
              `    ${chalk.dim('Install:')} fractary forge create my-project --starter ${starter.repository}`
            );
            console.log();
          }
        } else if (!options.bundlesOnly) {
          logger.info('No starters available');
        }

        // Display bundles
        if (!options.startersOnly && results.bundles.length > 0) {
          console.log(chalk.bold.cyan('\n📦 Available Bundles:'));
          console.log();

          for (const bundle of results.bundles) {
            console.log(chalk.green(`  ${bundle.name}`));
            console.log(`    ${chalk.gray(bundle.description)}`);
            console.log(`    ${chalk.dim('Repository:')} ${bundle.repository}`);
            console.log(`    ${chalk.dim('Version:')} ${bundle.version}`);
            if (bundle.tags && bundle.tags.length > 0) {
              console.log(`    ${chalk.dim('Tags:')} ${bundle.tags.join(', ')}`);
            }
            console.log(`    ${chalk.dim('Install:')} fractary forge install ${bundle.repository}`);
            console.log();
          }
        } else if (!options.startersOnly) {
          logger.info('No bundles available');
        }

        // Summary
        const totalCount = results.starters.length + results.bundles.length;
        console.log(chalk.dim('─'.repeat(50)));
        console.log(
          chalk.bold(
            `Total: ${totalCount} assets (${results.starters.length} starters, ${results.bundles.length} bundles)`
          )
        );

        if (totalCount === 0) {
          console.log();
          logger.info('No assets found. Try adding a catalog:');
          logger.info('  fractary forge config add-catalog <url>');
        }
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
}
