import { Command } from 'commander';
import { BaseCommand } from './base';
export declare class StatusCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
    private generateStatus;
    private checkBundleStatus;
    private countFiles;
    private performHealthChecks;
    private displayStatus;
}
//# sourceMappingURL=status.d.ts.map