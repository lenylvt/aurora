"use client";

import { type ReactNode, useEffect, useState, useRef, Component } from "react";
import {
  AssistantRuntimeProvider,
  useThread,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { useRouter } from "next/navigation";
import { getCurrentUser, getSessionJWT } from "@/lib/appwrite/client";
import { createChat, createMessage, createOrUpdateMessage } from "@/lib/appwrite/database";
import { PDFAttachmentAdapter } from "@/lib/attachments/pdf-adapter";
import type { User } from "@/types";

// Error Boundary to catch assistant-ui streaming errors
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AssistantErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if it's the tool args streaming error
    if (error.message?.includes("argsText can only be appended")) {
      console.warn("[Assistant] Tool args streaming error caught:", error.message);
      // Don't crash for this specific error - it's a known issue
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log but don't crash for tool args errors
    if (!error.message?.includes("argsText can only be appended")) {
      console.error("[Assistant] Error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Une erreur s'est produite</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset?.();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Appel API pour générer un titre (côté serveur)
async function generateTitle(message: string): Promise<string> {
  try {
    const jwt = await getSessionJWT();
    const res = await fetch("/api/title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) return "Nouvelle conversation";
    const data = await res.json();
    return data.title || "Nouvelle conversation";
  } catch {
    return "Nouvelle conversation";
  }
}

// Extract text content from a message (handles all content types)
function extractMessageContent(msg: any): string {
  // If content is a simple string
  if (typeof msg.content === 'string') {
    return msg.content;
  }

  // If content is an array of parts
  if (Array.isArray(msg.content)) {
    const textParts: string[] = [];

    for (const part of msg.content) {
      if (part.type === 'text' && part.text) {
        textParts.push(part.text);
      } else if (part.type === 'tool-result' && part.result) {
        // Include tool results in the saved content
        const resultText = typeof part.result === 'string'
          ? part.result
          : JSON.stringify(part.result);
        textParts.push(resultText);
      }
    }

    return textParts.join('\n\n');
  }

  // Check if content has a text property directly
  if (msg.content?.text) {
    return msg.content.text;
  }

  return '';
}

// Check if a message is complete and ready to save
function isMessageComplete(msg: any): boolean {
  // User messages are always complete
  if (msg.role === 'user') return true;

  // For assistant messages, check various status indicators
  // assistant-ui uses different status formats
  if (msg.status) {
    // Check for incomplete/streaming states
    const incompleteStates = ['streaming', 'pending', 'running', 'requires-action', 'in_progress'];
    if (incompleteStates.includes(msg.status)) return false;

    // Explicitly complete states
    const completeStates = ['complete', 'done', 'completed', 'ended'];
    if (completeStates.includes(msg.status)) return true;
  }

  // Check if message is being streamed (assistant-ui specific)
  if (msg.isStreaming === true || msg.streaming === true) return false;

  // Check content - must have actual text
  const content = extractMessageContent(msg);
  if (!content || content.length === 0) return false;

  // If content array has tool parts still running, not complete
  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part.type === 'tool-call' && !part.result) {
        return false; // Tool call without result means still running
      }
    }
  }

  return true;
}

interface ChatRuntimeProviderProps {
  children: ReactNode;
  currentChatId?: string | null;
  onChatCreated?: (chatId: string) => void;
}

export function ChatRuntimeProvider({
  children,
  currentChatId,
  onChatCreated
}: ChatRuntimeProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push("/login");
      } else {
        setUser(userData);
      }
    });
  }, [router]);

  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
      credentials: "include",
      async fetch(url, options) {
        const jwt = await getSessionJWT();
        if (!jwt) throw new Error("Session expirée");

        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            "Authorization": `Bearer ${jwt}`,
          },
        });
      },
    }),
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
        new PDFAttachmentAdapter(),
      ]),
    },
  });

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AssistantErrorBoundary onReset={() => router.refresh()}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ChatSyncWrapper
          user={user}
          currentChatId={currentChatId}
          onChatCreated={onChatCreated}
        >
          {children}
        </ChatSyncWrapper>
      </AssistantRuntimeProvider>
    </AssistantErrorBoundary>
  );
}

