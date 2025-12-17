/**
 * MCP Configuration Loader
 * 
 * Loads and provides access to mcp.config.json settings for both
 * Composio toolkits and MCP HTTP servers.
 */

import type { MCPConfig, MCPServerConfig, ComposioToolkitConfig } from "@/types/mcp";

// Import the config file directly
import config from "@/mcp.config.json";

// Type the raw config properly
const typedConfig = config as MCPConfig & { toolkits?: ComposioToolkitConfig[] };

/**
 * Get the full MCP configuration
 */
export function getMCPConfig(): MCPConfig {
    // Handle backwards compatibility: if toolkits is at root level,
    // move it to composio.toolkits
    if (typedConfig.toolkits && !typedConfig.composio) {
        return {
            composio: {
                toolkits: typedConfig.toolkits,
            },
            mcpServers: typedConfig.mcpServers || {},
        };
    }
    return typedConfig as MCPConfig;
}

/**
 * Get Composio toolkits configuration
 */
export function getComposioToolkits(): ComposioToolkitConfig[] {
    const cfg = getMCPConfig();

    // Check for toolkits at root level (backwards compatibility)
    if (typedConfig.toolkits) {
        return typedConfig.toolkits;
    }

    return cfg.composio?.toolkits || [];
}

/**
 * Get only enabled Composio toolkits
 */
export function getEnabledComposioToolkits(): ComposioToolkitConfig[] {
    return getComposioToolkits().filter(t => t.enabled !== false);
}

/**
 * Get Composio toolkit by ID
 */
export function getComposioToolkitById(id: string): ComposioToolkitConfig | undefined {
    return getComposioToolkits().find(t => t.id === id);
}

/**
 * Get Composio toolkit by slug
 */
export function getComposioToolkitBySlug(slug: string): ComposioToolkitConfig | undefined {
    return getComposioToolkits().find(
        t => t.toolkit.toUpperCase() === slug.toUpperCase()
    );
}

/**
 * Get list of enabled Composio toolkit slugs
 */
export function getEnabledComposioToolkitSlugs(): string[] {
    return getEnabledComposioToolkits().map(t => t.toolkit);
}

/**
 * Get specific allowed tools across all enabled toolkits
 * Returns array of specific tool names if any toolkit has allowedTools configured
 * Returns empty array if all toolkits should load all tools
 */
export function getAllowedToolsForToolkits(): {
    hasFilter: boolean;
    tools: string[];
    toolkits: string[];
} {
    const enabledToolkits = getEnabledComposioToolkits();
    const specificTools: string[] = [];
    const toolkitsWithAllTools: string[] = [];

    for (const toolkit of enabledToolkits) {
        if (toolkit.allowedTools && toolkit.allowedTools.length > 0) {
            specificTools.push(...toolkit.allowedTools);
        } else {
            // This toolkit wants all its tools
            toolkitsWithAllTools.push(toolkit.toolkit);
        }
    }

    return {
        hasFilter: specificTools.length > 0,
        tools: specificTools,
        toolkits: toolkitsWithAllTools,
    };
}

/**
 * Get all MCP server configurations
 */
export function getMCPServers(): Record<string, MCPServerConfig> {
    const cfg = getMCPConfig();
    return cfg.mcpServers || {};
}

/**
 * Get only enabled MCP servers
 */
export function getEnabledMCPServers(): MCPServerConfig[] {
    const servers = getMCPServers();
    return Object.entries(servers)
        .filter(([_, server]) => server.enabled !== false)
        .map(([id, server]) => ({ ...server, id }));
}

/**
 * Get MCP server by ID
 */
export function getMCPServerById(id: string): MCPServerConfig | undefined {
    const servers = getMCPServers();
    const server = servers[id];
    return server ? { ...server, id } : undefined;
}

/**
 * Check if any MCP servers are configured
 */
export function hasMCPServers(): boolean {
    return getEnabledMCPServers().length > 0;
}
