import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminAccess, getAdminStats } from "@/lib/appwrite/admin";

export async function GET() {
    const startTime = Date.now();
    console.log(`[Admin Stats] GET request at ${new Date().toISOString()}`);

    try {
        console.log(`[Admin Stats] Verifying admin access...`);
        const headersList = await headers();
        const authorization = headersList.get("Authorization");

        if (!authorization || !authorization.startsWith("Bearer ")) {
            console.log(`[Admin Stats] ❌ No authorization header`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const jwt = authorization.split("Bearer ")[1];
        const admin = await verifyAdminAccess(jwt);
        if (!admin) {
            console.log(`[Admin Stats] ❌ Not an admin user`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        console.log(`[Admin Stats] ✓ Admin verified: ${admin.$id}`);

        console.log(`[Admin Stats] Fetching stats...`);
        const stats = await getAdminStats();
        console.log(`[Admin Stats] ✓ Stats: ${stats.totalUsers} users, ${stats.totalChats} chats, ${stats.totalMessages} messages in ${Date.now() - startTime}ms`);

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error(`[Admin Stats] ❌ Error: ${error.message} (${Date.now() - startTime}ms)`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
