/**
 * Configuration migration utility
 *
 * Converts legacy v2.x JSON config to v3.0 YAML format
 */
import { type CodexYamlConfig } from './config-types';
/**
 * Migration result
 */
export interface MigrationResult {
    success: boolean;
    yamlConfig: CodexYamlConfig;
    warnings: string[];
    backupPath?: string;
}
/**
 * Detect if a config file is legacy JSON format
 */
export declare function isLegacyConfig(configPath: string): Promise<boolean>;
/**
 * Migrate legacy JSON config to v3.0 YAML format
 */
export declare function migrateConfig(legacyConfigPath: string, options?: {
    createBackup?: boolean;
    backupSuffix?: string;
}): Promise<MigrationResult>;
/**
 * Write YAML config to file
 */
export declare function writeYamlConfig(config: CodexYamlConfig, outputPath: string): Promise<void>;
/**
 * Get default YAML config
 */
export declare function getDefaultYamlConfig(organization: string): CodexYamlConfig;
/**
 * Read YAML config from file
 */
export declare function readYamlConfig(configPath: string): Promise<CodexYamlConfig>;
//# sourceMappingURL=migrate-config.d.ts.map