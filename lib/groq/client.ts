import OpenAI from "openai";
import type { GroqModel } from "@/types";

// Initialize OpenAI client with Groq base URL for OpenAI compatibility
const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Fallback chain: try each model in order
const MODELS: GroqModel[] = [
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "openai/gpt-oss-20b",
];

// Vision model for images
const VISION_MODEL: GroqModel = "meta-llama/llama-4-scout-17b-16e-instruct";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | MessageContent[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Use OpenAI's native tool type for compatibility with Composio
export type Tool = OpenAI.Chat.Completions.ChatCompletionTool;

// Helper to check if messages contain images
function hasImages(messages: ChatMessage[]): boolean {
  return messages.some((msg) => {
    if (Array.isArray(msg.content)) {
      return msg.content.some((c) => c.type === "image_url");
    }
    return false;
  });
}

export async function generateChatCompletion(
  messages: ChatMessage[],
  tools?: Tool[]
) {
  let lastError: any = null;

  // Use Vision model if messages contain images
  const containsImages = hasImages(messages);
  const modelsToTry = containsImages ? [VISION_MODEL] : MODELS;

  for (const model of modelsToTry) {
    try {
      // Using OpenAI client with Groq's OpenAI-compatible endpoint
      const completion = await client.chat.completions.create({
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        model,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: false,
        ...(tools && tools.length > 0 && { 
          tools,
          tool_choice: "auto" as const 
        }),
      });

      return { success: true, completion, model };
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq/OpenAI] Model ${model} failed:`, error.message);
      continue;
    }
  }

  return {
    success: false,
    error: lastError?.message || "All models failed",
    completion: null,
    model: null,
  };
}

export async function generateStreamingCompletion(
  messages: ChatMessage[],
  tools?: Tool[]
) {
  let lastError: any = null;

  // Use Vision model if messages contain images
  const containsImages = hasImages(messages);
  const modelsToTry = containsImages ? [VISION_MODEL] : MODELS;

  for (const model of modelsToTry) {
    try {
      // Streaming with OpenAI client
      const stream = await client.chat.completions.create({
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        model,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: true,
        ...(tools && tools.length > 0 && { 
          tools,
          tool_choice: "auto" as const 
        }),
      });

      return { success: true, stream, model };
    } catch (error: any) {
      lastError = error;
      console.error(`[Groq/OpenAI] Model ${model} streaming failed:`, error.message);
      continue;
    }
  }

  return {
    success: false,
    error: lastError?.message || "All models failed",
    stream: null,
    model: null,
  };
}

// Export client for use in other modules
export { client as openaiClient };