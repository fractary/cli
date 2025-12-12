"use strict";
/**
 * @fractary/cli - Unified CLI for Fractary Tools
 *
 * This is the main entry point for programmatic access to CLI functionality.
 * External projects can import SDK factory functions and types from this package.
 *
 * @example
 * ```typescript
 * import {
 *   getWorkManager,
 *   getRepoManager,
 *   Issue,
 *   PullRequest,
 * } from '@fractary/cli';
 *
 * const work = await getWorkManager();
 * const issue = await work.createIssue({ title: 'New feature' });
 * ```
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Re-export SDK layer for programmatic access
__exportStar(require("./sdk"), exports);
//# sourceMappingURL=index.js.map