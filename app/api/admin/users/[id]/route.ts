import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
    verifyAdminAccess,
    getUserById,
    updateUser,
    deleteUser,
    listAllChats,
    deleteChat,
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
        const user = await getUserById(id);

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error("Admin get user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
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
        const body = await request.json();

        const user = await updateUser(id, {
            name: body.name,
            email: body.email,
            labels: body.labels,
            status: body.status,
        });

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error("Admin update user error:", error);
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

        // Check if we should also delete user's data
        const { searchParams } = new URL(request.url);
        const deleteData = searchParams.get("deleteData") === "true";

        if (deleteData) {
            // Delete all user's chats first
            const chats = await listAllChats({ userId: id, limit: 1000 });
            for (const chat of chats.documents) {
                await deleteChat(chat.$id);
            }
        }

        // Delete the user
        await deleteUser(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin delete user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
