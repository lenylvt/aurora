"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Message } from "@/types";
import type { ProcessedFile } from "@/lib/files/processor";
import { formatFileForAI } from "@/lib/files/processor";
import { getChatMessages } from "@/lib/appwrite/database";

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  role: "tool";
  name: string;
  content: string;
}

export function useChatWithTools(chatId: string | null, enabledToolkits: string[] = []) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    content: string;
    files?: ProcessedFile[];
  } | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const skipNextLoad = useRef(false);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      if (skipNextLoad.current) {
        skipNextLoad.current = false;
        return;
      }

      setIsLoading(true);
      getChatMessages(chatId).then((result) => {
        if (result.success) {
          setMessages(result.messages);
        }
        setIsLoading(false);
      });
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const sendMessage = useCallback(
    async (
      content: string,
      files?: ProcessedFile[],
      onSuccess?: (userContent: string, assistantContent: string, filesMeta?: any[]) => Promise<void>
    ) => {
      if (!content.trim() && (!files || files.length === 0)) return;

      // Optimistic UI: Add user message immediately
      const tempUserId = `temp-user-${Date.now()}`;
      const userMessage: Message = {
        $id: tempUserId,
        chatId: chatId || "",
        role: "user",
        content: content,
        files: files?.map((f) => ({
          id: `file-${Date.now()}`,
          name: f.name,
          type: f.type,
          size: f.size,
        })),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingMessage("");
      setToolCalls([]);
      setToolResults([]);

      try {
        // Limit history to 20 messages (10 exchanges)
        const recentMessages = messages.slice(-20);

        // Prepare content for API
        let apiContent: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
        const hasImages = files?.some((f) => f.type.startsWith("image/"));

        if (hasImages) {
          const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          if (content.trim()) {
            contentArray.push({ type: "text", text: content });
          }
          files?.forEach((file) => {
            if (file.type.startsWith("image/") && file.content) {
              contentArray.push({
                type: "image_url",
                image_url: { url: file.content },
              });
            }
          });
          apiContent = contentArray;
        } else {
          let messageContent = content;
          if (files && files.length > 0) {
            const filesContent = files
              .map((file) => formatFileForAI(file))
              .join("\n\n");
            messageContent = filesContent + "\n\n" + content;
          }
          apiContent = messageContent;
        }

        // Prepare messages for API
        const apiMessages = [
          ...recentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user" as const, content: apiContent },
        ];

        // Call API with tools if enabled
        const endpoint = enabledToolkits.length > 0 ? "/api/chat-with-tools" : "/api/chat";

        if (enabledToolkits.length > 0) {
          // Use non-streaming API with tools
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: apiMessages,
              enabledToolkits
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || response.statusText);
          }

          const data = await response.json();

          // Store tool calls and results
          if (data.toolCalls) {
            setToolCalls(data.toolCalls);
          }
          if (data.toolResults) {
            setToolResults(data.toolResults);
          }

          const fullResponse = data.content || "";

          // Add assistant message
          const tempAssistantId = `temp-assistant-${Date.now()}`;
          const assistantMessage: Message = {
            $id: tempAssistantId,
            chatId: chatId || "",
            role: "assistant",
            content: fullResponse,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setLastFailedMessage(null);

          // Call success callback
          if (onSuccess) {
            await onSuccess(
              content,
              fullResponse,
              files?.map((f) => ({
                name: f.name,
                type: f.type,
                size: f.size,
              }))
            );
          }
        } else {
          // Use streaming API without tools
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error || response.statusText;

            if (
              errorMessage.includes("rate limit") ||
              errorMessage.includes("tokens per minute") ||
              errorMessage.includes("TPM")
            ) {
              throw new Error(
                "⏰ Limite de requêtes atteinte. Attends 1 minute ou réduis la taille."
              );
            }

            throw new Error(errorMessage);
          }

          // Stream the response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";

          if (reader) {
            setIsLoading(false);

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              fullResponse += chunk;
              setStreamingMessage(fullResponse);
            }
          }

          // Add assistant message
          const tempAssistantId = `temp-assistant-${Date.now()}`;
          const assistantMessage: Message = {
            $id: tempAssistantId,
            chatId: chatId || "",
            role: "assistant",
            content: fullResponse,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessage("");
          setLastFailedMessage(null);

          // Call success callback
          if (onSuccess) {
            await onSuccess(
              content,
              fullResponse,
              files?.map((f) => ({
                name: f.name,
                type: f.type,
                size: f.size,
              }))
            );
          }
        }
      } catch (error: any) {
        console.error("Chat error:", error);

        // Remove user message from display
        setMessages((prev) => prev.filter((m) => m.$id !== tempUserId));

        // Save for restore
        setLastFailedMessage({ content, files });

        toast.error(error.message || "Erreur lors de l'envoi du message", {
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [chatId, messages, enabledToolkits]
  );

  const skipNextChatLoad = useCallback(() => {
    skipNextLoad.current = true;
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    streamingMessage,
    lastFailedMessage,
    toolCalls,
    toolResults,
    setMessages,
    skipNextChatLoad,
  };
}
