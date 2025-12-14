import { Composio } from "@composio/core";
import { OpenAIProvider } from "@composio/openai";
import type OpenAI from "openai";
import mcpServersConfig from "@/mcp-servers.json";
import type { MCPServerConfig } from "@/types/mcp-server";

if (!process.env.COMPOSIO_API_KEY) {
  console.warn("COMPOSIO_API_KEY is not set - tools will be disabled");
}

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE_URL = "https://backend.composio.dev/api/v3";

// Initialize Composio with OpenAI Provider for tools
export const composio = COMPOSIO_API_KEY
  ? new Composio({
      apiKey: COMPOSIO_API_KEY,
      provider: new OpenAIProvider(),
    })
  : null;

// Export the type for tools returned by Composio
export type ComposioTools = OpenAI.Chat.Completions.ChatCompletionTool[];

/**
 * Get all configured MCP servers
 */
export function getConfiguredServers(): MCPServerConfig[] {
  return mcpServersConfig.servers as MCPServerConfig[];
}

/**
 * Get a specific server configuration by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | undefined {
  return mcpServersConfig.servers.find((s) => s.id === serverId) as MCPServerConfig | undefined;
}

/**
 * Get all available toolkits for a user (connected + no-auth required)
 */
export async function getAvailableToolkits(userId: string): Promise<string[]> {
  if (!composio) return [];

  try {
    const servers = getConfiguredServers();
    const connections = await getUserConnections(userId);

    const connectedToolkits = new Set<string>();
    connections.forEach((connection: any) => {
      if (connection.status === "ACTIVE") {
        connectedToolkits.add(connection.appName?.toLowerCase() || "");
      }
    });

    const availableToolkits = servers
      .filter((server) => {
        return (
          !server.requiresAuth ||
          connectedToolkits.has(server.toolkit.toLowerCase())
        );
      })
      .map((server) => server.toolkit);

    return availableToolkits;
  } catch (error) {
    console.error("Error getting available toolkits:", error);
    return [];
  }
}

/**
 * Get tools for specified toolkits using Composio's tools API
 * Returns OpenAI-compatible tool format
 */
export async function getComposioTools(
  userId: string,
  enabledToolkits: string[] = []
): Promise<ComposioTools> {
  if (!composio || enabledToolkits.length === 0) {
    return [];
  }

  try {
    // Use the tools.get API with toolkits parameter
    const tools = await composio.tools.get(userId, {
      toolkits: enabledToolkits,
    });

    // The tools are already in OpenAI format from the provider
    return tools as ComposioTools;
  } catch (error) {
    console.error("Error getting Composio tools:", error);
    return [];
  }
}

/**
 * Execute tool calls using the OpenAI Provider
 * This handles the full response from OpenAI chat completion
 */
export async function handleToolCalls(
  userId: string,
  response: OpenAI.Chat.Completions.ChatCompletion
) {
  if (!composio) {
    throw new Error("Composio not initialized");
  }

  try {
    const result = await composio.provider.handleToolCalls(userId, response);
    return result;
  } catch (error) {
    console.error("Error handling tool calls:", error);
    throw error;
  }
}

/**
 * Execute a single tool directly using composio.tools.execute
 */
export async function executeTool(
  actionName: string,
  params: Record<string, any>,
  userId: string
) {
  if (!composio) {
    throw new Error("Composio not initialized");
  }

  try {
    console.log(`[Composio] Executing action: ${actionName}`);
    console.log(`[Composio] User ID: ${userId}`);
    console.log(`[Composio] Parameters:`, JSON.stringify(params, null, 2));

    // Use the direct tools.execute API
    const result = await composio.tools.execute(actionName, {
      userId,
      arguments: params,
    });

    console.log(`[Composio] Result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error(`[Composio] Error executing action ${actionName}:`, error);

    const errorDetails = {
      message: error.message,
      status: error.status || error.statusCode,
      response: error.response?.data || error.response,
      details: error.details,
      stack: error.stack,
    };

    console.error(`[Composio] Error details:`, JSON.stringify(errorDetails, null, 2));

    const enrichedError: any = new Error(
      error.message || `Failed to execute ${actionName}`
    );
    enrichedError.details = errorDetails;
    enrichedError.actionName = actionName;
    enrichedError.params = params;

    throw enrichedError;
  }
}

/**
 * Get tools descriptions for system prompt
 */
export async function getToolsDescriptions(
  toolkits: string[],
  userId?: string
): Promise<string> {
  if (!composio || toolkits.length === 0) {
    return "";
  }

  try {
    const tools = await getComposioTools(userId || "", toolkits);

    if (!tools || tools.length === 0) {
      return "";
    }

    const descriptions = tools
      .map((tool: any) => {
        const name = tool.function?.name || tool.name || "unknown";
        const description = tool.function?.description || tool.description || "No description";
        return `- ${name}: ${description}`;
      })
      .join("\n");

    return `\nYou have access to the following tools:\n\n${descriptions}\n\nUse these tools when relevant to help the user.`;
  } catch (error) {
    console.error("Error getting tools descriptions:", error);
    return "";
  }
}

/**
 * Get authentication URL for a toolkit using Composio REST API
 */
export async function getAuthUrl(
  userId: string,
  toolkit: string
): Promise<string> {
  if (!COMPOSIO_API_KEY) {
    throw new Error("Composio not initialized");
  }

  try {
    // Use Composio REST API for connection initiation
    const response = await fetch(`${COMPOSIO_BASE_URL}/connectedAccounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": COMPOSIO_API_KEY,
      },
      body: JSON.stringify({
        integrationId: toolkit,
        entityId: userId,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/composio/callback`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to initiate connection");
    }

    const data = await response.json();

    if (!data.redirectUrl) {
      throw new Error("No redirect URL returned");
    }

    return data.redirectUrl;
  } catch (error) {
    console.error(`Error getting auth URL for ${toolkit}:`, error);
    throw error;
  }
}

/**
 * Get user's connected accounts using Composio REST API
 */
export async function getUserConnections(userId: string) {
  if (!COMPOSIO_API_KEY) return [];

  try {
    const response = await fetch(
      `${COMPOSIO_BASE_URL}/connectedAccounts?entityId=${userId}`,
      {
        headers: {
          "x-api-key": COMPOSIO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch connections");
    }

    const data = await response.json();
    return data.items || data.connectedAccounts || [];
  } catch (error) {
    console.error("Error getting user connections:", error);
    return [];
  }
}

/**
 * Disconnect a user's account using Composio REST API
 */
export async function disconnectAccount(
  userId: string,
  connectionId: string
): Promise<void> {
  if (!COMPOSIO_API_KEY) {
    throw new Error("Composio not initialized");
  }

  try {
    const response = await fetch(
      `${COMPOSIO_BASE_URL}/connectedAccounts/${connectionId}`,
      {
        method: "DELETE",
        headers: {
          "x-api-key": COMPOSIO_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to disconnect account");
    }
  } catch (error) {
    console.error("Error disconnecting account:", error);
    throw error;
  }
}