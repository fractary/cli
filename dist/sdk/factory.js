"use strict";
/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
 *
 * IMPORTANT: Uses dynamic imports to avoid loading @fractary/faber at module load time.
 * This prevents CLI hangs when running simple commands like --help.
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
exports.SDKNotAvailableError = void 0;
exports.getWorkManager = getWorkManager;
exports.getRepoManager = getRepoManager;
exports.getSpecManager = getSpecManager;
exports.getLogManager = getLogManager;
exports.getStateManager = getStateManager;
exports.getWorkflow = getWorkflow;
exports.clearInstances = clearInstances;
exports.isFaberAvailable = isFaberAvailable;
exports.loadWorkConfig = loadWorkConfig;
exports.loadRepoConfig = loadRepoConfig;
exports.loadSpecConfig = loadSpecConfig;
exports.loadLogConfig = loadLogConfig;
exports.loadStateConfig = loadStateConfig;
exports.loadFaberConfig = loadFaberConfig;
exports.getDefaultWorkflowConfig = getDefaultWorkflowConfig;
exports.mergeWithDefaults = mergeWithDefaults;
const instances = {};
/**
 * Error thrown when SDK is not available
 */
class SDKNotAvailableError extends Error {
    constructor(sdk, cause) {
        super(`${sdk} SDK is not available. Install with: npm install @fractary/${sdk}`);
        this.name = 'SDKNotAvailableError';
        this.sdk = sdk;
        this.cause = cause;
    }
}
exports.SDKNotAvailableError = SDKNotAvailableError;
/**
 * Get WorkManager instance (lazy-loaded with dynamic import)
 */
async function getWorkManager(config) {
    if (!instances.work) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const resolvedConfig = config ?? faber.loadWorkConfig() ?? undefined;
            instances.work = new faber.WorkManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.work;
}
/**
 * Get RepoManager instance (lazy-loaded with dynamic import)
 */
async function getRepoManager(config) {
    if (!instances.repo) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const resolvedConfig = config ?? faber.loadRepoConfig() ?? undefined;
            instances.repo = new faber.RepoManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.repo;
}
/**
 * Get SpecManager instance (lazy-loaded with dynamic import)
 */
async function getSpecManager(config) {
    if (!instances.spec) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const resolvedConfig = config ?? faber.loadSpecConfig();
            instances.spec = new faber.SpecManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.spec;
}
/**
 * Get LogManager instance (lazy-loaded with dynamic import)
 */
async function getLogManager(config) {
    if (!instances.logs) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const resolvedConfig = config ?? faber.loadLogConfig();
            instances.logs = new faber.LogManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.logs;
}
/**
 * Get StateManager instance (lazy-loaded with dynamic import)
 */
async function getStateManager(config) {
    if (!instances.state) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const resolvedConfig = config ?? faber.loadStateConfig();
            instances.state = new faber.StateManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.state;
}
/**
 * Get FaberWorkflow instance (lazy-loaded with dynamic import)
 */
async function getWorkflow(config) {
    if (!instances.workflow) {
        try {
            // Dynamic import to avoid loading SDK at module load time
            const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
            const faberConfig = faber.loadFaberConfig();
            const workflowConfig = config
                ? faber.mergeWithDefaults(config)
                : faberConfig?.workflow ?? faber.getDefaultWorkflowConfig();
            instances.workflow = new faber.FaberWorkflow({ config: workflowConfig });
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.workflow;
}
/**
 * Clear cached instances (useful for testing)
 */
function clearInstances() {
    instances.work = undefined;
    instances.repo = undefined;
    instances.spec = undefined;
    instances.logs = undefined;
    instances.state = undefined;
    instances.workflow = undefined;
}
/**
 * Check if faber SDK is available
 */
async function isFaberAvailable() {
    try {
        await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Load work configuration (dynamic import)
 */
async function loadWorkConfig() {
    try {
        const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
        return faber.loadWorkConfig();
    }
    catch {
        return null;
    }
}
/**
 * Load repo configuration (dynamic import)
 */
async function loadRepoConfig() {
    try {
        const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
        return faber.loadRepoConfig();
    }
    catch {
        return null;
    }
}
/**
 * Load spec configuration (dynamic import)
 */
async function loadSpecConfig() {
    const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
    return faber.loadSpecConfig();
}
/**
 * Load log configuration (dynamic import)
 */
async function loadLogConfig() {
    const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
    return faber.loadLogConfig();
}
/**
 * Load state configuration (dynamic import)
 */
async function loadStateConfig() {
    const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
    return faber.loadStateConfig();
}
/**
 * Load FABER configuration (dynamic import)
 */
async function loadFaberConfig() {
    try {
        const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
        return faber.loadFaberConfig();
    }
    catch {
        return null;
    }
}
/**
 * Get default workflow configuration (dynamic import)
 */
async function getDefaultWorkflowConfig() {
    const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
    return faber.getDefaultWorkflowConfig();
}
/**
 * Merge with defaults (dynamic import)
 */
async function mergeWithDefaults(config) {
    const faber = await Promise.resolve().then(() => __importStar(require('@fractary/faber')));
    return faber.mergeWithDefaults(config);
}
//# sourceMappingURL=factory.js.map