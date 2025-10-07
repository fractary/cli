import { Command } from 'commander';
import { BaseCommand } from './base';
export declare class ValidateCommand extends BaseCommand {
    private ajv;
    constructor();
    register(program: Command): Command;
    private execute;
    private validateManifest;
    private loadSchema;
    private autoFix;
    private isValidProjectName;
    private isValidVersion;
    private reportResults;
}
//# sourceMappingURL=validate.d.ts.map