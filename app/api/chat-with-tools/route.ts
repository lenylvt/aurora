import { NextRequest, NextResponse } from "next/server";
import {
  generateChatCompletion,
  type ChatMessage,
  type Tool,
} from "@/lib/groq/client";
import { getCurrentUser } from "@/lib/appwrite/client";
import {
  composio,
  getAvailableToolkits,
  getToolsDescriptions,
} from "@/lib/composio/client";

export const maxDuration = 60;

interface ToolCallRequest {
  messages: ChatMessage[];
  enabledToolkits?: string[]; // Optional, will auto-detect if not provided
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
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

    // Auto-detect available toolkits if not provided
    const toolkitsToUse =
      enabledToolkits && enabledToolkits.length > 0
        ? enabledToolkits
        : await getAvailableToolkits(user.$id);

    // Get Composio tools for the user
    let tools: Tool[] = [];
    let toolsDescription = "";

    if (toolkitsToUse.length > 0) {
      const composioTools = await composio.tools.get({
        apps: toolkitsToUse,
      });

      // Transform Composio tools to Groq format (OpenAI compatible)
      tools = composioTools.map((tool: any) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // Get tools description for system message
      toolsDescription = await getToolsDescriptions(toolkitsToUse);
    }

    // Add system message with tools description if tools are available
    const messagesWithSystem =
      toolsDescription && messages[0]?.role !== "system"
        ? [
            {
              role: "system" as const,
              content: `Vous êtes un assistant IA serviable.${toolsDescription}`,
            },
            ...messages,
          ]
        : messages;

    // First completion to get tool calls
    let result = await generateChatCompletion(messagesWithSystem, false, tools);

    if (!result.success || !result.completion) {
      return NextResponse.json(
        { error: result.error || "Failed to generate response" },
        { status: 500 }
      );
    }

    const completion = result.completion as any;
    const message = completion.choices[0]?.message;

    // Check if there are tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Execute tool calls
      const toolResults = await Promise.all(
        message.tool_calls.map(async (toolCall: any) => {
          try {
            const args = JSON.parse(toolCall.function.arguments);

            // Execute the tool using Composio
            const toolResult = await composio.tools.execute({
              tool: toolCall.function.name,
              input: args,
              entityId: user.$id,
            });

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

      // Add assistant message with tool calls to conversation
      const newMessages: ChatMessage[] = [
        ...messagesWithSystem,
        {
          role: "assistant" as const,
          content: message.content || "",
          tool_calls: message.tool_calls,
        },
        ...toolResults,
      ];

      // Get final response from Groq with tool results
      result = await generateChatCompletion(newMessages, false, tools);

      if (!result.success || !result.completion) {
        return NextResponse.json(
          { error: result.error || "Failed to generate final response" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        content:
          (result.completion as any).choices[0]?.message?.content || "",
        model: result.model,
        toolCalls: message.tool_calls,
        toolResults: toolResults,
        availableToolkits: toolkitsToUse,
      });
    }

    // No tool calls, return the response directly
    return NextResponse.json({
      content: message?.content || "",
      model: result.model,
      availableToolkits: toolkitsToUse,
    });
  } catch (error: any) {
    console.error("Chat with tools API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}