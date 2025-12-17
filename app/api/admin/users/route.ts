import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, listAllUsers } from "@/lib/appwrite/admin";

export async function GET(request: Request) {
    const startTime = Date.now();
    console.log(`[Admin Users] GET request at ${new Date().toISOString()}`);

    try {
        // Get JWT from Authorization header
        console.log(`[Admin Users] Verifying admin access...`);
        const headersList = await headers();
        const authorization = headersList.get("Authorization");

        if (!authorization || !authorization.startsWith("Bearer ")) {
            console.log(`[Admin Users] ❌ No authorization header`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authorization.split("Bearer ")[1];

        // Verify admin access
        const admin = await verifyAdminAccess(jwt);
        if (!admin) {
            console.log(`[Admin Users] ❌ Not an admin user`);
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }
        console.log(`[Admin Users] ✓ Admin verified: ${admin.$id}`);

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25;
        const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;
        console.log(`[Admin Users] Query: search="${search || ''}", limit=${limit}, offset=${offset}`);

        // Get users
        console.log(`[Admin Users] Fetching users...`);
        const result = await listAllUsers({ search, limit, offset });
        console.log(`[Admin Users] ✓ Found ${result.users.length}/${result.total} users in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            users: result.users,
            total: result.total,
        });
    } catch (error: any) {
        console.error(`[Admin Users] ❌ Error: ${error.message} (${Date.now() - startTime}ms)`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
