import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/appwrite/client";
import { composio, getConfiguredServers } from "@/lib/composio/client";
import type { MCPServerConfig } from "@/types/mcp-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all configured servers from JSON
    const configuredServers = getConfiguredServers();

    // List all connected accounts for the user
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [user.$id],
    });

    // Create a map of connected toolkits
    const connectedToolkitMap = new Map<string, string>();
    connectedAccounts.items.forEach((account: any) => {
      if (account.status === "ACTIVE") {
        connectedToolkitMap.set(
          account.appUniqueId.toLowerCase(),
          account.id
        );
      }
    });

    // Build the response with connection status
    const toolkits = configuredServers.map((server: MCPServerConfig) => {
      const toolkit = server.toolkit.toLowerCase();
      const isConnected = connectedToolkitMap.has(toolkit) || !server.requiresAuth;
      const connectionId = connectedToolkitMap.get(toolkit);

      return {
        id: server.id,
        name: server.name,
        toolkit: server.toolkit,
        description: server.description,
        requiresAuth: server.requiresAuth,
        isConnected,
        connectionId,
        allowedTools: server.allowedTools || [],
      };
    });

    // Get list of connected toolkit slugs for easy use
    const connectedToolkitSlugs = toolkits
      .filter((t) => t.isConnected)
      .map((t) => t.toolkit);

    return NextResponse.json({
      toolkits,
      connectedToolkitSlugs,
      totalConfigured: toolkits.length,
      totalConnected: connectedToolkitSlugs.length,
    });
  } catch (error: any) {
    console.error("Error fetching toolkits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}
