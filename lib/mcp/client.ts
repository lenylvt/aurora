/**
 * MCP HTTP Client
 * 
 * Client for connecting to MCP (Model Context Protocol) servers via HTTP/SSE transport.
 * Uses @ai-sdk/mcp for integration with Vercel AI SDK.
 */

import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import type { MCPServerConfig } from "@/types/mcp";
import { getEnabledMCPServers } from "./config";

// Store active MCP clients
const activeClients: Map<string, Awaited<ReturnType<typeof createMCPClient>>> = new Map();

/**
 * Initialize an MCP client for a server configuration
 */
async function initializeMCPClient(server: MCPServerConfig) {
    try {
        console.log(`[MCP] Initializing client for ${server.name} (${server.type}): ${server.url}`);

        const client = await createMCPClient({
            transport: {
                type: server.type,
                url: server.url,
                headers: server.headers,
            },
        });

        console.log(`[MCP] Successfully connected to ${server.name}`);
        return client;
    } catch (error: any) {
        console.error(`[MCP] Failed to connect to ${server.name}:`, error.message);
        return null;
    }
}

/**
 * Get or create an MCP client for a server
 */
async function getOrCreateClient(server: MCPServerConfig) {
    const existingClient = activeClients.get(server.id);
    if (existingClient) {
        return existingClient;
    }

    const client = await initializeMCPClient(server);
    if (client) {
        activeClients.set(server.id, client);
    }
    return client;
}

/**
 * Get tools from all enabled MCP servers
 * Returns a merged object of all tools from all servers
 */
export async function getMCPTools(): Promise<Record<string, any>> {
    const servers = getEnabledMCPServers();

    if (servers.length === 0) {
        return {};
    }

    const allTools: Record<string, any> = {};

    for (const server of servers) {
        try {
            const client = await getOrCreateClient(server);
            if (!client) continue;

            // Get tools from this server
            const tools = await client.tools();

            // Merge tools with server prefix to avoid name collisions
            for (const [toolName, tool] of Object.entries(tools)) {
                // Use server ID as prefix if there are multiple servers
                const prefixedName = servers.length > 1
                    ? `${server.id}_${toolName}`
                    : toolName;
                allTools[prefixedName] = tool;
            }

            console.log(`[MCP] Loaded ${Object.keys(tools).length} tools from ${server.name}`);
        } catch (error: any) {
            console.error(`[MCP] Error fetching tools from ${server.name}:`, error.message);
        }
    }

    return allTools;
}

/**
 * Get tools from a specific MCP server by ID
 */
export async function getMCPToolsFromServer(serverId: string): Promise<Record<string, any>> {
    const servers = getEnabledMCPServers();
    const server = servers.find(s => s.id === serverId);

    if (!server) {
        console.warn(`[MCP] Server ${serverId} not found or not enabled`);
        return {};
    }

    try {
        const client = await getOrCreateClient(server);
        if (!client) return {};

        return await client.tools();
    } catch (error: any) {
        console.error(`[MCP] Error fetching tools from ${serverId}:`, error.message);
        return {};
    }
}

/**
 * Close all MCP clients
 */
export async function closeAllMCPClients(): Promise<void> {
    for (const [serverId, client] of activeClients.entries()) {
        try {
            await client.close();
            console.log(`[MCP] Closed client for ${serverId}`);
        } catch (error: any) {
            console.error(`[MCP] Error closing client ${serverId}:`, error.message);
        }
    }
    activeClients.clear();
}

/**
 * Close a specific MCP client
 */
export async function closeMCPClient(serverId: string): Promise<void> {
    const client = activeClients.get(serverId);
    if (client) {
        try {
            await client.close();
            activeClients.delete(serverId);
            console.log(`[MCP] Closed client for ${serverId}`);
        } catch (error: any) {
            console.error(`[MCP] Error closing client ${serverId}:`, error.message);
        }
    }
}

/**
 * Check if MCP tools are available
 */
export function isMCPAvailable(): boolean {
    return getEnabledMCPServers().length > 0;
}

/**
 * Get list of connected server IDs
 */
export function getConnectedServers(): string[] {
    return Array.from(activeClients.keys());
}
