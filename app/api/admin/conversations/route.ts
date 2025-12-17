import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, listAllChats, getUserById } from "@/lib/appwrite/admin";

export async function GET(request: Request) {
    const startTime = Date.now();
    console.log(`[Admin Conversations] GET request at ${new Date().toISOString()}`);

    try {
        console.log(`[Admin Conversations] Verifying admin access...`);
        const headersList = await headers();
        const authorization = headersList.get("Authorization");

        if (!authorization || !authorization.startsWith("Bearer ")) {
            console.log(`[Admin Conversations] ❌ No authorization header`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authorization.split("Bearer ")[1];
        const admin = await verifyAdminAccess(jwt);
        if (!admin) {
            console.log(`[Admin Conversations] ❌ Not an admin user`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        console.log(`[Admin Conversations] ✓ Admin verified: ${admin.$id}`);

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const userId = searchParams.get("userId") || undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
        const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;
        console.log(`[Admin Conversations] Query: search="${search || ''}", userId=${userId || 'all'}, limit=${limit}, offset=${offset}`);

        // Get conversations
        console.log(`[Admin Conversations] Fetching conversations...`);
        const result = await listAllChats({ search, userId, limit, offset });
        console.log(`[Admin Conversations] Found ${result.documents.length}/${result.total} conversations`);

        // Enrich with user info
        console.log(`[Admin Conversations] Enriching with user info...`);
        const conversationsWithUsers = await Promise.all(
            result.documents.map(async (chat) => {
                try {
                    const user = await getUserById(chat.userId);
                    return {
                        ...chat,
                        user: {
                            $id: user.$id,
                            name: user.name,
                            email: user.email,
                        },
                    };
                } catch {
                    return {
                        ...chat,
                        user: null,
                    };
                }
            })
        );

        console.log(`[Admin Conversations] ✓ Response ready in ${Date.now() - startTime}ms`);
        return NextResponse.json({
            conversations: conversationsWithUsers,
            total: result.total,
        });
    } catch (error: any) {
        console.error(`[Admin Conversations] ❌ Error: ${error.message} (${Date.now() - startTime}ms)`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
