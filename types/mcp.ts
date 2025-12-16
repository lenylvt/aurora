/**
 * MCP Types
 * 
 * Type definitions for MCP (Model Context Protocol) server configuration.
 */

/**
 * Transport type for MCP servers
 */
export type MCPTransportType = "http" | "sse";

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
    /** Unique identifier for the server */
    id: string;
    /** Display name of the server */
    name: string;
    /** Description of the server capabilities */
    description?: string;
    /** Transport type (http or sse) */
    type: MCPTransportType;
    /** Server URL endpoint */
    url: string;
    /** Whether the server is enabled */
    enabled?: boolean;
    /** Custom HTTP headers for authentication */
    headers?: Record<string, string>;
}

/**
 * Full MCP configuration structure for mcp.config.json
 */
export interface MCPConfig {
    /** Composio toolkits configuration (legacy support) */
    composio?: {
        toolkits: ComposioToolkitConfig[];
    };
    /** MCP HTTP/SSE servers configuration */
    mcpServers?: Record<string, MCPServerConfig>;
}

/**
 * Composio toolkit configuration (for backwards compatibility)
 */
export interface ComposioToolkitConfig {
    id: string;
    name: string;
    toolkit: string;
    description: string;
    authConfigId?: string;
    enabled?: boolean;
    allowedTools?: string[];
    icon?: string;
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
