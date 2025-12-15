import { Command } from 'commander';
import { BaseCommand } from './base';
import { configManager, logger } from '@fractary/forge';
import chalk from 'chalk';
import prompts from 'prompts';

export class ConfigCommand extends BaseCommand {
  register(program: Command): Command {
    const config = program.command('config').description('Manage Forge configuration');

    // Subcommands
    config
      .command('show')
      .description('Show current configuration')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        await this.showConfig(options);
      });

    config
      .command('set <key> <value>')
      .description('Set a configuration value')
      .action(async (key, value) => {
        await this.setConfig(key, value);
      });

    config
      .command('add-catalog <url>')
      .description('Add a catalog source')
      .option('--name <name>', 'Catalog name')
      .option('--token <token>', 'Authentication token')
      .option('--priority <priority>', 'Priority (higher = preferred)', '0')
      .action(async (url, options) => {
        await this.addCatalog(url, options);
      });

    config
      .command('remove-catalog <url>')
      .description('Remove a catalog source')
      .action(async (url) => {
        await this.removeCatalog(url);
      });

    config
      .command('list-catalogs')
      .description('List configured catalogs')
      .action(async () => {
        await this.listCatalogs();
      });

    return config;
  }

  private async showConfig(options: { json?: boolean }): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');
      const config = await configManager.loadGlobalConfig();
      logger.stopSpinner();

      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log(chalk.bold('Forge Configuration:'));
        console.log();

        // GitHub settings
        if (config.resolvers.github) {
          console.log(chalk.cyan('GitHub:'));
          console.log(`  Default Org: ${config.resolvers.github.defaultOrg || 'fractary'}`);
          console.log(
            `  Token: ${config.resolvers.github.token ? '***' + config.resolvers.github.token.slice(-4) : 'Not set'}`
          );
          if (config.resolvers.github.enterprise) {
            console.log(`  Enterprise: ${config.resolvers.github.enterprise}`);
          }
        }

        // Catalogs
        if (config.resolvers.catalog?.sources && config.resolvers.catalog?.sources.length > 0) {
          console.log();
          console.log(chalk.cyan('Catalogs:'));
          for (const catalog of config.resolvers.catalog?.sources) {
            console.log(`  - ${catalog.name || catalog.url}`);
            if (catalog.priority) {
              console.log(`    Priority: ${catalog.priority}`);
            }
          }
        }

        // Features
        if (config.features) {
          console.log();
          console.log(chalk.cyan('Features:'));
          console.log(
            `  Use Embedded Assets: ${false !== false ? 'Yes' : 'No'}`
          );
          console.log(`  Update Check: ${config.features.updateCheck ? 'Yes' : 'No'}`);
          console.log(`  Telemetry: ${config.features.telemetry ? 'Yes' : 'No'}`);
        }

        // Paths
        if (config.paths) {
          console.log();
          console.log(chalk.cyan('Paths:'));
          console.log(`  Cache: ${config.paths.cache}`);
          console.log(`  Templates: ${config.paths.templates}`);
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

  private async setConfig(key: string, value: string): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');
      const config = await configManager.loadGlobalConfig();
      logger.updateSpinner('Updating configuration...');

      // Parse the key path (e.g., "github.token")
      const keys = key.split('.');
      let current: any = config;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      const lastKey = keys[keys.length - 1];

      // Convert value type if needed
      let parsedValue: any = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);

      current[lastKey] = parsedValue;

      await configManager.saveGlobalConfig(config);
      logger.succeedSpinner(`Set ${key} = ${value}`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }

  private async addCatalog(
    url: string,
    options: { name?: string; token?: string; priority?: string }
  ): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');
      const config = await configManager.loadGlobalConfig();
      logger.updateSpinner('Adding catalog...');

      if (!config.resolvers.catalog) {
        config.resolvers.catalog = { sources: [] };
      }
      if (!config.resolvers.catalog.sources) {
        config.resolvers.catalog.sources = [];
      }

      // Check if already exists
      const existing = config.resolvers.catalog.sources.find((c) => c.url === url);
      if (existing) {
        const { confirm } = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: `Catalog ${url} already exists. Update it?`,
          initial: true,
        });

        if (!confirm) {
          return;
        }

        // Update existing
        existing.name = options.name || existing.name;
        existing.token = options.token || existing.token;
        existing.priority = options.priority ? parseInt(options.priority, 10) : existing.priority;
      } else {
        // Add new catalog
        config.resolvers.catalog.sources.push({
          url,
          name: options.name,
          token: options.token,
          priority: options.priority ? parseInt(options.priority, 10) : undefined,
        });
      }

      await configManager.saveGlobalConfig(config);
      logger.succeedSpinner(`Added catalog: ${options.name || url}`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      } else {
        logger.error(String(error));
      }
      process.exit(1);
    }
  }

  private async removeCatalog(url: string): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');
      const config = await configManager.loadGlobalConfig();
      logger.updateSpinner('Removing catalog...');

      if (!config.resolvers.catalog?.sources) {
        logger.stopSpinner();
        logger.warn('No catalogs configured');
        return;
      }

      const index = config.resolvers.catalog.sources.findIndex((c) => c.url === url);
      if (index === -1) {
        logger.stopSpinner();
        logger.warn(`Catalog not found: ${url}`);
        return;
      }

      const removed = config.resolvers.catalog.sources.splice(index, 1)[0];
      await configManager.saveGlobalConfig(config);
      logger.succeedSpinner(`Removed catalog: ${removed.name || removed.url}`);
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

  private async listCatalogs(): Promise<void> {
    try {
      logger.startSpinner('Loading configuration...');
      const config = await configManager.loadGlobalConfig();
      logger.stopSpinner();

      if (!config.resolvers.catalog?.sources || config.resolvers.catalog?.sources.length === 0) {
        logger.info('No catalogs configured');
        logger.info('');
        logger.info('Add a catalog with:');
        logger.info('  fractary forge config add-catalog <url>');
        return;
      }

      console.log(chalk.bold('Configured Catalogs:'));
      console.log();

      for (const catalog of config.resolvers.catalog.sources) {
        console.log(chalk.cyan(`• ${catalog.name || catalog.url}`));
        console.log(`  URL: ${catalog.url}`);
        if (catalog.token) {
          console.log(`  Token: ***${catalog.token.slice(-4)}`);
        }
        if (catalog.priority !== undefined) {
          console.log(`  Priority: ${catalog.priority}`);
        }
        console.log();
      }

      logger.info(`Total: ${config.resolvers.catalog.sources.length} catalog(s)`);
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
