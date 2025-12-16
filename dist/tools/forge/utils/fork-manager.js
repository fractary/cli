"use strict";
/**
 * Fork Manager Utility
 *
 * Manage component forking operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateForkName = generateForkName;
exports.copyComponentDirectory = copyComponentDirectory;
exports.loadComponentMetadata = loadComponentMetadata;
exports.saveComponentMetadata = saveComponentMetadata;
exports.updateForkMetadata = updateForkMetadata;
exports.createFork = createFork;
exports.isValidForkName = isValidForkName;
exports.getForkLineage = getForkLineage;
exports.isFork = isFork;
exports.getForkInfo = getForkInfo;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
/**
 * Generate unique fork name
 */
async function generateForkName(originalName, basePath) {
    let counter = 1;
    let newName = `${originalName}-${counter}`;
    // Check if name already exists
    while (true) {
        const fullPath = path_1.default.join(basePath, newName);
        try {
            await fs_1.promises.stat(fullPath);
            // Path exists, increment counter
            counter++;
            newName = `${originalName}-${counter}`;
        }
        catch (error) {
            // Path doesn't exist, use this name
            break;
        }
    }
    return newName;
}
/**
 * Copy component directory recursively
 */
async function copyComponentDirectory(source, destination) {
    // Create destination directory
    await fs_1.promises.mkdir(destination, { recursive: true });
    // Read source directory
    const entries = await fs_1.promises.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
        }
        const sourcePath = path_1.default.join(source, entry.name);
        const destPath = path_1.default.join(destination, entry.name);
        if (entry.isDirectory()) {
            await copyComponentDirectory(sourcePath, destPath);
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
 * Update component metadata with fork information
 */
async function updateForkMetadata(componentPath, originalName, originalVersion, fromRegistry) {
    const metadata = await loadComponentMetadata(componentPath);
    metadata.fork = {
        created_at: new Date().toISOString(),
        from_registry: fromRegistry,
        from_name: originalName,
        from_version: originalVersion,
    };
    await saveComponentMetadata(componentPath, metadata);
}
/**
 * Create fork of a component
 */
async function createFork(sourcePath, sourceMetadata, options) {
    const basePath = options.destination || process.cwd();
    const forkName = options.name || (await generateForkName(sourceMetadata.name || 'fork', basePath));
    // Create destination path
    const destinationPath = path_1.default.join(basePath, forkName);
    // Copy component
    await copyComponentDirectory(sourcePath, destinationPath);
    // Update metadata
    if (options.updateMetadata || options.description) {
        const metadata = await loadComponentMetadata(destinationPath);
        // Update name
        metadata.name = forkName;
        // Update description if provided
        if (options.description) {
            metadata.description = options.description;
        }
        // Add fork tracking
        metadata.fork = {
            created_at: new Date().toISOString(),
            from_registry: sourceMetadata.source?.registry,
            from_name: sourceMetadata.name || 'unknown',
            from_version: sourceMetadata.version || 'unknown',
        };
        // Remove source information (this is now a local component)
        if (metadata.source) {
            delete metadata.source;
        }
        await saveComponentMetadata(destinationPath, metadata);
    }
    else {
        // Minimal metadata update - just add fork tracking
        await updateForkMetadata(destinationPath, sourceMetadata.name || 'unknown', sourceMetadata.version || 'unknown', sourceMetadata.source?.registry);
    }
    return {
        originalName: sourceMetadata.name || 'unknown',
        forkedName: forkName,
        location: destinationPath,
        timestamp: new Date().toISOString(),
        source: {
            registry: sourceMetadata.source?.registry,
            component: sourceMetadata.name || 'unknown',
            version: sourceMetadata.version || 'unknown',
        },
    };
}
/**
 * Validate fork name
 */
function isValidForkName(name) {
    // Same rules as registry name
    return /^[a-zA-Z0-9_-]+$/.test(name);
}
/**
 * Get fork lineage
 */
async function getForkLineage(componentPath) {
    const lineage = [];
    let current = await loadComponentMetadata(componentPath);
    lineage.push(current.name || 'unknown');
    // Trace back through forks
    while (current.fork) {
        lineage.unshift(current.fork.from_name);
        // Note: In a real implementation, we'd load the original component
        // For now, we just collect the names
        break;
    }
    return lineage;
}
/**
 * Check if component is a fork
 */
async function isFork(componentPath) {
    const metadata = await loadComponentMetadata(componentPath);
    return !!(metadata.fork && metadata.fork.from_name);
}
/**
 * Get fork information
 */
async function getForkInfo(componentPath) {
    const metadata = await loadComponentMetadata(componentPath);
    return metadata.fork || null;
}
//# sourceMappingURL=fork-manager.js.map