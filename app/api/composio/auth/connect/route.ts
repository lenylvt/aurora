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
    const startTime = Date.now();
    console.log(`[Composio Auth Connect] POST request at ${new Date().toISOString()}`);

    try {
        if (!isComposioAvailable()) {
            console.log(`[Composio Auth Connect] ❌ Composio not configured`);
            return NextResponse.json(
                { error: "Composio not configured - missing COMPOSIO_API_KEY" },
                { status: 503 }
            );
        }

        console.log(`[Composio Auth Connect] Authenticating user...`);
        const user = await getCurrentUserServer();
        if (!user) {
            console.log(`[Composio Auth Connect] ❌ User not authenticated`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(`[Composio Auth Connect] ✓ User: ${user.$id}`);

        const body: ConnectRequestBody = await request.json();
        const { toolkit, callbackUrl, useHostedFlow = true } = body;
        console.log(`[Composio Auth Connect] Toolkit: ${toolkit}, Callback: ${callbackUrl}, HostedFlow: ${useHostedFlow}`);

        if (!toolkit || !callbackUrl) {
            console.log(`[Composio Auth Connect] ❌ Missing toolkit or callbackUrl`);
            return NextResponse.json(
                { error: "toolkit and callbackUrl are required" },
                { status: 400 }
            );
        }

        // Get toolkit config
        console.log(`[Composio Auth Connect] Looking up toolkit config...`);
        const toolkitConfig = getToolkitBySlug(toolkit);
        if (!toolkitConfig) {
            console.log(`[Composio Auth Connect] ❌ Toolkit ${toolkit} not found`);
            return NextResponse.json(
                { error: `Toolkit ${toolkit} not found in configuration` },
                { status: 404 }
            );
        }
        console.log(`[Composio Auth Connect] ✓ Toolkit found: ${toolkitConfig.name}`);

        if (!toolkitConfig.authConfigId) {
            console.log(`[Composio Auth Connect] ❌ No authConfigId for ${toolkit}`);
            return NextResponse.json(
                { error: `No authConfigId configured for ${toolkit}. Add it in mcp.config.json` },
                { status: 400 }
            );
        }

        // Initiate connection
        console.log(`[Composio Auth Connect] Initiating ${useHostedFlow ? 'hosted' : 'OAuth'} connection...`);
        const result = useHostedFlow
            ? await initiateHostedConnection(user.$id, toolkitConfig.authConfigId, callbackUrl)
            : await initiateOAuthConnection(user.$id, toolkitConfig.authConfigId, callbackUrl);

        if (!result) {
            console.log(`[Composio Auth Connect] ❌ Failed to initiate connection`);
            return NextResponse.json(
                { error: "Failed to initiate connection" },
                { status: 500 }
            );
        }

        console.log(`[Composio Auth Connect] ✓ Connection initiated: ${result.id} in ${Date.now() - startTime}ms`);
        return NextResponse.json({
            redirectUrl: result.redirectUrl,
            connectionId: result.id,
            toolkit: toolkit.toUpperCase(),
        });
    } catch (error: unknown) {
        console.error(`[Composio Auth Connect] ❌ Error: ${error instanceof Error ? error.message : String(error)} (${Date.now() - startTime}ms)`);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
