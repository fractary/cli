/**
 * Faber tool - FABER Development Toolkit
 *
 * Provides workflow orchestration, work tracking, repository operations,
 * specification management, and log management through the @fractary/faber SDK.
 *
 * Command structure:
 * - faber init              Initialize FABER configuration
 * - faber run               Run FABER workflow
 * - faber status            Show workflow status
 * - faber resume            Resume a paused workflow
 * - faber pause             Pause a running workflow
 * - faber recover           Recover a workflow from checkpoint
 * - faber cleanup           Clean up old workflow states
 * - faber work              Work item tracking (issue, comment, label, milestone)
 * - faber repo              Repository operations (branch, commit, pr, tag, worktree)
 * - faber spec              Specification management
 * - faber logs              Log management
 */
import { Command } from 'commander';
/**
 * Create and configure the faber command
 */
export declare function createFaberCommand(): Command;
//# sourceMappingURL=index.d.ts.map