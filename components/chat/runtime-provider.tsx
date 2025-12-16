"use client";

import { type ReactNode, useEffect, useState, useRef, Component, useMemo, useCallback } from "react";
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { AssistantChatTransport, useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useRouter } from "next/navigation";
import { getCurrentUser, getSessionJWT } from "@/lib/appwrite/client";
import { createChat, createOrUpdateMessage } from "@/lib/appwrite/database";
import { PDFAttachmentAdapter } from "@/lib/attachments/pdf-adapter";
import type { User, Message } from "@/types";

// Error Boundary
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
    if (error.message?.includes("argsText can only be appended")) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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

// Generate title
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

// Convert Appwrite Message to UIMessage
function convertAppwriteToUIMessage(msg: Message): UIMessage {
  return {
    id: msg.$id,
    role: msg.role,
    parts: [{ type: "text", text: msg.content }],
  };
}

// Extract text from UIMessage
function extractMessageText(msg: UIMessage): string {
  for (const part of msg.parts) {
    if (part.type === "text") {
      return part.text;
    }
  }
  return "";
}

interface ChatRuntimeProviderProps {
  children: ReactNode;
  currentChatId?: string | null;
  initialMessages?: Message[];
  onChatCreated?: (chatId: string) => void;
}

export function ChatRuntimeProvider({
  children,
  currentChatId,
  initialMessages = [],
  onChatCreated
}: ChatRuntimeProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const chatIdRef = useRef<string | null>(currentChatId || null);
  const savedMessagesRef = useRef<Set<string>>(new Set());
  const lastMessageCountRef = useRef(0);

  // Load user
  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push("/login");
      } else {
        setUser(userData);
      }
    });
  }, [router]);

  // Update refs when props change
  useEffect(() => {
    chatIdRef.current = currentChatId || null;
    savedMessagesRef.current.clear();
    initialMessages.forEach(msg => savedMessagesRef.current.add(msg.$id));
    lastMessageCountRef.current = initialMessages.length;
  }, [currentChatId, initialMessages]);

  // Convert initial messages
  const convertedInitialMessages = useMemo(() => {
    return initialMessages.map(convertAppwriteToUIMessage);
  }, [initialMessages]);

  // Create transport with JWT - use AssistantChatTransport which supports custom fetch
  const transport = useMemo(() => {
    return new AssistantChatTransport({
      api: "/api/chat",
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
    });
  }, []);

  // Handle message finish
  const handleFinish = useCallback(async ({ message }: { message: UIMessage }) => {
    if (chatIdRef.current && !savedMessagesRef.current.has(message.id)) {
      const text = extractMessageText(message);
      if (text) {
        const result = await createOrUpdateMessage(
          chatIdRef.current,
          "assistant",
          text,
          message.id
        );
        if (result.success) {
          savedMessagesRef.current.add(message.id);
          console.log("[Sync] Saved assistant message");
        }
      }
    }
  }, []);

  // useChat with transport
  const chat = useChat({
    transport,
    onFinish: handleFinish,
  });

  // Load initial messages after mount using setMessages
  useEffect(() => {
    if (convertedInitialMessages.length > 0 && chat.setMessages) {
      chat.setMessages(convertedInitialMessages);
    }
  }, []); // Run only on mount

  // Create runtime from useChat
  const runtime = useAISDKRuntime(chat, {
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
        new PDFAttachmentAdapter(),
      ]),
    },
  });

  // Sync new user messages to Appwrite
  useEffect(() => {
    const syncNewMessages = async () => {
      if (!user || chat.messages.length <= lastMessageCountRef.current) return;

      for (let i = lastMessageCountRef.current; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (msg.role === "user" && !savedMessagesRef.current.has(msg.id)) {
          const text = extractMessageText(msg);
          if (!text) continue;

          // Create chat if needed
          if (!chatIdRef.current) {
            const chatId = crypto.randomUUID();
            const title = await generateTitle(text);
            const result = await createChat(user.$id, chatId, title);
            if (result.success) {
              chatIdRef.current = chatId;
              onChatCreated?.(chatId);
              console.log("[Sync] Chat créé:", chatId);
            }
          }

          // Save user message
          if (chatIdRef.current) {
            const result = await createOrUpdateMessage(
              chatIdRef.current,
              "user",
              text,
              msg.id
            );
            if (result.success) {
              savedMessagesRef.current.add(msg.id);
              console.log("[Sync] Saved user message");
            }
          }
        }
      }

      lastMessageCountRef.current = chat.messages.length;
    };

    syncNewMessages();
  }, [chat.messages, user, onChatCreated]);

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
        {children}
      </AssistantRuntimeProvider>
    </AssistantErrorBoundary>
  );
}
