import { Command } from 'commander';
import { BaseCommand } from './base';
export interface SearchOptions {
    type?: 'bundle' | 'starter' | 'all';
    json?: boolean;
    limit?: number;
}
export declare class SearchCommand extends BaseCommand {
    register(program: Command): Command;
    private execute;
}
//# sourceMappingURL=search.d.ts.map