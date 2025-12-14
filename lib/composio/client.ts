import { Composio } from "composio-core";
import mcpServersConfig from "@/mcp-servers.json";
import type { MCPServerConfig } from "@/types/mcp-server";

if (!process.env.COMPOSIO_API_KEY) {
  console.warn("COMPOSIO_API_KEY is not set - tools will be disabled");
}

// Initialiser Composio
export const composio = process.env.COMPOSIO_API_KEY
  ? new Composio({ apiKey: process.env.COMPOSIO_API_KEY })
  : null;

/**
 * Get all configured MCP servers
 */
export function getConfiguredServers(): MCPServerConfig[] {
  return mcpServersConfig.servers;
}

/**
 * Get a specific server configuration by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | undefined {
  return mcpServersConfig.servers.find((s) => s.id === serverId);
}

/**
 * Get all available toolkits for a user (connected + no-auth required)
 */
export async function getAvailableToolkits(userId: string): Promise<string[]> {
  if (!composio) return [];

  try {
    const servers = getConfiguredServers();
    
    // Récupérer les comptes connectés
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [userId],
    });

    const connectedToolkits = new Set<string>();
    if (connectedAccounts?.items) {
      connectedAccounts.items.forEach((account: any) => {
        if (account.status === "ACTIVE") {
          connectedToolkits.add(account.appUniqueId.toLowerCase());
        }
      });
    }

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
 * Get tools for specified apps using Composio's actions API
 */
export async function getComposioTools(
  userId: string,
  enabledToolkits: string[] = []
) {
  if (!composio || enabledToolkits.length === 0) {
    return [];
  }

  try {
    // Utiliser l'API actions pour récupérer les outils
    const actions = await composio.actions.list({
      apps: enabledToolkits.join(","),
    });

    // Transformer en format OpenAI/Groq
    const tools = actions.items.map((action: any) => ({
      type: "function" as const,
      function: {
        name: action.name,
        description: action.description,
        parameters: action.parameters || { type: "object", properties: {} },
      },
    }));

    return tools;
  } catch (error) {
    console.error("Error getting Composio tools:", error);
    return [];
  }
}

/**
 * Execute an action/tool
 */
export async function executeTool(
  actionName: string,
  params: Record<string, any>,
  entityId: string
) {
  if (!composio) {
    throw new Error("Composio not initialized");
  }

  try {
    const result = await composio.actions.execute({
      actionName,
      requestBody: {
        input: params,
        entityId,
      },
    });

    return result;
  } catch (error) {
    console.error(`Error executing action ${actionName}:`, error);
    throw error;
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
        const name = tool.function?.name || tool.name;
        const description = tool.function?.description || tool.description;
        return `- ${name}: ${description}`;
      })
      .join("\n");

    return `\nVous avez accès aux outils suivants pour aider l'utilisateur :\n\n${descriptions}\n\nUtilisez ces outils quand c'est pertinent pour répondre aux demandes de l'utilisateur.`;
  } catch (error) {
    console.error("Error getting tools descriptions:", error);
    return "";
  }
}

/**
 * Get authentication URL for a toolkit
 */
export async function getAuthUrl(
  userId: string,
  toolkit: string
): Promise<string> {
  if (!composio) {
    throw new Error("Composio not initialized");
  }

  try {
    const entity = await composio.getEntity(userId);

    const connection = await entity.initiateConnection({
      appName: toolkit,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/composio/callback`,
    });

    return connection.redirectUrl;
  } catch (error) {
    console.error(`Error getting auth URL for ${toolkit}:`, error);
    throw error;
  }
}

/**
 * Get user's connected accounts
 */
export async function getUserConnections(userId: string) {
  if (!composio) return [];

  try {
    const entity = await composio.getEntity(userId);
    const connections = await entity.getConnections();
    return connections;
  } catch (error) {
    console.error("Error getting user connections:", error);
    return [];
  }
}

/**
 * Disconnect a user's account
 */
export async function disconnectAccount(
  userId: string,
  connectionId: string
): Promise<void> {
  if (!composio) {
    throw new Error("Composio not initialized");
  }

  try {
    await composio.connectedAccounts.delete({ 
      connectedAccountId: connectionId 
    });
  } catch (error) {
    console.error("Error disconnecting account:", error);
    throw error;
  }
}