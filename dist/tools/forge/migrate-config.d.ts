/**
 * Forge Configuration Migration and I/O
 *
 * Handles reading/writing YAML configuration files
 */
import type { ForgeYamlConfig } from './config-types';
import { getDefaultYamlConfig } from './config-types';
/**
 * Read YAML configuration file
 */
export declare function readYamlConfig(configPath: string): Promise<ForgeYamlConfig>;
/**
 * Write YAML configuration file
 */
export declare function writeYamlConfig(configPath: string, config: ForgeYamlConfig): Promise<void>;
/**
 * Check if configuration file exists
 */
export declare function configExists(configPath: string): Promise<boolean>;
/**
 * Create default configuration
 */
export declare function createDefaultConfig(configPath: string, organization: string): Promise<ForgeYamlConfig>;
export { getDefaultYamlConfig };
//# sourceMappingURL=migrate-config.d.ts.map