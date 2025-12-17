import { NextRequest, NextResponse } from "next/server";
import { getUserConnections, disconnectAccount, isComposioAvailable } from "@/lib/composio/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";

/**
 * GET /api/composio/connections
 * List all connected accounts for the current user
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log(`[Composio Connections] GET request at ${new Date().toISOString()}`);

  try {
    if (!isComposioAvailable()) {
      console.log(`[Composio Connections] ❌ Composio not configured`);
      return NextResponse.json(
        { error: "Composio not configured" },
        { status: 503 }
      );
    }

    console.log(`[Composio Connections] Authenticating user...`);
    const user = await getCurrentUserServer();
    if (!user) {
      console.log(`[Composio Connections] ❌ User not authenticated`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Composio Connections] ✓ User: ${user.$id}`);

    console.log(`[Composio Connections] Fetching connections...`);
    const connections = await getUserConnections(user.$id);
    console.log(`[Composio Connections] ✓ Found ${connections.length} connections in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      connections,
      count: connections.length,
    });
  } catch (error: any) {
    console.error(`[Composio Connections] ❌ GET error: ${error.message} (${Date.now() - startTime}ms)`);
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
  const startTime = Date.now();
  console.log(`[Composio Connections] DELETE request at ${new Date().toISOString()}`);

  try {
    if (!isComposioAvailable()) {
      console.log(`[Composio Connections] ❌ Composio not configured`);
      return NextResponse.json(
        { error: "Composio not configured" },
        { status: 503 }
      );
    }

    console.log(`[Composio Connections] Authenticating user...`);
    const user = await getCurrentUserServer();
    if (!user) {
      console.log(`[Composio Connections] ❌ User not authenticated`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Composio Connections] ✓ User: ${user.$id}`);

    const { connectionId } = await req.json();
    console.log(`[Composio Connections] Disconnecting: ${connectionId}`);

    if (!connectionId) {
      console.log(`[Composio Connections] ❌ Missing connectionId`);
      return NextResponse.json(
        { error: "connectionId is required" },
        { status: 400 }
      );
    }

    const success = await disconnectAccount(user.$id, connectionId);

    if (!success) {
      console.log(`[Composio Connections] ❌ Disconnect failed`);
      return NextResponse.json(
        { error: "Failed to disconnect account" },
        { status: 500 }
      );
    }

    console.log(`[Composio Connections] ✓ Disconnected in ${Date.now() - startTime}ms`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[Composio Connections] ❌ DELETE error: ${error.message} (${Date.now() - startTime}ms)`);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}