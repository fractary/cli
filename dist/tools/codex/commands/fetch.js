"use strict";
/**
 * Fetch document command (v3.0)
 *
 * Retrieves documents by codex:// URI reference using SDK's CodexClient:
 * - Cache-first retrieval for fast access
 * - TTL-based cache invalidation
 * - Multiple storage provider support
 * - Automatic URI validation and resolution
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommand = fetchCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs/promises"));
const get_client_1 = require("../get-client");
const codex_1 = require("@fractary/codex");
/**
 * Calculate content hash
 */
function hashContent(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}
function fetchCommand() {
    const cmd = new commander_1.Command('fetch');
    cmd
        .description('Fetch a document by codex:// URI reference')
        .argument('<uri>', 'Codex URI (e.g., codex://org/project/docs/file.md)')
        .option('--bypass-cache', 'Skip cache and fetch directly from source')
        .option('--ttl <seconds>', 'Override default TTL (in seconds)', parseInt)
        .option('--json', 'Output as JSON with metadata')
        .option('--output <file>', 'Write content to file instead of stdout')
        .action(async (uri, options) => {
        try {
            // Validate URI format
            if (!(0, codex_1.validateUri)(uri)) {
                console.error(chalk_1.default.red('Error: Invalid URI format'));
                console.log(chalk_1.default.dim('Expected: codex://org/project/path/to/file.md'));
                console.log(chalk_1.default.dim('Example: codex://fractary/codex/docs/api.md'));
                process.exit(1);
            }
            // Get CodexClient instance
            const client = await (0, get_client_1.getClient)();
            // Show fetching message (unless JSON output)
            if (!options.json && !options.bypassCache) {
                console.error(chalk_1.default.dim(`Fetching ${uri}...`));
            }
            // Fetch using CodexClient
            const result = await client.fetch(uri, {
                bypassCache: options.bypassCache,
                ttl: options.ttl
            });
            // Output handling
            if (options.json) {
                const output = {
                    uri,
                    content: result.content.toString('utf-8'),
                    metadata: {
                        fromCache: result.fromCache,
                        fetchedAt: result.metadata?.fetchedAt,
                        expiresAt: result.metadata?.expiresAt,
                        contentLength: result.metadata?.contentLength || result.content.length,
                        contentHash: hashContent(result.content)
                    }
                };
                console.log(JSON.stringify(output, null, 2));
            }
            else if (options.output) {
                // Write to file
                await fs.writeFile(options.output, result.content);
                console.log(chalk_1.default.green('✓'), `Written to ${options.output}`);
                console.log(chalk_1.default.dim(`  Size: ${result.content.length} bytes`));
                if (result.fromCache) {
                    console.log(chalk_1.default.dim('  Source: cache'));
                }
                else {
                    console.log(chalk_1.default.dim('  Source: storage'));
                }
            }
            else {
                // Print to stdout
                if (result.fromCache && !options.bypassCache) {
                    console.error(chalk_1.default.green('✓'), chalk_1.default.dim('from cache\n'));
                }
                else {
                    console.error(chalk_1.default.green('✓'), chalk_1.default.dim('fetched\n'));
                }
                console.log(result.content.toString('utf-8'));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error.message);
            // Provide helpful error messages
            if (error.message.includes('Failed to load configuration')) {
                console.log(chalk_1.default.dim('\nRun "fractary codex init" to create a configuration.'));
            }
            else if (error.message.includes('GITHUB_TOKEN')) {
                console.log(chalk_1.default.dim('\nSet your GitHub token: export GITHUB_TOKEN="your_token"'));
            }
            else if (error.message.includes('not found') || error.message.includes('404')) {
                console.log(chalk_1.default.dim('\nThe document may not exist or you may not have access.'));
                console.log(chalk_1.default.dim('Check the URI and ensure your storage providers are configured correctly.'));
            }
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=fetch.js.map