/**
 * Output Formatting Utilities for Forge CLI
 *
 * Provides consistent formatting for agent and tool information
 */
import type { AgentInfo, ToolInfo } from '@fractary/forge';
/**
 * Format agent information for display
 */
export declare function formatAgentInfo(info: AgentInfo, options?: {
    showTools?: boolean;
    showPrompt?: boolean;
}): string;
/**
 * Format tool information for display
 */
export declare function formatToolInfo(info: ToolInfo): string;
/**
 * Format agent list as table
 */
export declare function formatAgentList(agents: AgentInfo[]): string;
/**
 * Format tool list as table
 */
export declare function formatToolList(tools: ToolInfo[]): string;
/**
 * Format validation errors
 */
export declare function formatValidationErrors(errors: any[]): string;
//# sourceMappingURL=output-formatter.d.ts.map