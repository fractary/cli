/**
 * Component Differ Utility
 *
 * Compare two components and detect differences and conflicts.
 */
/**
 * Difference between components
 */
export interface Difference {
    field: string;
    base: unknown;
    source: unknown;
    type: 'added' | 'removed' | 'modified';
}
/**
 * Component metadata for comparison
 */
export interface ComponentMetadata {
    name?: string;
    type?: string;
    version?: string;
    description?: string;
    author?: string;
    source?: Record<string, unknown>;
    fork?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * Compare metadata objects
 */
export declare function compareMetadata(base: ComponentMetadata, source: ComponentMetadata): Difference[];
/**
 * Compare files in two directories
 */
export declare function compareFiles(basePath: string, sourcePath: string): Promise<Difference[]>;
/**
 * Find conflicts in differences
 */
export declare function findConflicts(diffs: Difference[]): Difference[];
/**
 * Generate diff report
 */
export declare function generateDiffReport(diffs: Difference[]): string;
/**
 * Compare component structures
 */
export declare function compareComponentStructure(basePath: string, sourcePath: string): Promise<{
    metadata_diff: Difference[];
    file_diff: Difference[];
    conflicts: Difference[];
}>;
/**
 * Detect specific conflict type
 */
export declare function getConflictType(diff: Difference): string;
//# sourceMappingURL=component-differ.d.ts.map