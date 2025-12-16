/**
 * Lockfile Manager
 *
 * Manages `.fractary/plugins/forge/lock.json` files for tracking
 * exact versions and checksums of installed components.
 *
 * Enables reproducible installations across machines and CI/CD.
 */
type ComponentType = 'agent' | 'tool' | 'workflow' | 'template' | 'plugin';
interface LocalComponent {
    name: string;
    type: ComponentType;
    version?: string;
    source: string;
    path?: string;
    plugin?: string;
    isProject?: boolean;
}
/**
 * Single locked component entry
 */
export interface LockEntry {
    name: string;
    version: string;
    checksum?: string;
    installed_path: string;
    plugin?: string;
    installed_at: string;
}
/**
 * Complete lockfile structure
 */
export interface LockFile {
    version: string;
    timestamp: string;
    created_by: string;
    lockfile_version: string;
    locked: {
        agents: LockEntry[];
        tools: LockEntry[];
        workflows: LockEntry[];
        templates: LockEntry[];
    };
}
/**
 * Get path to local lockfile
 */
export declare function getLocalLockfilePath(cwd?: string): Promise<string>;
/**
 * Get path to global lockfile
 */
export declare function getGlobalLockfilePath(): string;
/**
 * Generate lockfile from current installed components
 */
export declare function generateLockfile(cwd?: string, options?: {
    update?: boolean;
}): Promise<LockFile>;
/**
 * Load lockfile from disk
 */
export declare function loadLockfile(lockfilePath: string): Promise<LockFile | null>;
/**
 * Save lockfile to disk
 */
export declare function saveLockfile(lockFile: LockFile, lockfilePath: string): Promise<void>;
/**
 * Validate lockfile structure
 */
export declare function validateLockfileStructure(data: unknown): data is LockFile;
/**
 * Get summary of locked components
 */
export declare function summarizeLockfile(lock: LockFile): {
    totalComponents: number;
    agents: number;
    tools: number;
    workflows: number;
    templates: number;
};
/**
 * Check if component is in lockfile
 */
export declare function isComponentLocked(lock: LockFile, name: string, type: ComponentType): boolean;
/**
 * Find locked entry by name and type
 */
export declare function findLockedEntry(lock: LockFile, name: string, type: ComponentType): LockEntry | undefined;
/**
 * Merge component into lockfile
 */
export declare function mergeLockEntry(lock: LockFile, component: LocalComponent): LockFile;
/**
 * Remove component from lockfile
 */
export declare function removeLockEntry(lock: LockFile, name: string, type: ComponentType): LockFile;
export {};
//# sourceMappingURL=lockfile-manager.d.ts.map