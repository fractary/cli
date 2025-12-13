"use strict";
/**
 * Codex tool - Centralized knowledge management and distribution (v3.0)
 *
 * Pull-based document retrieval with codex:// URI scheme and intelligent caching.
 * Exports the codex command for the unified Fractary CLI.
 *
 * @see SPEC-00024 - Codex SDK v3.0 Architecture
 * @see SPEC-00025 - Codex MCP Server Integration
 * @see SPEC-00026 - CLI Alignment with SDK v3.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCodexCommand = createCodexCommand;
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const fetch_1 = require("./commands/fetch");
const cache_1 = require("./commands/cache");
const sync_1 = require("./commands/sync");
const types_1 = require("./commands/types");
const health_1 = require("./commands/health");
const migrate_1 = require("./commands/migrate");
/**
 * Create and configure the codex command
 */
function createCodexCommand() {
    const codex = new commander_1.Command('codex');
    codex
        .description('Centralized knowledge management and distribution')
        .version('3.0.0');
    // Core commands (v3.0)
    codex.addCommand((0, init_1.initCommand)()); // Initialize codex configuration
    codex.addCommand((0, fetch_1.fetchCommand)()); // Fetch documents by codex:// URI
    codex.addCommand((0, cache_1.cacheCommand)()); // Cache management (list, clear, stats)
    codex.addCommand((0, sync_1.syncCommand)()); // Bidirectional sync (project, org)
    codex.addCommand((0, types_1.typesCommand)()); // Type registry (list, show, add, remove)
    codex.addCommand((0, health_1.healthCommand)()); // Diagnostics and auto-repair
    codex.addCommand((0, migrate_1.migrateCommand)()); // v2.0 to v3.0 migration
    return codex;
}
//# sourceMappingURL=index.js.map