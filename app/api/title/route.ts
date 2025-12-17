import { NextRequest } from "next/server";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import { generateConversationTitle } from "@/lib/groq/naming";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    console.log(`[Title API] POST request at ${new Date().toISOString()}`);

    try {
        console.log(`[Title API] Authenticating user...`);
        const user = await getCurrentUserServer();

        if (!user) {
            console.log(`[Title API] ❌ Authentication failed`);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        console.log(`[Title API] ✓ User: ${user.$id}`);

        console.log(`[Title API] Parsing request body...`);
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            console.log(`[Title API] ❌ Invalid message`);
            return new Response(
                JSON.stringify({ error: "Message is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        console.log(`[Title API] Message length: ${message.length} chars`);

        console.log(`[Title API] Generating title...`);
        const title = await generateConversationTitle(message);
        console.log(`[Title API] ✓ Title generated: "${title}" in ${Date.now() - startTime}ms`);

        return new Response(JSON.stringify({ title }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error(`[Title API] ❌ Error: ${error.message} (${Date.now() - startTime}ms)`);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
