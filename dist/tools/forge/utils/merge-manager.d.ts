/**
 * Merge Manager Utility
 *
 * Manage component merge operations with different strategies.
 */
/**
 * Merge options
 */
export interface MergeOptions {
    strategy: 'auto' | 'local' | 'upstream' | 'manual';
    backup?: boolean;
    dryRun?: boolean;
    force?: boolean;
    verbose?: boolean;
}
/**
 * Merge result
 */
export interface MergeResult {
    base: string;
    source: string;
    strategy: string;
    success: boolean;
    conflicts?: ConflictInfo[];
    changes: {
        files_modified: number;
        files_added: number;
        files_removed: number;
        metadata_updated: boolean;
    };
    timestamp: string;
    backupPath?: string;
}
/**
 * Conflict information
 */
export interface ConflictInfo {
    file: string;
    type: 'content' | 'metadata' | 'structure';
    base_value: unknown;
    source_value: unknown;
    resolution?: unknown;
}
/**
 * Component metadata
 */
export interface ComponentMetadata {
    name?: string;
    type?: string;
    version?: string;
    description?: string;
    updated_at?: string;
    [key: string]: unknown;
}
/**
 * Create backup of component
 */
export declare function createBackup(componentPath: string): Promise<string>;
/**
 * Detect conflicts between components
 */
export declare function detectConflicts(base: ComponentMetadata, source: ComponentMetadata): Promise<ConflictInfo[]>;
/**
 * Perform merge operation
 */
export declare function mergeComponents(basePath: string, sourcePath: string, options: MergeOptions): Promise<MergeResult>;
//# sourceMappingURL=merge-manager.d.ts.map