// Composant interne pour synchroniser avec Appwrite
function ChatSyncWrapper({
  children,
  user,
  currentChatId,
  onChatCreated
}: {
  children: ReactNode;
  user: User;
  currentChatId?: string | null;
  onChatCreated?: (chatId: string) => void;
}) {
  const { messages } = useThread();
  const chatIdRef = useRef<string | null>(currentChatId || null);
  const isSavingRef = useRef(false);
  // Track saved messages with their content to detect updates
  const savedMessagesRef = useRef<Map<string, string>>(new Map());
  // Debounce timer for saving
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when currentChatId changes
  useEffect(() => {
    chatIdRef.current = currentChatId || null;
    savedMessagesRef.current = new Map(); // Reset for new chat
  }, [currentChatId]);

  // Sync messages when they change - with debounce for streaming
  useEffect(() => {
    if (messages.length === 0) return;

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce saving to wait for streaming to complete
    saveTimerRef.current = setTimeout(() => {
      syncMessages();
    }, 500); // Wait 500ms after last message update

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [messages]);

  const syncMessages = async () => {
    if (isSavingRef.current) return;
    if (messages.length === 0) return;

    // Find messages that need to be saved or updated
    const messagesToProcess: Array<{ msg: any; content: string; isNew: boolean }> = [];

    for (const msg of messages) {
      // Only process user and assistant messages
      if (msg.role !== 'user' && msg.role !== 'assistant') continue;

      // For assistant messages, check if complete
      if (msg.role === 'assistant') {
        // Skip if message is still streaming
        // msg.status is an object with a type property in assistant-ui
        if (msg.status?.type === 'running' ||
          msg.status?.type === 'requires-action' ||
          msg.status?.type === 'incomplete') {
          console.log(`[Sync] Skipping incomplete message ${msg.id}`);
          continue;
        }
      }

      // Extract content
      const content = extractMessageContent(msg);
      if (!content || content.trim().length === 0) {
        console.log(`[Sync] Skipping empty message ${msg.id}`);
        continue;
      }

      // Check if this is new or updated
      const savedContent = savedMessagesRef.current.get(msg.id);

      if (!savedContent) {
        // New message
        messagesToProcess.push({ msg, content, isNew: true });
      } else if (savedContent !== content && content.length > savedContent.length) {
        // Content has grown (was saved while still streaming)
        console.log(`[Sync] Message ${msg.id} content grew from ${savedContent.length} to ${content.length} chars`);
        messagesToProcess.push({ msg, content, isNew: false });
      }
    }

    if (messagesToProcess.length === 0) return;

    isSavingRef.current = true;

    try {
      // Create chat on first user message if we don't have a chatId
      if (!chatIdRef.current) {
        const firstUserItem = messagesToProcess.find(item => item.msg.role === "user");
        if (firstUserItem) {
          const chatId = crypto.randomUUID();
          const title = await generateTitle(firstUserItem.content);

          const result = await createChat(user.$id, chatId, title);
          if (result.success) {
            chatIdRef.current = chatId;
            onChatCreated?.(chatId);
            console.log("[Sync] Chat créé:", chatId, title);
          }
        }
      }

      // Save messages using the message ID as document ID for upsert
      if (chatIdRef.current) {
        for (const { msg, content, isNew } of messagesToProcess) {
          // Use createOrUpdateMessage which will update if exists, create if not
          const result = await createOrUpdateMessage(
            chatIdRef.current,
            msg.role,
            content,
            msg.id // Use the thread message ID as the document ID
          );

          if (result.success) {
            savedMessagesRef.current.set(msg.id, content);
            if (isNew) {
              console.log(`[Sync] Saved ${msg.role} message (${content.length} chars):`, content.substring(0, 80) + "...");
            } else {
              console.log(`[Sync] Updated ${msg.role} message (${content.length} chars):`, content.substring(0, 80) + "...");
            }
          } else {
            console.error(`[Sync] Failed to save message:`, result.error);
          }
        }
      }
    } catch (error) {
      console.error("[Sync] Erreur:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  return <>{children}</>;
}

