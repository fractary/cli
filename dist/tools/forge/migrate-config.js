"use strict";
/**
 * Forge Configuration Migration and I/O
 *
 * Handles reading/writing YAML configuration files
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
exports.getDefaultYamlConfig = void 0;
exports.readYamlConfig = readYamlConfig;
exports.writeYamlConfig = writeYamlConfig;
exports.configExists = configExists;
exports.createDefaultConfig = createDefaultConfig;
const fs = __importStar(require("fs/promises"));
const yaml = __importStar(require("js-yaml"));
const config_types_1 = require("./config-types");
Object.defineProperty(exports, "getDefaultYamlConfig", { enumerable: true, get: function () { return config_types_1.getDefaultYamlConfig; } });
/**
 * Read YAML configuration file
 */
async function readYamlConfig(configPath) {
    try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = yaml.load(content);
        // Resolve environment variables
        const resolved = (0, config_types_1.resolveEnvVarsInConfig)(config);
        return resolved;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Configuration file not found: ${configPath}`);
        }
        throw new Error(`Failed to read configuration: ${error.message}`);
    }
}
/**
 * Write YAML configuration file
 */
async function writeYamlConfig(configPath, config) {
    try {
        const content = yaml.dump(config, {
            indent: 2,
            lineWidth: 100,
            noRefs: true,
        });
        await fs.writeFile(configPath, content, 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to write configuration: ${error.message}`);
    }
}
/**
 * Check if configuration file exists
 */
async function configExists(configPath) {
    try {
        await fs.access(configPath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Create default configuration
 */
async function createDefaultConfig(configPath, organization) {
    const config = (0, config_types_1.getDefaultYamlConfig)(organization);
    await writeYamlConfig(configPath, config);
    return config;
}
//# sourceMappingURL=migrate-config.js.map