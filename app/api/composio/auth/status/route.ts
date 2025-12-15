import { NextRequest, NextResponse } from "next/server";
import { waitForConnection, getConnectionById, isComposioAvailable } from "@/lib/composio/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";

/**
 * GET /api/composio/auth/status?connectionId=xxx
 * Check the status of a connection request
 */
export async function GET(request: NextRequest) {
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

        const connectionId = request.nextUrl.searchParams.get("connectionId");
        if (!connectionId) {
            return NextResponse.json(
                { error: "connectionId is required" },
                { status: 400 }
            );
        }

        const connection = await getConnectionById(connectionId);
        if (!connection) {
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            connected: connection.status === "ACTIVE",
            status: connection.status,
            toolkit: connection.toolkit,
            accountId: connection.id,
        });
    } catch (error: unknown) {
        console.error("[Composio Auth Status] Error:", error);
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

        const { connectionId, timeoutMs = 30000 } = await request.json();
        if (!connectionId) {
            return NextResponse.json(
                { error: "connectionId is required" },
                { status: 400 }
            );
        }

        const result = await waitForConnection(connectionId, timeoutMs);

        return NextResponse.json({
            connected: result.connected,
            status: result.status,
            accountId: result.accountId,
        });
    } catch (error: unknown) {
        console.error("[Composio Auth Wait] Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
