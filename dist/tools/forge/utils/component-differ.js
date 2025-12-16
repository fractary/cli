"use strict";
/**
 * Component Differ Utility
 *
 * Compare two components and detect differences and conflicts.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareMetadata = compareMetadata;
exports.compareFiles = compareFiles;
exports.findConflicts = findConflicts;
exports.generateDiffReport = generateDiffReport;
exports.compareComponentStructure = compareComponentStructure;
exports.getConflictType = getConflictType;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Compare metadata objects
 */
function compareMetadata(base, source) {
    const differences = [];
    // Get all unique keys
    const allKeys = new Set([...Object.keys(base), ...Object.keys(source)]);
    for (const key of allKeys) {
        const baseValue = base[key];
        const sourceValue = source[key];
        if (JSON.stringify(baseValue) !== JSON.stringify(sourceValue)) {
            if (key in base && key in source) {
                // Modified
                differences.push({
                    field: key,
                    base: baseValue,
                    source: sourceValue,
                    type: 'modified',
                });
            }
            else if (key in source && !(key in base)) {
                // Added in source
                differences.push({
                    field: key,
                    base: undefined,
                    source: sourceValue,
                    type: 'added',
                });
            }
            else if (key in base && !(key in source)) {
                // Removed in source
                differences.push({
                    field: key,
                    base: baseValue,
                    source: undefined,
                    type: 'removed',
                });
            }
        }
    }
    return differences;
}
/**
 * Compare files in two directories
 */
async function compareFiles(basePath, sourcePath) {
    const differences = [];
    try {
        const baseFiles = new Set();
        const sourceFiles = new Set();
        // List files in base directory
        try {
            const baseEntries = await fs_1.promises.readdir(basePath, { recursive: true });
            for (const entry of baseEntries) {
                const fullPath = path_1.default.join(basePath, entry);
                const stat = await fs_1.promises.stat(fullPath);
                if (stat.isFile()) {
                    baseFiles.add(entry);
                }
            }
        }
        catch (error) {
            // Base directory might not exist
        }
        // List files in source directory
        try {
            const sourceEntries = await fs_1.promises.readdir(sourcePath, { recursive: true });
            for (const entry of sourceEntries) {
                const fullPath = path_1.default.join(sourcePath, entry);
                const stat = await fs_1.promises.stat(fullPath);
                if (stat.isFile()) {
                    sourceFiles.add(entry);
                }
            }
        }
        catch (error) {
            // Source directory might not exist
        }
        // Get all unique files
        const allFiles = new Set([...baseFiles, ...sourceFiles]);
        for (const file of allFiles) {
            const baseFull = path_1.default.join(basePath, file);
            const sourceFull = path_1.default.join(sourcePath, file);
            try {
                const baseExists = baseFiles.has(file);
                const sourceExists = sourceFiles.has(file);
                if (baseExists && sourceExists) {
                    // Both exist, compare content
                    const baseHash = await getFileHash(baseFull);
                    const sourceHash = await getFileHash(sourceFull);
                    if (baseHash !== sourceHash) {
                        differences.push({
                            field: file,
                            base: baseHash,
                            source: sourceHash,
                            type: 'modified',
                        });
                    }
                }
                else if (sourceExists && !baseExists) {
                    // Added in source
                    differences.push({
                        field: file,
                        base: undefined,
                        source: await getFileHash(sourceFull),
                        type: 'added',
                    });
                }
                else if (baseExists && !sourceExists) {
                    // Removed in source
                    differences.push({
                        field: file,
                        base: await getFileHash(baseFull),
                        source: undefined,
                        type: 'removed',
                    });
                }
            }
            catch (error) {
                // Skip files that can't be compared
            }
        }
    }
    catch (error) {
        // Return empty array if comparison fails
    }
    return differences;
}
/**
 * Find conflicts in differences
 */
function findConflicts(diffs) {
    // Conflicts are considered:
    // 1. Modified files (both sides changed)
    // 2. Added files with same name (both added differently)
    // 3. Removed files (one side removed, other didn't)
    // 4. Modified metadata (excluding fork/source info)
    return diffs.filter((diff) => {
        // Always consider modified as potential conflict
        if (diff.type === 'modified') {
            return true;
        }
        // Added/removed can be conflicts in certain contexts
        if (diff.type === 'added' || diff.type === 'removed') {
            // Exclude certain fields that are expected to differ
            const excludeFields = ['fork', 'source', 'installed_at', 'updated_at'];
            return !excludeFields.some((field) => diff.field.includes(field));
        }
        return false;
    });
}
/**
 * Generate diff report
 */
function generateDiffReport(diffs) {
    if (diffs.length === 0) {
        return 'No differences found';
    }
    const lines = [];
    for (const diff of diffs) {
        const icon = diff.type === 'modified'
            ? '~'
            : diff.type === 'added'
                ? '+'
                : '-';
        lines.push(`${icon} ${diff.field}`);
        if (diff.type === 'modified') {
            lines.push(`  Base:   ${JSON.stringify(diff.base)}`);
            lines.push(`  Source: ${JSON.stringify(diff.source)}`);
        }
        else if (diff.type === 'added') {
            lines.push(`  Added: ${JSON.stringify(diff.source)}`);
        }
        else if (diff.type === 'removed') {
            lines.push(`  Removed: ${JSON.stringify(diff.base)}`);
        }
    }
    return lines.join('\n');
}
/**
 * Get file hash for comparison
 */
async function getFileHash(filePath) {
    try {
        const content = await fs_1.promises.readFile(filePath);
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    catch (error) {
        return 'error';
    }
}
/**
 * Compare component structures
 */
async function compareComponentStructure(basePath, sourcePath) {
    let baseMetadata = {};
    let sourceMetadata = {};
    // Try to load metadata files
    try {
        const baseMetaPath = path_1.default.join(basePath, 'metadata.json');
        const baseContent = await fs_1.promises.readFile(baseMetaPath, 'utf-8');
        baseMetadata = JSON.parse(baseContent);
    }
    catch (error) {
        // Ignore if metadata doesn't exist
    }
    try {
        const sourceMetaPath = path_1.default.join(sourcePath, 'metadata.json');
        const sourceContent = await fs_1.promises.readFile(sourceMetaPath, 'utf-8');
        sourceMetadata = JSON.parse(sourceContent);
    }
    catch (error) {
        // Ignore if metadata doesn't exist
    }
    // Compare metadata
    const metadataDiff = compareMetadata(baseMetadata, sourceMetadata);
    // Compare files
    const fileDiff = await compareFiles(basePath, sourcePath);
    // Find conflicts
    const conflicts = findConflicts([...metadataDiff, ...fileDiff]);
    return {
        metadata_diff: metadataDiff,
        file_diff: fileDiff,
        conflicts,
    };
}
/**
 * Detect specific conflict type
 */
function getConflictType(diff) {
    if (diff.field.includes('metadata') || diff.field.endsWith('.json')) {
        return 'metadata';
    }
    else if (diff.field === 'version' || diff.field === 'name') {
        return 'identity';
    }
    else {
        return 'content';
    }
}
//# sourceMappingURL=component-differ.js.map