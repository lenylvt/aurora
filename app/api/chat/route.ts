import { NextRequest, NextResponse } from "next/server";
import { generateStreamingCompletion, type ChatMessage } from "@/lib/groq/client";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const result = await generateStreamingCompletion(messages as ChatMessage[]);

    if (!result.success || !result.stream) {
      return NextResponse.json(
        { error: result.error || "Failed to generate response" },
        { status: 500 }
      );
    }

    // Create a TransformStream for streaming the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream!) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Model-Used": result.model || "unknown",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
