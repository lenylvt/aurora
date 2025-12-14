import { NextRequest, NextResponse } from "next/server";
import type OpenAI from "openai";
import {
  generateChatCompletion,
  generateStreamingCompletion,
  type ChatMessage,
  type Tool,
} from "@/lib/groq/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import {
  composio,
  getAvailableToolkits,
  getComposioTools,
  getToolsDescriptions,
  executeTool,
} from "@/lib/composio/client";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ToolCallRequest {
  messages: ChatMessage[];
  enabledToolkits?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, enabledToolkits }: ToolCallRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    let toolkitsToUse: string[] = [];
    let tools: Tool[] = [];
    let toolsDescription = "";

    // Get tools if Composio is available
    try {
      if (composio) {
        toolkitsToUse =
          enabledToolkits && enabledToolkits.length > 0
            ? enabledToolkits
            : await getAvailableToolkits(user.$id);

        if (toolkitsToUse.length > 0) {
          // getComposioTools returns ComposioTools which is compatible with Tool[]
          const composioTools = await getComposioTools(user.$id, toolkitsToUse);
          tools = composioTools;
          toolsDescription = await getToolsDescriptions(
            toolkitsToUse,
            user.$id
          );
        }
      }
    } catch (toolError) {
      console.warn("Composio tools not available:", toolError);
    }

    const messagesWithSystem =
      toolsDescription && messages[0]?.role !== "system"
        ? [
            {
              role: "system" as const,
              content: `You are a helpful AI assistant.${toolsDescription}`,
            },
            ...messages,
          ]
        : messages;

    // If we have tools available, make a first call to detect tool calls
    if (tools.length > 0) {
      const result = await generateChatCompletion(messagesWithSystem, tools);

      if (!result.success || !result.completion) {
        return NextResponse.json(
          { error: result.error || "Failed to generate response" },
          { status: 500 }
        );
      }

      const completion = result.completion;
      const message = completion.choices[0]?.message;

      // If we have tool calls, execute them and stream the final response
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolResults = await Promise.all(
          message.tool_calls.map(async (toolCall: any) => {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const toolResult = await executeTool(
                toolCall.function.name,
                args,
                user.$id
              );

              return {
                tool_call_id: toolCall.id,
                role: "tool" as const,
                name: toolCall.function.name,
                content: JSON.stringify(toolResult),
              };
            } catch (error: any) {
              console.error(
                `Error executing tool ${toolCall.function.name}:`,
                error
              );
              return {
                tool_call_id: toolCall.id,
                role: "tool" as const,
                name: toolCall.function.name,
                content: JSON.stringify({
                  error: error.message || "Tool execution failed",
                }),
              };
            }
          })
        );

        const newMessages: ChatMessage[] = [
          ...messagesWithSystem,
          {
            role: "assistant" as const,
            content: message.content || "",
            tool_calls: message.tool_calls.map((tc: any) => ({
              id: tc.id,
              type: "function" as const,
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            })),
          },
          ...toolResults,
        ];

        // Stream the final response after tool execution
        const streamResult = await generateStreamingCompletion(newMessages);

        if (!streamResult.success || !streamResult.stream) {
          return NextResponse.json(
            {
              error: streamResult.error || "Failed to generate final response",
            },
            { status: 500 }
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResult.stream!) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(encoder.encode(content));
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
            "X-Model-Used": streamResult.model || "unknown",
            "X-Tools-Used": "true",
          },
        });
      }

      // No tool calls, stream the response anyway
      const content = message?.content || "";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(content));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Model-Used": result.model || "unknown",
        },
      });
    }

    // No tools available, stream directly
    const streamResult = await generateStreamingCompletion(messagesWithSystem);

    if (!streamResult.success || !streamResult.stream) {
      return NextResponse.json(
        { error: streamResult.error || "Failed to generate response" },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream!) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
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
        "X-Model-Used": streamResult.model || "unknown",
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