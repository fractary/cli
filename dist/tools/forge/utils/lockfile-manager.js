"use strict";
/**
 * Lockfile Manager
 *
 * Manages `.fractary/plugins/forge/lock.json` files for tracking
 * exact versions and checksums of installed components.
 *
 * Enables reproducible installations across machines and CI/CD.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalLockfilePath = getLocalLockfilePath;
exports.getGlobalLockfilePath = getGlobalLockfilePath;
exports.generateLockfile = generateLockfile;
exports.loadLockfile = loadLockfile;
exports.saveLockfile = saveLockfile;
exports.validateLockfileStructure = validateLockfileStructure;
exports.summarizeLockfile = summarizeLockfile;
exports.isComponentLocked = isComponentLocked;
exports.findLockedEntry = findLockedEntry;
exports.mergeLockEntry = mergeLockEntry;
exports.removeLockEntry = removeLockEntry;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const forge_1 = require("@fractary/forge");
const forge_config_1 = require("./forge-config");
/**
 * Get path to local lockfile
 */
async function getLocalLockfilePath(cwd = process.cwd()) {
    const forgeDir = await (0, forge_config_1.getForgeDir)(cwd);
    return path.join(forgeDir, 'lock.json');
}
/**
 * Get path to global lockfile
 */
function getGlobalLockfilePath() {
    const os = require('os');
    return path.join(os.homedir(), '.fractary', 'registry', 'lock.json');
}
/**
 * Create empty lockfile structure
 */
function createEmptyLockFile() {
    return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        created_by: 'fractary-cli',
        lockfile_version: '1.0.0',
        locked: {
            agents: [],
            tools: [],
            workflows: [],
            templates: [],
        },
    };
}
/**
 * Generate lockfile from current installed components
 */
async function generateLockfile(cwd = process.cwd(), options = {}) {
    const lockFile = createEmptyLockFile();
    // Define component types
    const types = ['agent', 'tool', 'workflow', 'template'];
    // Collect components from project registry
    try {
        for (const type of types) {
            const components = await forge_1.Registry.localResolver.listProject(type);
            for (const comp of components) {
                const entry = {
                    name: comp.name,
                    version: comp.version || 'unknown',
                    installed_path: comp.path || '',
                    plugin: comp.plugin,
                    installed_at: new Date().toISOString(),
                };
                // Add to appropriate section
                const plural = type === 'agent' ? 'agents' :
                    type === 'tool' ? 'tools' :
                        type === 'workflow' ? 'workflows' : 'templates';
                lockFile.locked[plural].push(entry);
            }
        }
    }
    catch (error) {
        // If listing fails, return empty lockfile
        console.warn(`Warning: Could not read components: ${error.message}`);
    }
    return lockFile;
}
/**
 * Load lockfile from disk
 */
async function loadLockfile(lockfilePath) {
    try {
        if (!await fs.pathExists(lockfilePath)) {
            return null;
        }
        const content = await fs.readJson(lockfilePath);
        return validateLockfileStructure(content) ? content : null;
    }
    catch (error) {
        console.warn(`Warning: Could not load lockfile: ${error.message}`);
        return null;
    }
}
/**
 * Save lockfile to disk
 */
async function saveLockfile(lockFile, lockfilePath) {
    // Ensure directory exists
    const dir = path.dirname(lockfilePath);
    await fs.ensureDir(dir);
    // Update timestamp
    lockFile.timestamp = new Date().toISOString();
    // Write file
    await fs.writeJson(lockfilePath, lockFile, { spaces: 2 });
}
/**
 * Validate lockfile structure
 */
function validateLockfileStructure(data) {
    if (!data || typeof data !== 'object')
        return false;
    const lock = data;
    // Check required fields
    if (typeof lock.version !== 'string')
        return false;
    if (typeof lock.timestamp !== 'string')
        return false;
    if (!lock.locked || typeof lock.locked !== 'object')
        return false;
    const locked = lock.locked;
    // Check component types
    for (const type of ['agents', 'tools', 'workflows', 'templates']) {
        if (!Array.isArray(locked[type]))
            return false;
    }
    return true;
}
/**
 * Get summary of locked components
 */
function summarizeLockfile(lock) {
    return {
        totalComponents: lock.locked.agents.length +
            lock.locked.tools.length +
            lock.locked.workflows.length +
            lock.locked.templates.length,
        agents: lock.locked.agents.length,
        tools: lock.locked.tools.length,
        workflows: lock.locked.workflows.length,
        templates: lock.locked.templates.length,
    };
}
/**
 * Check if component is in lockfile
 */
function isComponentLocked(lock, name, type) {
    const plural = type === 'agent' ? 'agents' :
        type === 'tool' ? 'tools' :
            type === 'workflow' ? 'workflows' : 'templates';
    return lock.locked[plural].some((entry) => entry.name === name);
}
/**
 * Find locked entry by name and type
 */
function findLockedEntry(lock, name, type) {
    const plural = type === 'agent' ? 'agents' :
        type === 'tool' ? 'tools' :
            type === 'workflow' ? 'workflows' : 'templates';
    return lock.locked[plural].find((entry) => entry.name === name);
}
/**
 * Merge component into lockfile
 */
function mergeLockEntry(lock, component) {
    const type = component.type;
    const plural = type === 'agent' ? 'agents' :
        type === 'tool' ? 'tools' :
            type === 'workflow' ? 'workflows' : 'templates';
    const entry = {
        name: component.name,
        version: component.version || 'unknown',
        installed_path: component.path || '',
        plugin: component.plugin,
        installed_at: new Date().toISOString(),
    };
    // Remove existing entry if present
    const list = lock.locked[plural];
    const index = list.findIndex((e) => e.name === component.name);
    if (index !== -1) {
        list.splice(index, 1);
    }
    // Add new entry
    list.push(entry);
    return lock;
}
/**
 * Remove component from lockfile
 */
function removeLockEntry(lock, name, type) {
    const plural = type === 'agent' ? 'agents' :
        type === 'tool' ? 'tools' :
            type === 'workflow' ? 'workflows' : 'templates';
    const list = lock.locked[plural];
    const index = list.findIndex((e) => e.name === name);
    if (index !== -1) {
        list.splice(index, 1);
    }
    return lock;
}
//# sourceMappingURL=lockfile-manager.js.map