import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
    verifyAdminAccess,
    getChatWithMessages,
    deleteChat,
    getUserById,
} from "@/lib/appwrite/admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const { chat, messages } = await getChatWithMessages(id);

        // Get user info
        let user = null;
        try {
            user = await getUserById(chat.userId);
        } catch {
            // User might be deleted
        }

        return NextResponse.json({
            conversation: {
                ...chat,
                user: user
                    ? {
                        $id: user.$id,
                        name: user.name,
                        email: user.email,
                    }
                    : null,
            },
            messages,
        });
    } catch (error: any) {
        console.error("Admin get conversation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        await deleteChat(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin delete conversation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
