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
  const startTime = Date.now();
  console.log(`[Composio Toolkits] GET request at ${new Date().toISOString()}`);

  try {
    if (!isComposioAvailable()) {
      console.log(`[Composio Toolkits] ❌ Composio not configured`);
      return NextResponse.json(
        { error: "Composio not configured" },
        { status: 503 }
      );
    }

    console.log(`[Composio Toolkits] Authenticating user...`);
    const user = await getCurrentUserServer();
    if (!user) {
      console.log(`[Composio Toolkits] ❌ User not authenticated`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Composio Toolkits] ✓ User: ${user.$id}`);

    // Get all configured toolkits
    console.log(`[Composio Toolkits] Loading enabled toolkits...`);
    const configuredToolkits = getEnabledToolkits();
    console.log(`[Composio Toolkits] Found ${configuredToolkits.length} configured toolkits`);

    // Get user connections
    console.log(`[Composio Toolkits] Fetching user connections...`);
    const connections = await getUserConnections(user.$id);
    console.log(`[Composio Toolkits] User has ${connections.length} connections`);

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

    console.log(`[Composio Toolkits] ✓ Response: ${toolkits.length} toolkits, ${connectedToolkitSlugs.length} connected in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      toolkits,
      connectedToolkitSlugs,
      totalConfigured: toolkits.length,
      totalConnected: connectedToolkitSlugs.length,
    });
  } catch (error: any) {
    console.error(`[Composio Toolkits] ❌ Error: ${error.message} (${Date.now() - startTime}ms)`);
    return NextResponse.json(
      { error: error.message || "Failed to fetch toolkits" },
      { status: 500 }
    );
  }
}