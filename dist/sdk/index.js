"use strict";
/**
 * SDK Integration Layer
 *
 * Provides unified access to Fractary SDKs with lazy loading and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDKNotAvailableError = exports.isFaberAvailable = exports.clearInstances = exports.getWorkflow = exports.getStateManager = exports.getLogManager = exports.getSpecManager = exports.getRepoManager = exports.getWorkManager = void 0;
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
//# sourceMappingURL=index.js.map