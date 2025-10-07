import { Command } from 'commander';
import { BaseCommand } from './base';
export declare class DiffCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
    private calculateDiffs;
    private getBundleFiles;
    private calculateChecksum;
    private outputSummary;
    private outputDetailed;
    private outputJson;
}
//# sourceMappingURL=diff.d.ts.map