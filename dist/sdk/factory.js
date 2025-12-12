"use strict";
/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to SDK managers with proper error handling.
 *
 * Currently uses stub implementations until @fractary/faber v0.2.0 is available
 * with the new manager classes (WorkManager, RepoManager, etc.).
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
const stubs_1 = require("./stubs");
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
 * Load configuration from project .fractary directory
 */
async function loadConfig() {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const configPath = path.join(process.cwd(), '.fractary', 'faber', 'config.json');
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Get WorkManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { WorkManager, loadWorkConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadWorkConfig() ?? undefined;
 *   instances.work = new WorkManager(resolvedConfig);
 */
async function getWorkManager(config) {
    if (!instances.work) {
        const projectConfig = await loadConfig();
        const resolvedConfig = config ?? projectConfig?.work;
        instances.work = (0, stubs_1.createStubWorkManager)(resolvedConfig);
    }
    return instances.work;
}
/**
 * Get RepoManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available:
 *   const { RepoManager, loadRepoConfig } = await import('@fractary/faber');
 *   const resolvedConfig = config ?? loadRepoConfig() ?? undefined;
 *   instances.repo = new RepoManager(resolvedConfig);
 */
async function getRepoManager(config) {
    if (!instances.repo) {
        const projectConfig = await loadConfig();
        const resolvedConfig = config ?? projectConfig?.repo;
        instances.repo = (0, stubs_1.createStubRepoManager)(resolvedConfig);
    }
    return instances.repo;
}
/**
 * Get SpecManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
async function getSpecManager() {
    if (!instances.spec) {
        instances.spec = (0, stubs_1.createStubSpecManager)();
    }
    return instances.spec;
}
/**
 * Get LogManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
async function getLogManager() {
    if (!instances.logs) {
        instances.logs = (0, stubs_1.createStubLogManager)();
    }
    return instances.logs;
}
/**
 * Get StateManager instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
async function getStateManager() {
    if (!instances.state) {
        instances.state = (0, stubs_1.createStubStateManager)();
    }
    return instances.state;
}
/**
 * Get FaberWorkflow instance (lazy-loaded)
 *
 * TODO: Replace stub with actual SDK import once @fractary/faber v0.2.0 is available
 */
async function getWorkflow() {
    if (!instances.workflow) {
        instances.workflow = (0, stubs_1.createStubWorkflow)();
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
//# sourceMappingURL=factory.js.map