import { Command } from 'commander';
import { BaseCommand } from './base';
export declare class RemoveCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
    private showRemovalPlan;
    private getCleanupAction;
    private confirmRemoval;
    private cleanDeployedFiles;
    private cleanPattern;
}
//# sourceMappingURL=remove.d.ts.map