import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, listAllChats, getUserById } from "@/lib/appwrite/admin";

export async function GET(request: Request) {
    try {
        const headersList = await headers();
        const authorization = headersList.get("Authorization");

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authorization.split("Bearer ")[1];
        const admin = await verifyAdminAccess(jwt);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const userId = searchParams.get("userId") || undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
        const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

        // Get conversations
        const result = await listAllChats({ search, userId, limit, offset });

        // Enrich with user info
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

        return NextResponse.json({
            conversations: conversationsWithUsers,
            total: result.total,
        });
    } catch (error: any) {
        console.error("Admin conversations list error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
