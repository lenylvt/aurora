import { NextRequest, NextResponse } from "next/server";
import { getUserConnections, disconnectAccount, isComposioAvailable } from "@/lib/composio/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";

/**
 * GET /api/composio/connections
 * List all connected accounts for the current user
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

    const connections = await getUserConnections(user.$id);

    return NextResponse.json({
      connections,
      count: connections.length,
    });
  } catch (error: any) {
    console.error("[Composio Connections] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get connections" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/composio/connections
 * Disconnect an account
 */
export async function DELETE(req: NextRequest) {
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

    const { connectionId } = await req.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId is required" },
        { status: 400 }
      );
    }

    const success = await disconnectAccount(user.$id, connectionId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to disconnect account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Composio Disconnect] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}