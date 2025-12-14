"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Message } from "@/types";
import type { ProcessedFile } from "@/lib/files/processor";
import { formatFileForAI } from "@/lib/files/processor";
import { createMessage, getChatMessages } from "@/lib/appwrite/database";
import { getSessionJWT } from "@/lib/appwrite/client";

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    content: string;
    files?: ProcessedFile[];
  } | null>(null);
  const skipNextLoad = useRef(false);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      // Skip loading if we just created a new chat with messages
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
      onSuccess?: (
        userContent: string,
        assistantContent: string,
        filesMeta?: any[],
      ) => Promise<void>,
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

      try {
        // Limiter l'historique à 20 messages (10 échanges)
        const recentMessages = messages.slice(-20);

        // Préparer le contenu pour l'API
        let apiContent:
          | string
          | Array<{ type: string; text?: string; image_url?: { url: string } }>;
        const hasImages = files?.some((f) => f.type.startsWith("image/"));

        if (hasImages) {
          const contentArray: Array<{
            type: string;
            text?: string;
            image_url?: { url: string };
          }> = [];
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

        // Get JWT token for authentication
        const jwt = await getSessionJWT();
        if (!jwt) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }

        // Call API with automatic tool detection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch("/api/chat", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || response.statusText;

          if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("tokens per minute") ||
            errorMessage.includes("TPM")
          ) {
            throw new Error(
              "⏰ Limite de requêtes atteinte. Attends 1 minute ou réduis la taille.",
            );
          }

          throw new Error(errorMessage);
        }

        // Lire le stream de réponse
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (reader) {
          setIsLoading(false);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
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

        // Call success callback for saving messages
        if (onSuccess) {
          await onSuccess(
            content,
            fullResponse,
            files?.map((f) => ({
              name: f.name,
              type: f.type,
              size: f.size,
            })),
          );
        }
      } catch (error: any) {
        console.error("Chat error:", error);

        // Retirer le message utilisateur de l'affichage
        setMessages((prev) => prev.filter((m) => m.$id !== tempUserId));

        // Sauvegarder pour restaurer
        setLastFailedMessage({ content, files });

        // Messages d'erreur plus clairs
        let errorMessage = "Erreur lors de l'envoi du message";

        if (error.name === "AbortError") {
          errorMessage = "⏱️ La requête a pris trop de temps. Réessayez.";
        } else if (error.message?.includes("Session expirée")) {
          errorMessage = error.message;
        } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
          errorMessage = "🌐 Problème de connexion. Vérifiez votre réseau.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage, {
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
        setStreamingMessage("");
      }
    },
    [chatId, messages],
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
    setMessages,
    skipNextChatLoad,
  };
}
