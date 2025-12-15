/**
 * Composio Client
 * 
 * Full integration with Composio SDK using Vercel AI SDK provider.
 * Supports OAuth2, API Key authentication, and tool management.
 * 
 * Docs: https://docs.composio.dev/providers/vercel
 */

import { Composio, AuthScheme } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

// Initialize Composio with Vercel Provider
export const composio = COMPOSIO_API_KEY
    ? new Composio({
        apiKey: COMPOSIO_API_KEY,
        provider: new VercelProvider(),
    })
    : null;

/**
 * Check if Composio is available
 */
export function isComposioAvailable(): boolean {
    return composio !== null;
}

// =============================================================================
// Tool Fetching
// =============================================================================

export interface ToolFetchOptions {
    toolkits?: string[];
    tools?: string[];
    search?: string;
    limit?: number;
}

/**
 * Get Composio tools for a user
 * Tools are scoped to user's connected accounts
 */
export async function getComposioTools(
    userId: string,
    options: ToolFetchOptions = {}
): Promise<Record<string, any>> {
    if (!composio) {
        console.warn("[Composio] Not initialized - missing COMPOSIO_API_KEY");
        return {};
    }

    try {
        // Build filter params based on what's provided
        // The SDK requires specific filter combinations
        let tools: any;

        if (options.tools && options.tools.length > 0) {
            // Fetch specific tools by name
            tools = await composio.tools.get(userId, {
                tools: options.tools,
            });
        } else if (options.toolkits && options.toolkits.length > 0) {
            // Fetch by toolkit
            tools = await composio.tools.get(userId, {
                toolkits: options.toolkits,
            });
        } else {
            // No filters - return empty
            console.log("[Composio] No toolkits or tools specified");
            return {};
        }

        const toolCount = Object.keys(tools as Record<string, any>).length;
        console.log(`[Composio] Loaded ${toolCount} tools for user ${userId}`);
        return tools as Record<string, any>;
    } catch (error: any) {
        console.error("[Composio] Error fetching tools:", error.message);
        return {};
    }
}

/**
 * Get raw tool schemas without user scoping
 * Useful for inspecting tool parameters
 */
export async function getRawToolSchemas(
    options: ToolFetchOptions = {}
): Promise<any[]> {
    if (!composio) {
        return [];
    }

    try {
        // SDK typing is strict about filter combinations
        // Use type assertion for flexibility
        if (options.toolkits && options.toolkits.length > 0) {
            return await composio.tools.getRawComposioTools({
                toolkits: options.toolkits,
            } as any);
        } else if (options.tools && options.tools.length > 0) {
            return await composio.tools.getRawComposioTools({
                tools: options.tools,
            } as any);
        }
        return [];
    } catch (error: any) {
        console.error("[Composio] Error fetching raw tools:", error.message);
        return [];
    }
}

// =============================================================================
// OAuth2 Connection Flow
// =============================================================================

export interface ConnectionRequest {
    id: string;
    redirectUrl: string;
    status: string;
}

/**
 * Initiate OAuth2 connection for a toolkit
 * Returns a redirect URL for the user to complete authentication
 */
export async function initiateOAuthConnection(
    userId: string,
    authConfigId: string,
    callbackUrl: string
): Promise<ConnectionRequest | null> {
    if (!composio) {
        console.warn("[Composio] Not initialized");
        return null;
    }

    try {
        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                config: AuthScheme.OAuth2({}),
                callbackUrl,
            }
        );

        console.log(`[Composio] OAuth initiated for user ${userId}, connection: ${connectionRequest.id}`);

        return {
            id: connectionRequest.id,
            redirectUrl: connectionRequest.redirectUrl || "",
            status: connectionRequest.status || "INITIATED",
        };
    } catch (error: any) {
        console.error("[Composio] Error initiating OAuth:", error.message);
        return null;
    }
}

/**
 * Initiate connection using the hosted link flow (simpler)
 */
export async function initiateHostedConnection(
    userId: string,
    authConfigId: string,
    callbackUrl: string
): Promise<ConnectionRequest | null> {
    if (!composio) {
        console.warn("[Composio] Not initialized");
        return null;
    }

    try {
        const connectionRequest = await composio.connectedAccounts.link(
            userId,
            authConfigId,
            { callbackUrl }
        );

        return {
            id: connectionRequest.id,
            redirectUrl: connectionRequest.redirectUrl || "",
            status: "INITIATED",
        };
    } catch (error: any) {
        console.error("[Composio] Error creating hosted link:", error.message);
        return null;
    }
}

/**
 * Wait for a connection to become active
 */
