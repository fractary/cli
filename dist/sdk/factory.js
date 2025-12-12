"use strict";
/**
 * SDK Factory - Provides lazy-loaded SDK client instances
 *
 * This module implements the factory pattern for SDK integration,
 * providing centralized access to @fractary/faber SDK managers.
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
exports.mergeWithDefaults = exports.getDefaultWorkflowConfig = exports.loadFaberConfig = exports.loadStateConfig = exports.loadLogConfig = exports.loadSpecConfig = exports.loadRepoConfig = exports.loadWorkConfig = exports.SDKNotAvailableError = void 0;
exports.getWorkManager = getWorkManager;
exports.getRepoManager = getRepoManager;
exports.getSpecManager = getSpecManager;
exports.getLogManager = getLogManager;
exports.getStateManager = getStateManager;
exports.getWorkflow = getWorkflow;
exports.clearInstances = clearInstances;
exports.isFaberAvailable = isFaberAvailable;
const faber_1 = require("@fractary/faber");
Object.defineProperty(exports, "loadWorkConfig", { enumerable: true, get: function () { return faber_1.loadWorkConfig; } });
Object.defineProperty(exports, "loadRepoConfig", { enumerable: true, get: function () { return faber_1.loadRepoConfig; } });
Object.defineProperty(exports, "loadSpecConfig", { enumerable: true, get: function () { return faber_1.loadSpecConfig; } });
Object.defineProperty(exports, "loadLogConfig", { enumerable: true, get: function () { return faber_1.loadLogConfig; } });
Object.defineProperty(exports, "loadStateConfig", { enumerable: true, get: function () { return faber_1.loadStateConfig; } });
Object.defineProperty(exports, "loadFaberConfig", { enumerable: true, get: function () { return faber_1.loadFaberConfig; } });
Object.defineProperty(exports, "getDefaultWorkflowConfig", { enumerable: true, get: function () { return faber_1.getDefaultWorkflowConfig; } });
Object.defineProperty(exports, "mergeWithDefaults", { enumerable: true, get: function () { return faber_1.mergeWithDefaults; } });
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
 * Get WorkManager instance (lazy-loaded)
 */
async function getWorkManager(config) {
    if (!instances.work) {
        try {
            const resolvedConfig = config ?? (0, faber_1.loadWorkConfig)() ?? undefined;
            instances.work = new faber_1.WorkManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.work;
}
/**
 * Get RepoManager instance (lazy-loaded)
 */
async function getRepoManager(config) {
    if (!instances.repo) {
        try {
            const resolvedConfig = config ?? (0, faber_1.loadRepoConfig)() ?? undefined;
            instances.repo = new faber_1.RepoManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.repo;
}
/**
 * Get SpecManager instance (lazy-loaded)
 */
async function getSpecManager(config) {
    if (!instances.spec) {
        try {
            const resolvedConfig = config ?? (0, faber_1.loadSpecConfig)();
            instances.spec = new faber_1.SpecManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.spec;
}
/**
 * Get LogManager instance (lazy-loaded)
 */
async function getLogManager(config) {
    if (!instances.logs) {
        try {
            const resolvedConfig = config ?? (0, faber_1.loadLogConfig)();
            instances.logs = new faber_1.LogManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.logs;
}
/**
 * Get StateManager instance (lazy-loaded)
 */
async function getStateManager(config) {
    if (!instances.state) {
        try {
            const resolvedConfig = config ?? (0, faber_1.loadStateConfig)();
            instances.state = new faber_1.StateManager(resolvedConfig);
        }
        catch (error) {
            throw new SDKNotAvailableError('faber', error instanceof Error ? error : undefined);
        }
    }
    return instances.state;
}
/**
 * Get FaberWorkflow instance (lazy-loaded)
 */
async function getWorkflow(config) {
    if (!instances.workflow) {
        try {
            const faberConfig = (0, faber_1.loadFaberConfig)();
            const workflowConfig = config
                ? (0, faber_1.mergeWithDefaults)(config)
                : faberConfig?.workflow ?? (0, faber_1.getDefaultWorkflowConfig)();
            instances.workflow = new faber_1.FaberWorkflow({ config: workflowConfig });
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
//# sourceMappingURL=factory.js.map