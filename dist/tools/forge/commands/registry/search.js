"use strict";
/**
 * Forge Search Command
 *
 * Search for plugins and components in remote registries (Stockyard).
 * Supports filtering by type, pagination, and JSON output.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchCommand = createSearchCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const forge_config_1 = require("../../utils/forge-config");
const formatters_1 = require("../../utils/formatters");
/**
 * Create search command
 */
function createSearchCommand() {
    const cmd = new commander_1.Command('search');
    cmd
        .description('Search for plugins in remote registries')
        .argument('<query>', 'Search query')
        .option('-t, --type <type>', 'Filter by component type (agents, tools, workflows, templates)')
        .option('-p, --page <number>', 'Page number (default: 1)', '1')
        .option('-l, --limit <number>', 'Results per page (default: 20)', '20')
        .option('--json', 'Output as JSON')
        .option('-v, --verbose', 'Show detailed search information')
        .action(async (query, options) => {
        try {
            await searchCommand(query, options);
        }
        catch (error) {
            handleSearchError(error, query);
        }
    });
    return cmd;
}
/**
 * Search command implementation
 */
async function searchCommand(query, options) {
    // Load configuration
    const { config, configSource } = await (0, forge_config_1.loadForgeConfig)();
    if (options.verbose && !options.json) {
        console.log(chalk_1.default.dim(`Using ${configSource} configuration`));
        console.log(chalk_1.default.dim(`Searching registries: ${config.registries.map((r) => r.name).join(', ')}`));
        console.log();
    }
    // Validate component type if provided
    if (options.type) {
        validateComponentType(options.type);
    }
    // Parse pagination options
    const page = typeof options.page === 'string' ? parseInt(options.page, 10) : (options.page || 1);
    const limit = typeof options.limit === 'string' ? parseInt(options.limit, 10) : (options.limit || 20);
    if (page < 1 || limit < 1) {
        console.error(chalk_1.default.red('✗ Page and limit must be positive numbers'));
        process.exit(1);
    }
    // Perform search
    const results = await performSearch(query, {
        type: options.type,
        page,
        limit,
        registries: config.registries,
    });
    // Output results
    if (options.json) {
        outputJson(results);
    }
    else {
        (0, formatters_1.formatSearchResults)(results.results, {
            total: results.total,
            page: results.page,
            limit: results.limit,
        });
    }
    process.exit(0);
}
/**
 * Perform search across configured registries
 */
async function performSearch(query, options) {
    // TODO: Implement actual registry search in Phase 6
    // This will require:
    // 1. Call each configured registry's search endpoint
    // 2. Merge and deduplicate results
    // 3. Apply pagination
    // 4. Return sorted results
    // For Phase 1, we'll implement a simple manifest-based search
    // using the existing Registry SDK capabilities
    try {
        // Use manifest resolver to search
        const allResults = [];
        for (const registry of options.registries) {
            if (!registry.enabled)
                continue;
            try {
                // Fetch manifest from registry
                const manifest = await fetchManifest(registry.url);
                // Search manifest for matching entries
                const matches = searchManifest(manifest, query, options.type);
                allResults.push(...matches);
            }
            catch (error) {
                // Continue with other registries if one fails
                console.warn(chalk_1.default.dim(`Warning: Failed to search ${registry.name}: ${error.message}`));
            }
        }
        // Deduplicate by name (prefer higher version)
        const deduplicated = deduplicateResults(allResults);
        // Apply pagination
        const total = deduplicated.length;
        const startIndex = (options.page - 1) * options.limit;
        const endIndex = startIndex + options.limit;
        const paginated = deduplicated.slice(startIndex, endIndex);
        return {
            results: paginated,
            total,
            page: options.page,
            limit: options.limit,
        };
    }
    catch (error) {
        throw new Error(`Search failed: ${error.message}`);
    }
}
/**
 * Fetch manifest from registry URL
 */
async function fetchManifest(url) {
    // Use built-in fetch (Node 18+)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Search manifest for matching entries
 */
function searchManifest(manifest, query, type) {
    const results = [];
    const queryLower = query.toLowerCase();
    // Search through plugins
    if (manifest.plugins) {
        for (const plugin of manifest.plugins) {
            // Check if plugin name or description matches
            const nameMatches = plugin.name.toLowerCase().includes(queryLower);
            const descMatches = plugin.description?.toLowerCase().includes(queryLower);
            if (nameMatches || descMatches) {
                // If type filter is specified, check components
                if (type) {
                    const hasMatchingType = plugin.components?.[type]?.length > 0;
                    if (!hasMatchingType)
                        continue;
                }
                results.push({
                    name: plugin.name,
                    type: 'plugin',
                    version: plugin.version || 'unknown',
                    description: plugin.description || 'No description',
                    author: plugin.author,
                    downloads: plugin.downloads,
                });
            }
        }
    }
    return results;
}
/**
 * Deduplicate results, preferring higher versions
 */
function deduplicateResults(results) {
    const map = new Map();
    for (const result of results) {
        const existing = map.get(result.name);
        if (!existing) {
            map.set(result.name, result);
        }
        else {
            // Compare versions and keep the higher one
            // For simplicity, just keep the first one for now
            // TODO: Use semver comparison in Phase 2
        }
    }
    return Array.from(map.values());
}
/**
 * Validate component type
 */
function validateComponentType(type) {
    const validTypes = ['agent', 'tool', 'workflow', 'template', 'plugin'];
    if (!validTypes.includes(type)) {
        console.error(chalk_1.default.red(`✗ Invalid component type: ${type}`));
        console.error();
        console.error(chalk_1.default.yellow('Valid types:'));
        validTypes.forEach((t) => {
            console.error(chalk_1.default.yellow(`  • ${t}`));
        });
        process.exit(1);
    }
}
/**
 * Output search results as JSON
 */
function outputJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
/**
 * Handle search errors
 */
function handleSearchError(error, query) {
    const err = error;
    const hints = [];
    if (err.message.includes('network') || err.message.includes('ENOTFOUND')) {
        hints.push('Network error - check internet connection');
        hints.push('Verify registry URLs are accessible');
        hints.push('Check firewall/proxy settings');
    }
    else if (err.message.includes('HTTP 404')) {
        hints.push('Registry manifest not found');
        hints.push('Verify registry URL in configuration');
        hints.push('Run: fractary forge registry list');
    }
    else if (err.message.includes('HTTP 401') || err.message.includes('HTTP 403')) {
        hints.push('Authentication required or forbidden');
        hints.push('Check if registry requires authentication');
    }
    else if (err.message.includes('timeout')) {
        hints.push('Request timed out');
        hints.push('Try again later');
        hints.push('Check network connection');
    }
    else {
        hints.push(`Could not search for: ${query}`);
        hints.push('Try a different search query');
        hints.push('Check registry configuration: fractary forge registry list');
    }
    (0, formatters_1.formatError)(err, 'Search failed', hints.length > 0 ? hints : undefined);
    process.exit(1);
}
// Export for use in index
exports.default = createSearchCommand;
//# sourceMappingURL=search.js.map