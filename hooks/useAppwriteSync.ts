"use client";

import { useEffect, useRef } from "react";
import { useThread } from "@assistant-ui/react";
import { createChat, getChatMessages } from "@/lib/appwrite/database";
import type { User } from "@/types";

export function useAppwriteSync(user: User | null, currentChatId: string | null) {
  const { messages } = useThread();
  const lastMessageCountRef = useRef(0);

  // Sync messages to Appwrite when they change
  useEffect(() => {
    if (!user || messages.length === 0) return;

    // Only sync if we have new messages (not on initial load)
    if (messages.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = messages.length;

      // Create chat on first message if no currentChatId
      if (!currentChatId && messages.length === 1) {
        const threadId = messages[0]?.id || crypto.randomUUID();
        createChat(user.$id, threadId).then((result) => {
          if (result.success) {
            console.log("Chat created:", result.chat);
          }
        });
      }
    }
  }, [messages, user, currentChatId]);

  // Load messages from Appwrite when chatId changes
  useEffect(() => {
    if (!currentChatId) {
      lastMessageCountRef.current = 0;
      return;
    }

    getChatMessages(currentChatId).then((result) => {
      if (result.success && result.messages.length > 0) {
        lastMessageCountRef.current = result.messages.length;
        // TODO: Implement message loading into runtime
        console.log("Loaded messages:", result.messages);
      }
    });
  }, [currentChatId]);
}
