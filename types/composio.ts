/**
 * Composio Types
 * 
 * Type definitions for Composio toolkit configuration and connections.
 */

/**
 * Toolkit configuration for mcp.config.json
 */
export interface ComposioToolkitConfig {
    id: string;
    name: string;
    toolkit: string;  // e.g., "GITHUB", "GMAIL", "SLACK"
    description: string;
    authConfigId?: string;  // From Composio dashboard
    enabled?: boolean;
    allowedTools?: string[];  // Specific tools to fetch, empty = all
    icon?: string;
}

/**
 * Full configuration structure
 */
export interface ComposioConfig {
    $schema?: string;
    toolkits: ComposioToolkitConfig[];
}

/**
 * Connection status enum
 */
export type ConnectionStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "PENDING"
    | "INITIATED"
    | "EXPIRED"
    | "FAILED";

/**
 * Connected account representation
 */
export interface ComposioConnection {
    id: string;
    userId: string;
    toolkit: string;
    appName: string;
    status: ConnectionStatus;
    createdAt: string;
}

/**
 * Tool information
 */
export interface ComposioTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

/**
 * Auth scheme types
 */
export type AuthSchemeType = "OAUTH2" | "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH";

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
}
