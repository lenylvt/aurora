import { NextRequest, NextResponse } from "next/server";
import { waitForConnection, getConnectionById, isComposioAvailable } from "@/lib/composio/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";

/**
 * GET /api/composio/auth/status?connectionId=xxx
 * Check the status of a connection request
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    console.log(`[Composio Auth Status] GET request at ${new Date().toISOString()}`);

    try {
        if (!isComposioAvailable()) {
            console.log(`[Composio Auth Status] ❌ Composio not configured`);
            return NextResponse.json(
                { error: "Composio not configured" },
                { status: 503 }
            );
        }

        console.log(`[Composio Auth Status] Authenticating user...`);
        const user = await getCurrentUserServer();
        if (!user) {
            console.log(`[Composio Auth Status] ❌ User not authenticated`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(`[Composio Auth Status] ✓ User: ${user.$id}`);

        const connectionId = request.nextUrl.searchParams.get("connectionId");
        console.log(`[Composio Auth Status] Checking connection: ${connectionId}`);

        if (!connectionId) {
            console.log(`[Composio Auth Status] ❌ Missing connectionId`);
            return NextResponse.json(
                { error: "connectionId is required" },
                { status: 400 }
            );
        }

        const connection = await getConnectionById(connectionId);
        if (!connection) {
            console.log(`[Composio Auth Status] ❌ Connection not found`);
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 }
            );
        }

        console.log(`[Composio Auth Status] ✓ Status: ${connection.status}, Toolkit: ${connection.toolkit} in ${Date.now() - startTime}ms`);
        return NextResponse.json({
            connected: connection.status === "ACTIVE",
            status: connection.status,
            toolkit: connection.toolkit,
            accountId: connection.id,
        });
    } catch (error: unknown) {
        console.error(`[Composio Auth Status] ❌ GET error: ${error instanceof Error ? error.message : String(error)} (${Date.now() - startTime}ms)`);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

/**
 * POST /api/composio/auth/status
 * Wait for a connection to become active (polling)
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();
    console.log(`[Composio Auth Status] POST request at ${new Date().toISOString()}`);

    try {
        if (!isComposioAvailable()) {
            console.log(`[Composio Auth Status] ❌ Composio not configured`);
            return NextResponse.json(
                { error: "Composio not configured" },
                { status: 503 }
            );
        }

        console.log(`[Composio Auth Status] Authenticating user...`);
        const user = await getCurrentUserServer();
        if (!user) {
            console.log(`[Composio Auth Status] ❌ User not authenticated`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(`[Composio Auth Status] ✓ User: ${user.$id}`);

        const { connectionId, timeoutMs = 30000 } = await request.json();
        console.log(`[Composio Auth Status] Waiting for connection: ${connectionId} (timeout: ${timeoutMs}ms)`);

        if (!connectionId) {
            console.log(`[Composio Auth Status] ❌ Missing connectionId`);
            return NextResponse.json(
                { error: "connectionId is required" },
                { status: 400 }
            );
        }

        console.log(`[Composio Auth Status] Polling for connection status...`);
        const result = await waitForConnection(connectionId, timeoutMs);
        console.log(`[Composio Auth Status] ✓ Result: connected=${result.connected}, status=${result.status} in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            connected: result.connected,
            status: result.status,
            accountId: result.accountId,
        });
    } catch (error: unknown) {
        console.error(`[Composio Auth Status] ❌ POST error: ${error instanceof Error ? error.message : String(error)} (${Date.now() - startTime}ms)`);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
