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
import { PreviewLinkUI, ShowMediaUI } from "@/components/assistant-ui/preview-link-ui";
import { ShowChartUI } from "@/components/assistant-ui/show-chart-ui";
import { ShowTableUI } from "@/components/assistant-ui/show-table-ui";
import { ShowCodeUI } from "@/components/assistant-ui/show-code-ui";
import { ShowOptionsUI } from "@/components/assistant-ui/show-options-ui";
import { TraduireUI, SynonymesUI, ConjugaisonUI, AntonymesUI } from "@/components/assistant-ui/reverso-ui";
import { useSpecialty } from "./specialty-provider";



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
  console.log(`[Runtime Provider] generateTitle called at ${new Date().toISOString()}`);
  console.log(`[Runtime Provider] Message preview: "${message.slice(0, 50)}..."`);

  try {
    const jwt = await getSessionJWT();
    console.log(`[Runtime Provider] Sending title request...`);
    const res = await fetch("/api/title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      console.log(`[Runtime Provider] Title request failed: ${res.status}`);
      return "Nouvelle conversation";
    }
    const data = await res.json();
    console.log(`[Runtime Provider] ✓ Title generated: "${data.title}"`);
    return data.title || "Nouvelle conversation";
  } catch (error: any) {
    console.log(`[Runtime Provider] Title generation error: ${error.message}`);
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
    console.log(`[Runtime Provider] Loading user...`);
    getCurrentUser().then((userData) => {
      if (!userData) {
        console.log(`[Runtime Provider] No user found, redirecting to login`);
        router.push("/login");
      } else {
        console.log(`[Runtime Provider] ✓ User loaded: ${userData.$id} (${userData.email})`);
        setUser(userData);
      }
    });
  }, [router]);

  // Update refs when props change
  useEffect(() => {
    console.log(`[Runtime Provider] Props changed - chatId: ${currentChatId}, initialMessages: ${initialMessages.length}`);
    chatIdRef.current = currentChatId || null;
    savedMessagesRef.current.clear();
    initialMessages.forEach(msg => savedMessagesRef.current.add(msg.$id));
    lastMessageCountRef.current = initialMessages.length;
  }, [currentChatId, initialMessages]);

  // Convert initial messages
  const convertedInitialMessages = useMemo(() => {
    return initialMessages.map(convertAppwriteToUIMessage);
  }, [initialMessages]);

  // Get specialty from context
  const { activeSpecialty } = useSpecialty();

  // Create transport with JWT - use AssistantChatTransport which supports custom fetch
  const transport = useMemo(() => {
    console.log(`[Runtime Provider] Creating transport...`);
    return new AssistantChatTransport({
      api: "/api/chat",
      async fetch(url, options) {
        console.log(`[Runtime Provider] Transport fetch: ${url}`);
        const jwt = await getSessionJWT();
        if (!jwt) {
          console.log(`[Runtime Provider] ❌ No JWT available`);
          throw new Error("Session expirée");
        }
        console.log(`[Runtime Provider] ✓ JWT ready, sending request...`);

        // Parse and modify body to include specialty
        let body = options?.body;
        if (body && typeof body === 'string') {
          try {
            const parsed = JSON.parse(body);
            parsed.specialty = activeSpecialty;
            body = JSON.stringify(parsed);
            console.log(`[Runtime Provider] Added specialty to request: ${activeSpecialty || 'none'}`);
          } catch (e) {
            console.warn(`[Runtime Provider] Failed to parse body for specialty injection`);
          }
        }

        return fetch(url, {
          ...options,
          body,
          headers: {
            ...options?.headers,
            "Authorization": `Bearer ${jwt}`,
          },
        });
      },
    });
  }, [activeSpecialty]);

  // Handle message finish
  const handleFinish = useCallback(async ({ message }: { message: UIMessage }) => {
    console.log(`[Runtime Provider] handleFinish called for message: ${message.id}`);
    if (chatIdRef.current && !savedMessagesRef.current.has(message.id)) {
      const text = extractMessageText(message);
      if (text) {
        console.log(`[Runtime Provider] Saving assistant message (${text.length} chars)...`);
        const result = await createOrUpdateMessage(
          chatIdRef.current,
          "assistant",
          text,
          message.id
        );
        if (result.success) {
          savedMessagesRef.current.add(message.id);
          console.log(`[Runtime Provider] ✓ Assistant message saved`);
        } else {
          console.log(`[Runtime Provider] ❌ Failed to save assistant message`);
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

  // Guard to prevent duplicate chat creation
  const creatingChatRef = useRef(false);

  // Sync new user messages to Appwrite
  useEffect(() => {
    const syncNewMessages = async () => {
      if (!user || chat.messages.length <= lastMessageCountRef.current) return;

      console.log(`[Runtime Provider] Syncing new messages: ${lastMessageCountRef.current} -> ${chat.messages.length}`);

      for (let i = lastMessageCountRef.current; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (msg.role === "user" && !savedMessagesRef.current.has(msg.id)) {
          const text = extractMessageText(msg);
          if (!text) continue;

          // Create chat if needed (with guard to prevent duplicates)
          if (!chatIdRef.current && !creatingChatRef.current) {
            creatingChatRef.current = true;
            console.log(`[Runtime Provider] Creating new chat...`);
            const chatId = crypto.randomUUID();
            const title = await generateTitle(text);
            const result = await createChat(user.$id, chatId, title);
            if (result.success) {
              chatIdRef.current = chatId;
              onChatCreated?.(chatId);
              creatingChatRef.current = false; // Reset after successful creation
              console.log(`[Runtime Provider] ✓ Chat created: ${chatId}`);
            } else {
              console.log(`[Runtime Provider] ❌ Failed to create chat`);
              creatingChatRef.current = false; // Reset on failure to allow retry
            }
          }

          // Wait if chat is being created
          if (creatingChatRef.current && !chatIdRef.current) {
            console.log(`[Runtime Provider] Waiting for chat creation to complete...`);
            continue; // Skip this iteration, will be handled next time
          }

          // Save user message
          if (chatIdRef.current) {
            console.log(`[Runtime Provider] Saving user message (${text.length} chars)...`);
            const result = await createOrUpdateMessage(
              chatIdRef.current,
              "user",
              text,
              msg.id
            );
            if (result.success) {
              savedMessagesRef.current.add(msg.id);
              console.log(`[Runtime Provider] ✓ User message saved`);
            } else {
              console.log(`[Runtime Provider] ❌ Failed to save user message`);
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
        {/* Tool UIs - must be mounted under AssistantRuntimeProvider */}
        <PreviewLinkUI />
        <ShowMediaUI />
        <ShowChartUI />
        <ShowTableUI />
        <ShowCodeUI />
        <ShowOptionsUI />
        <TraduireUI />
        <SynonymesUI />
        <ConjugaisonUI />
        <AntonymesUI />
        {children}
      </AssistantRuntimeProvider>
    </AssistantErrorBoundary>
  );
}
