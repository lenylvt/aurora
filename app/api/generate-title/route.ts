import { NextRequest, NextResponse } from "next/server";
import { generateConversationTitle } from "@/lib/groq/naming";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const title = await generateConversationTitle(message);

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error("Generate title error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate title" },
      { status: 500 }
    );
  }
}
