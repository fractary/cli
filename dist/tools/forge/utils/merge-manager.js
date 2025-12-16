"use strict";
/**
 * Merge Manager Utility
 *
 * Manage component merge operations with different strategies.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.detectConflicts = detectConflicts;
exports.mergeComponents = mergeComponents;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const component_differ_1 = require("./component-differ");
/**
 * Create backup of component
 */
async function createBackup(componentPath) {
    const backupDir = path_1.default.join(path_1.default.dirname(componentPath), '.backups');
    await fs_1.promises.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path_1.default.join(backupDir, `${path_1.default.basename(componentPath)}.${timestamp}`);
    await copyDirectory(componentPath, backupPath);
    return backupPath;
}
/**
 * Copy directory recursively
 */
async function copyDirectory(source, destination) {
    await fs_1.promises.mkdir(destination, { recursive: true });
    const entries = await fs_1.promises.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.backups') {
            continue;
        }
        const sourcePath = path_1.default.join(source, entry.name);
        const destPath = path_1.default.join(destination, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, destPath);
        }
        else {
            await fs_1.promises.copyFile(sourcePath, destPath);
        }
    }
}
/**
 * Load component metadata
 */
async function loadComponentMetadata(componentPath) {
    try {
        const metadataPath = path_1.default.join(componentPath, 'metadata.json');
        const content = await fs_1.promises.readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return {};
    }
}
/**
 * Save component metadata
 */
async function saveComponentMetadata(componentPath, metadata) {
    const metadataPath = path_1.default.join(componentPath, 'metadata.json');
    const content = JSON.stringify(metadata, null, 2);
    await fs_1.promises.writeFile(metadataPath, content, 'utf-8');
}
/**
 * Detect conflicts between components
 */
async function detectConflicts(base, source) {
    const diffs = (0, component_differ_1.compareMetadata)(base, source);
    const conflicts = [];
    for (const diff of diffs) {
        // Exclude expected differences
        const excludeFields = ['fork', 'updated_at', 'installed_at'];
        if (excludeFields.includes(diff.field)) {
            continue;
        }
        if (diff.type === 'modified') {
            conflicts.push({
                file: diff.field,
                type: 'metadata',
                base_value: diff.base,
                source_value: diff.source,
            });
        }
    }
    return conflicts;
}
/**
 * Auto merge strategy - use most recent
 */
async function mergeAuto(basePath, sourcePath, baseMetadata, sourceMetadata, dryRun) {
    const baseTime = new Date(baseMetadata.updated_at || 0).getTime();
    const sourceTime = new Date(sourceMetadata.updated_at || 0).getTime();
    const useSource = sourceTime > baseTime;
    const result = {
        base: basePath,
        source: sourcePath,
        strategy: 'auto',
        success: true,
        changes: {
            files_modified: 0,
            files_added: 0,
            files_removed: 0,
            metadata_updated: useSource,
        },
        timestamp: new Date().toISOString(),
    };
    if (!dryRun && useSource) {
        // Copy files from source to base
        const comparison = await (0, component_differ_1.compareComponentStructure)(basePath, sourcePath);
        result.changes.files_modified = comparison.file_diff.filter(d => d.type === 'modified').length;
        result.changes.files_added = comparison.file_diff.filter(d => d.type === 'added').length;
        result.changes.files_removed = comparison.file_diff.filter(d => d.type === 'removed').length;
        // Update metadata
        await saveComponentMetadata(basePath, sourceMetadata);
    }
    return result;
}
/**
 * Local merge strategy - keep base unchanged
 */
async function mergeLocal(basePath, sourcePath, baseMetadata, sourceMetadata, dryRun) {
    const result = {
        base: basePath,
        source: sourcePath,
        strategy: 'local',
        success: true,
        changes: {
            files_modified: 0,
            files_added: 0,
            files_removed: 0,
            metadata_updated: false,
        },
        timestamp: new Date().toISOString(),
    };
    // No changes needed for local strategy
    return result;
}
/**
 * Upstream merge strategy - use source completely
 */
