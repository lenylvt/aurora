import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import { getUserConnections, isComposioAvailable } from "@/lib/composio/client";
import { getEnabledToolkits } from "@/lib/composio/config";

export const runtime = "nodejs";

/**
 * GET /api/composio/toolkits
 * Get all configured toolkits with their connection status
 */
export async function GET(req: NextRequest) {
  try {
    if (!isComposioAvailable()) {
      return NextResponse.json(
        { error: "Composio not configured" },
        { status: 503 }
      );
    }

    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all configured toolkits
    const configuredToolkits = getEnabledToolkits();

    // Get user connections
    const connections = await getUserConnections(user.$id);

    // Create a map of connected toolkits
    const connectedToolkitMap = new Map<string, { id: string; status: string }>();
    connections.forEach((connection) => {
      if (connection.status === "ACTIVE") {
        connectedToolkitMap.set(
          connection.toolkit.toUpperCase(),
          { id: connection.id, status: connection.status }
        );
      }
    });

    // Build the response with connection status
    const toolkits = configuredToolkits.map((toolkit) => {
      const toolkitSlug = toolkit.toolkit.toUpperCase();
      const connection = connectedToolkitMap.get(toolkitSlug);

      return {
        id: toolkit.id,
        name: toolkit.name,
        toolkit: toolkitSlug,
        description: toolkit.description,
        icon: toolkit.icon,
        hasAuthConfig: !!toolkit.authConfigId,
        isConnected: !!connection,
        connectionId: connection?.id,
        connectionStatus: connection?.status,
        allowedTools: toolkit.allowedTools || [],
      };
    });

    // Get list of connected toolkit slugs
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
    console.error("[Composio Toolkits] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}