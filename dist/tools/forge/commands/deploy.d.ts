import { Command } from 'commander';
import { BaseCommand } from './base';
interface DeployOptions {
    force?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
}
export declare class DeployCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
    executeInProject(projectPath: string, options?: DeployOptions): Promise<void>;
    private deployBundle;
    private getBundleFiles;
    private getOwnershipRule;
    private applyFile;
    private mergeFile;
    private mergeJson;
    private calculateChecksum;
    private reportResults;
}
export {};
//# sourceMappingURL=deploy.d.ts.map