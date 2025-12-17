import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, deleteMessage } from "@/lib/appwrite/admin";

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
        await deleteMessage(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Admin delete message error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
