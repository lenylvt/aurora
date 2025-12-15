import { NextRequest } from "next/server";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import { generateConversationTitle } from "@/lib/groq/naming";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUserServer();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "Message is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const title = await generateConversationTitle(message);

        return new Response(JSON.stringify({ title }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Generate title error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
