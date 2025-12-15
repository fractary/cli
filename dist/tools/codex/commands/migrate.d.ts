/**
 * Migrate command (v3.0)
 *
 * Migrates legacy v2.x JSON configurations to v3.0 YAML format:
 * - Detects legacy config at .fractary/plugins/codex/config.json
 * - Creates backup of old config
 * - Transforms to v3.0 YAML format
 * - Writes to .fractary/codex.yaml
 * - Validates migration result
 */
import { Command } from 'commander';
export declare function migrateCommand(): Command;
//# sourceMappingURL=migrate.d.ts.map