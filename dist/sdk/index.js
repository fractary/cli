"use strict";
/**
 * SDK Integration Layer
 *
 * Provides unified access to @fractary/faber SDK with lazy loading and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWithDefaults = exports.getDefaultWorkflowConfig = exports.loadFaberConfig = exports.loadStateConfig = exports.loadLogConfig = exports.loadSpecConfig = exports.loadRepoConfig = exports.loadWorkConfig = exports.SDKNotAvailableError = exports.isFaberAvailable = exports.clearInstances = exports.getWorkflow = exports.getStateManager = exports.getLogManager = exports.getSpecManager = exports.getRepoManager = exports.getWorkManager = void 0;
// Factory functions
var factory_1 = require("./factory");
Object.defineProperty(exports, "getWorkManager", { enumerable: true, get: function () { return factory_1.getWorkManager; } });
Object.defineProperty(exports, "getRepoManager", { enumerable: true, get: function () { return factory_1.getRepoManager; } });
Object.defineProperty(exports, "getSpecManager", { enumerable: true, get: function () { return factory_1.getSpecManager; } });
Object.defineProperty(exports, "getLogManager", { enumerable: true, get: function () { return factory_1.getLogManager; } });
Object.defineProperty(exports, "getStateManager", { enumerable: true, get: function () { return factory_1.getStateManager; } });
Object.defineProperty(exports, "getWorkflow", { enumerable: true, get: function () { return factory_1.getWorkflow; } });
Object.defineProperty(exports, "clearInstances", { enumerable: true, get: function () { return factory_1.clearInstances; } });
Object.defineProperty(exports, "isFaberAvailable", { enumerable: true, get: function () { return factory_1.isFaberAvailable; } });
Object.defineProperty(exports, "SDKNotAvailableError", { enumerable: true, get: function () { return factory_1.SDKNotAvailableError; } });
// Config loaders
Object.defineProperty(exports, "loadWorkConfig", { enumerable: true, get: function () { return factory_1.loadWorkConfig; } });
Object.defineProperty(exports, "loadRepoConfig", { enumerable: true, get: function () { return factory_1.loadRepoConfig; } });
Object.defineProperty(exports, "loadSpecConfig", { enumerable: true, get: function () { return factory_1.loadSpecConfig; } });
Object.defineProperty(exports, "loadLogConfig", { enumerable: true, get: function () { return factory_1.loadLogConfig; } });
Object.defineProperty(exports, "loadStateConfig", { enumerable: true, get: function () { return factory_1.loadStateConfig; } });
Object.defineProperty(exports, "loadFaberConfig", { enumerable: true, get: function () { return factory_1.loadFaberConfig; } });
Object.defineProperty(exports, "getDefaultWorkflowConfig", { enumerable: true, get: function () { return factory_1.getDefaultWorkflowConfig; } });
Object.defineProperty(exports, "mergeWithDefaults", { enumerable: true, get: function () { return factory_1.mergeWithDefaults; } });
// Note: Type re-exports are removed to prevent loading @fractary/faber at module load time.
// If you need SDK types, import them directly from '@fractary/faber' where needed.
//# sourceMappingURL=index.js.map