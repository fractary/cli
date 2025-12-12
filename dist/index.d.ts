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
export * from './sdk';
//# sourceMappingURL=index.d.ts.map