export async function waitForConnection(
    connectionId: string,
    timeoutMs: number = 60000
): Promise<{ connected: boolean; accountId?: string; status?: string }> {
    if (!composio) {
        return { connected: false };
    }

    try {
        const connectedAccount = await composio.connectedAccounts.waitForConnection(
            connectionId,
            timeoutMs
        );

        return {
            connected: connectedAccount.status === "ACTIVE",
            accountId: connectedAccount.id,
            status: connectedAccount.status,
        };
    } catch (error: any) {
        console.error("[Composio] Error waiting for connection:", error.message);
        return { connected: false, status: "FAILED" };
    }
}

// =============================================================================
// API Key Connection Flow
// =============================================================================

/**
 * Connect using API Key authentication
 */
export async function initiateApiKeyConnection(
    userId: string,
    authConfigId: string,
    apiKey: string
): Promise<{ connected: boolean; accountId?: string }> {
    if (!composio) {
        return { connected: false };
    }

    try {
        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                config: AuthScheme.APIKey({ api_key: apiKey }),
            }
        );

        return {
            connected: true,
            accountId: connectionRequest.id,
        };
    } catch (error: any) {
        console.error("[Composio] Error connecting with API key:", error.message);
        return { connected: false };
    }
}

// =============================================================================
// Connection Management
// =============================================================================

export interface Connection {
    id: string;
    userId: string;
    toolkit: string;
    appName: string;
    status: string;
    createdAt: string;
}

/**
 * List all connections for a user
 */
export async function getUserConnections(userId: string): Promise<Connection[]> {
    if (!composio) {
        return [];
    }

    try {
        const result = await composio.connectedAccounts.list({
            userIds: [userId],
        });

        return (result.items || []).map((account: any) => ({
            id: account.id,
            userId: account.userId || userId,
            toolkit: account.toolkit?.slug?.toUpperCase() || account.appName?.toUpperCase() || "",
            appName: account.appName || "",
            status: account.status,
            createdAt: account.createdAt || "",
        }));
    } catch (error: any) {
        console.error("[Composio] Error listing connections:", error.message);
        return [];
    }
}

/**
 * Get connection for a specific toolkit
 */
export async function getConnectionForToolkit(
    userId: string,
    toolkit: string
): Promise<{ connected: boolean; accountId?: string; status?: string }> {
    if (!composio) {
        return { connected: false };
    }

    try {
        const result = await composio.connectedAccounts.list({
            userIds: [userId],
        });

        const accounts = result.items || [];
        const matchingAccount = accounts.find((a: any) => {
            const accountToolkit = a.toolkit?.slug?.toUpperCase() || a.appName?.toUpperCase() || "";
            return accountToolkit === toolkit.toUpperCase();
        });

        if (matchingAccount) {
            return {
                connected: matchingAccount.status === "ACTIVE",
                accountId: matchingAccount.id,
                status: matchingAccount.status,
            };
        }

        return { connected: false };
    } catch (error: any) {
        console.error("[Composio] Error checking connection:", error.message);
        return { connected: false };
    }
}

/**
 * Get a specific connected account by ID
 */
export async function getConnectionById(
    connectionId: string
): Promise<Connection | null> {
    if (!composio) {
        return null;
    }

    try {
        const account = await composio.connectedAccounts.get(connectionId) as any;
        return {
            id: account.id,
            userId: account.userId || account.externalUserId || "",
            toolkit: account.toolkit?.slug?.toUpperCase() || "",
            appName: account.toolkit?.slug || "",
            status: account.status,
            createdAt: account.createdAt || "",
        };
    } catch (error: any) {
        console.error("[Composio] Error getting connection:", error.message);
        return null;
    }
}

/**
 * Disconnect an account
 */
export async function disconnectAccount(
    userId: string,
    accountId: string
): Promise<boolean> {
    if (!composio) {
        return false;
    }

    try {
        await composio.connectedAccounts.delete(accountId);
        console.log(`[Composio] Disconnected account ${accountId} for user ${userId}`);
        return true;
    } catch (error: any) {
        console.error("[Composio] Error disconnecting:", error.message);
        return false;
    }
}

// =============================================================================
// Tool Execution
// =============================================================================

/**
 * Execute a tool directly (without LLM)
 */
export async function executeTool(
    toolSlug: string,
    userId: string,
    args: Record<string, any>
): Promise<any> {
    if (!composio) {
        throw new Error("Composio not initialized");
    }

    try {
        const result = await composio.tools.execute(toolSlug, {
            userId,
            arguments: args,
        });
        return result;
    } catch (error: any) {
        console.error(`[Composio] Error executing tool ${toolSlug}:`, error.message);
        throw error;
    }
}

// Note: The Vercel provider automatically handles tool calls via the execute
// function that's attached to each tool. No manual handleToolCalls needed.
// When you pass Composio tools to streamText/generateText, tool execution
// is handled automatically by the provider.
