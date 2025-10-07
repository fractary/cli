import { Command } from 'commander';
import { BaseCommand } from './base';
export declare class CreateCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
    private isValidProjectName;
    private copyStarter;
    private createMinimalStarter;
    private createManifest;
}
//# sourceMappingURL=create.d.ts.map