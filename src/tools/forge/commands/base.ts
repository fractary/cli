import { Command } from 'commander';

export abstract class BaseCommand {
  constructor() {
    // Commands can load config as needed
  }

  abstract register(program: Command): Command;
}
