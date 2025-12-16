import { NextRequest, NextResponse } from "next/server";
import {
    initiateHostedConnection,
    initiateOAuthConnection,
    isComposioAvailable
} from "@/lib/composio/client";
import { getToolkitBySlug } from "@/lib/composio/config";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";

interface ConnectRequestBody {
    toolkit: string;
    callbackUrl: string;
    useHostedFlow?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        if (!isComposioAvailable()) {
            return NextResponse.json(
                { error: "Composio not configured - missing COMPOSIO_API_KEY" },
                { status: 503 }
            );
        }

        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ConnectRequestBody = await request.json();
        const { toolkit, callbackUrl, useHostedFlow = true } = body;

        if (!toolkit || !callbackUrl) {
            return NextResponse.json(
                { error: "toolkit and callbackUrl are required" },
                { status: 400 }
            );
        }

        // Get toolkit config
        const toolkitConfig = getToolkitBySlug(toolkit);
        if (!toolkitConfig) {
            return NextResponse.json(
                { error: `Toolkit ${toolkit} not found in configuration` },
                { status: 404 }
            );
        }

        if (!toolkitConfig.authConfigId) {
            return NextResponse.json(
                { error: `No authConfigId configured for ${toolkit}. Add it in mcp.config.json` },
                { status: 400 }
            );
        }

        // Initiate connection
        const result = useHostedFlow
            ? await initiateHostedConnection(user.$id, toolkitConfig.authConfigId, callbackUrl)
            : await initiateOAuthConnection(user.$id, toolkitConfig.authConfigId, callbackUrl);

        if (!result) {
            return NextResponse.json(
                { error: "Failed to initiate connection" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            redirectUrl: result.redirectUrl,
            connectionId: result.id,
            toolkit: toolkit.toUpperCase(),
        });
    } catch (error: unknown) {
        console.error("[Composio Auth] Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
