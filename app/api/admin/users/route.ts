import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, listAllUsers } from "@/lib/appwrite/admin";

export async function GET(request: Request) {
    try {
        // Get JWT from Authorization header
        const headersList = await headers();
        const authorization = headersList.get("Authorization");

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authorization.split("Bearer ")[1];

        // Verify admin access
        const admin = await verifyAdminAccess(jwt);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
        const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

        // Get users
        const result = await listAllUsers({ search, limit, offset });

        return NextResponse.json({
            users: result.users,
            total: result.total,
        });
    } catch (error: any) {
        console.error("Admin users list error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
