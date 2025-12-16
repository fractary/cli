/**
 * Fork Manager Utility
 *
 * Manage component forking operations.
 */
/**
 * Fork options
 */
export interface ForkOptions {
    destination?: string;
    name?: string;
    description?: string;
    updateMetadata?: boolean;
    withGit?: boolean;
    verbose?: boolean;
}
/**
 * Fork result
 */
export interface ForkResult {
    originalName: string;
    forkedName: string;
    location: string;
    timestamp: string;
    source: {
        registry?: string;
        component: string;
        version: string;
    };
}
/**
 * Component location
 */
export interface ComponentLocation {
    path: string;
    source: 'installed' | 'registry';
    name: string;
    version?: string;
}
/**
 * Component metadata for fork tracking
 */
export interface ComponentMetadata {
    name?: string;
    type?: string;
    version?: string;
    description?: string;
    author?: string;
    source?: {
        registry?: string;
        component?: string;
        version?: string;
    };
    fork?: {
        created_at: string;
        from_registry?: string;
        from_name: string;
        from_version: string;
    };
    [key: string]: unknown;
}
/**
 * Generate unique fork name
 */
export declare function generateForkName(originalName: string, basePath: string): Promise<string>;
/**
 * Copy component directory recursively
 */
export declare function copyComponentDirectory(source: string, destination: string): Promise<void>;
/**
 * Load component metadata
 */
export declare function loadComponentMetadata(componentPath: string): Promise<ComponentMetadata>;
/**
 * Save component metadata
 */
export declare function saveComponentMetadata(componentPath: string, metadata: ComponentMetadata): Promise<void>;
/**
 * Update component metadata with fork information
 */
export declare function updateForkMetadata(componentPath: string, originalName: string, originalVersion: string, fromRegistry?: string): Promise<void>;
/**
 * Create fork of a component
 */
export declare function createFork(sourcePath: string, sourceMetadata: ComponentMetadata, options: ForkOptions): Promise<ForkResult>;
/**
 * Validate fork name
 */
export declare function isValidForkName(name: string): boolean;
/**
 * Get fork lineage
 */
export declare function getForkLineage(componentPath: string): Promise<string[]>;
/**
 * Check if component is a fork
 */
export declare function isFork(componentPath: string): Promise<boolean>;
/**
 * Get fork information
 */
export declare function getForkInfo(componentPath: string): Promise<ComponentMetadata['fork'] | null>;
//# sourceMappingURL=fork-manager.d.ts.map