async function mergeUpstream(basePath, sourcePath, baseMetadata, sourceMetadata, dryRun) {
    const comparison = await (0, component_differ_1.compareComponentStructure)(basePath, sourcePath);
    const result = {
        base: basePath,
        source: sourcePath,
        strategy: 'upstream',
        success: true,
        changes: {
            files_modified: comparison.file_diff.filter(d => d.type === 'modified').length,
            files_added: comparison.file_diff.filter(d => d.type === 'added').length,
            files_removed: comparison.file_diff.filter(d => d.type === 'removed').length,
            metadata_updated: true,
        },
        timestamp: new Date().toISOString(),
    };
    if (!dryRun) {
        // Remove base directory content
        const entries = await fs_1.promises.readdir(basePath);
        for (const entry of entries) {
            if (entry !== 'metadata.json') {
                const entryPath = path_1.default.join(basePath, entry);
                const stat = await fs_1.promises.stat(entryPath);
                if (stat.isDirectory()) {
                    await removeDirectory(entryPath);
                }
                else {
                    await fs_1.promises.unlink(entryPath);
                }
            }
        }
        // Copy all from source
        const sourceEntries = await fs_1.promises.readdir(sourcePath);
        for (const entry of sourceEntries) {
            const sourcePath2 = path_1.default.join(sourcePath, entry);
            const basePath2 = path_1.default.join(basePath, entry);
            const stat = await fs_1.promises.stat(sourcePath2);
            if (stat.isDirectory()) {
                await copyDirectory(sourcePath2, basePath2);
            }
            else {
                await fs_1.promises.copyFile(sourcePath2, basePath2);
            }
        }
        // Update metadata
        await saveComponentMetadata(basePath, sourceMetadata);
    }
    return result;
}
/**
 * Manual merge strategy - collect conflicts for interactive resolution
 */
async function mergeManual(basePath, sourcePath, baseMetadata, sourceMetadata, dryRun) {
    const comparison = await (0, component_differ_1.compareComponentStructure)(basePath, sourcePath);
    const conflicts = await detectConflicts(baseMetadata, sourceMetadata);
    const result = {
        base: basePath,
        source: sourcePath,
        strategy: 'manual',
        success: conflicts.length === 0,
        conflicts,
        changes: {
            files_modified: comparison.file_diff.filter(d => d.type === 'modified').length,
            files_added: comparison.file_diff.filter(d => d.type === 'added').length,
            files_removed: comparison.file_diff.filter(d => d.type === 'removed').length,
            metadata_updated: false,
        },
        timestamp: new Date().toISOString(),
    };
    // Manual merge doesn't auto-apply changes
    return result;
}
/**
 * Perform merge operation
 */
async function mergeComponents(basePath, sourcePath, options) {
    let backupPath;
    // Create backup if requested
    if (options.backup && !options.dryRun) {
        backupPath = await createBackup(basePath);
    }
    try {
        // Load metadata
        const baseMetadata = await loadComponentMetadata(basePath);
        const sourceMetadata = await loadComponentMetadata(sourcePath);
        // Perform merge based on strategy
        let result;
        switch (options.strategy) {
            case 'auto':
                result = await mergeAuto(basePath, sourcePath, baseMetadata, sourceMetadata, options.dryRun);
                break;
            case 'local':
                result = await mergeLocal(basePath, sourcePath, baseMetadata, sourceMetadata, options.dryRun);
                break;
            case 'upstream':
                result = await mergeUpstream(basePath, sourcePath, baseMetadata, sourceMetadata, options.dryRun);
                break;
            case 'manual':
                result = await mergeManual(basePath, sourcePath, baseMetadata, sourceMetadata, options.dryRun);
                break;
            default:
                throw new Error(`Unknown merge strategy: ${options.strategy}`);
        }
        if (backupPath) {
            result.backupPath = backupPath;
        }
        return result;
    }
    catch (error) {
        // Clean up backup on error
        if (backupPath && !options.dryRun) {
            try {
                await removeDirectory(backupPath);
            }
            catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
        throw error;
    }
}
/**
 * Remove directory recursively
 */
async function removeDirectory(dirPath) {
    const entries = await fs_1.promises.readdir(dirPath);
    for (const entry of entries) {
        const entryPath = path_1.default.join(dirPath, entry);
        const stat = await fs_1.promises.stat(entryPath);
        if (stat.isDirectory()) {
            await removeDirectory(entryPath);
        }
        else {
            await fs_1.promises.unlink(entryPath);
        }
    }
    await fs_1.promises.rmdir(dirPath);
}
//# sourceMappingURL=merge-manager.js.map