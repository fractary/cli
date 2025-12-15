/**
 * Sync org command (v3.0)
 *
 * Synchronizes all projects in an organization with the codex repository using SDK SyncManager:
 * - Discovers repositories via GitHub CLI
 * - Parallel sync execution
 * - Pattern-based filtering and exclusion
 * - Dry-run mode
 * - Per-repo error handling
 */
import { Command } from 'commander';
export declare function syncOrgCommand(): Command;
//# sourceMappingURL=org.d.ts.map