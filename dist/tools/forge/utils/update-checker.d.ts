/**
 * Update Checker
 *
 * Checks for available updates of installed components and plugins.
 * Supports semantic versioning constraints and version comparison.
 */
import { type RegistryConfig } from '@fractary/forge';
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
 * Update availability information
 */
export interface UpdateInfo {
    name: string;
    current: string;
    latest: string;
    available: string[];
    constraint?: string;
    hasUpdate: boolean;
    updateType: 'major' | 'minor' | 'patch' | 'none';
}
/**
 * Check for updates for a single component
 */
export declare function checkComponentUpdate(name: string, currentVersion: string, type: ComponentType, constraint?: string, registries?: RegistryConfig[]): Promise<UpdateInfo>;
/**
 * Check for updates for multiple components
 */
export declare function checkAllComponentUpdates(components: LocalComponent[]): Promise<Record<string, UpdateInfo>>;
/**
 * Compare two semantic versions
 *
 * Returns:
 * - Positive if version1 > version2
 * - Negative if version1 < version2
 * - 0 if versions are equal
 */
export declare function compareVersions(version1: string, version2: string): number;
/**
 * Check if version satisfies constraint
 */
export declare function satisfiesConstraint(version: string, constraint: string): boolean;
/**
 * Get available versions matching constraint
 */
export declare function filterVersionsByConstraint(versions: string[], constraint: string): string[];
/**
 * Find latest version from list
 */
export declare function findLatestVersion(versions: string[]): string | null;
/**
 * Get update suggestions
 */
export declare function getUpdateSuggestions(updates: Record<string, UpdateInfo>, options?: {
    majorOnly?: boolean;
    includeUnstable?: boolean;
}): UpdateInfo[];
/**
 * Check if version is unstable (pre-release or build metadata)
 */
export declare function isUnstableVersion(version: string): boolean;
/**
 * Get version release notes URL (if available)
 */
export declare function getReleaseNotesUrl(name: string, version: string, registry?: RegistryConfig): string | null;
export {};
//# sourceMappingURL=update-checker.d.ts.map