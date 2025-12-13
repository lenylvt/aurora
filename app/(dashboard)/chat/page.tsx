"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { useChat } from "@/hooks/useChat";
import { getCurrentUser } from "@/lib/appwrite/client";
import { signOut } from "@/lib/appwrite/client";
import {
  createChat,
  getUserChats,
  deleteChat,
  createMessage,
} from "@/lib/appwrite/database";
import type { Chat, User } from "@/types";
import { toast } from "sonner";
import type { ProcessedFile } from "@/lib/files/processor";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function getGreeting() {
  // Éviter l'hydration error en retournant un message générique
  return "Bonjour";
}

function ChatContent() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [greeting] = useState(getGreeting());
  const { messages, sendMessage, isLoading, streamingMessage, lastFailedMessage, skipNextChatLoad } =
    useChat(currentChatId);

  useEffect(() => {
    getCurrentUser().then((userData) => {
      if (!userData) {
        router.push("/login");
      } else {
        setUser(userData);
        loadChats(userData.$id);
      }
    });
  }, [router]);

  const loadChats = async (userId: string) => {
    const result = await getUserChats(userId);
    if (result.success) {
      setChats(result.chats);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Smooth scroll to bottom
      setTimeout(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [messages.length, streamingMessage]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    const result = await deleteChat(chatId);
    if (result.success) {
      setChats((prev) => prev.filter((c) => c.$id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      toast.success("Conversation supprimée");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSendMessage = async (content: string, files?: ProcessedFile[]) => {
    if (!user) return;

    let activeChatId = currentChatId;
    let isNewChat = !activeChatId;

    // Créer un nouveau chat si nécessaire
    if (isNewChat) {
      // Envoyer d'abord le message optimistiquement
      await sendMessage(content, files, async (userContent, assistantContent, filesMeta) => {
        // Créer le chat après avoir affiché les messages
        let title = content.slice(0, 50) + (content.length > 50 ? "..." : "");

        try {
          const titleResponse = await fetch("/api/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            if (titleData.title) {
              title = titleData.title;
            }
          }
        } catch (error) {
          console.error("Failed to generate title:", error);
        }

        const result = await createChat(user.$id, title);

        if (!result.success || !result.chat) {
          toast.error("Erreur lors de la création");
          return;
        }

        const newChatId = result.chat.$id;

        // Sauvegarder les messages en arrière-plan
        try {
          await createMessage(newChatId, "user", userContent, filesMeta);
          await createMessage(newChatId, "assistant", assistantContent);

          // Mettre à jour l'état après sauvegarde
          // Skip le prochain load car on a déjà les messages en mémoire
          skipNextChatLoad();
          setCurrentChatId(newChatId);
          setChats((prev) => [result.chat as unknown as Chat, ...prev]);
        } catch (error) {
          console.error("Failed to save messages:", error);
        }
      });
    } else {
      // Chat existant - comportement normal
      await sendMessage(content, files, async (userContent, assistantContent, filesMeta) => {
        if (!activeChatId) return;

        // Sauvegarder en arrière-plan
        try {
          await createMessage(activeChatId, "user", userContent, filesMeta);
          await createMessage(activeChatId, "assistant", assistantContent);

          setChats((prev) =>
            prev.map((c) =>
              c.$id === activeChatId
                ? { ...c, updatedAt: new Date().toISOString() }
                : c
            )
          );
        } catch (error) {
          console.error("Failed to save messages:", error);
        }
      });
    }
  };

  return (
    <SidebarProvider>
      <AutoCloseSidebar messageCount={messages.length} />
      <AppSidebar
        user={user}
        chats={chats}
        currentChatId={currentChatId || undefined}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onSignOut={handleSignOut}
      />
      <SidebarInset className="flex flex-col">
        {/* Bouton flottant pour ouvrir sidebar */}
        <SidebarTriggerButton />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="py-8 px-4 space-y-4 max-w-3xl mx-auto pb-32">
            {messages.length === 0 && !streamingMessage && (
              <div className="flex h-[70vh] items-center justify-center">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-bold">{greeting}</h1>
                  <p className="text-muted-foreground">
                    Comment puis-je t'aider ?
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.$id} message={message} />
            ))}

            {streamingMessage && (
              <ChatMessage
                message={{
                  $id: "streaming",
                  chatId: "",
                  role: "assistant",
                  content: streamingMessage,
                  createdAt: new Date().toISOString(),
                }}
              />
            )}

            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/40" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input fixe en bas */}
        <div className="sticky bottom-0 w-full p-4 bg-gradient-to-t from-background via-background to-background/0 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading}
              lastFailedMessage={lastFailedMessage}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Composant pour fermer automatiquement la sidebar quand la conversation commence
function AutoCloseSidebar({ messageCount }: { messageCount: number }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const hasClosedRef = useRef(false);

  useEffect(() => {
    // Fermer uniquement la première fois qu'il y a des messages
    if (messageCount > 0 && !hasClosedRef.current) {
      hasClosedRef.current = true;
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    }
    // Réinitialiser quand il n'y a plus de messages
    if (messageCount === 0) {
      hasClosedRef.current = false;
    }
  }, [messageCount, isMobile, setOpen, setOpenMobile]);

  return null;
}

// Composant pour le bouton qui ouvre la sidebar
function SidebarTriggerButton() {
  const { toggleSidebar, isMobile, openMobile, open } = useSidebar();

  // Sur mobile : afficher seulement si fermée
  // Sur desktop : afficher seulement si fermée
  const shouldShow = isMobile ? !openMobile : !open;

  if (!shouldShow) return null;

  return (
    <div className="fixed top-4 left-4 z-40">
      <Button
        onClick={toggleSidebar}
        size="icon"
        className={
          isMobile
            ? "h-10 w-10 bg-background/60 backdrop-blur-md hover:bg-background/80 shadow-sm border border-border/40"
            : "h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm border"
        }
        variant="ghost"
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Ouvrir le menu</span>
      </Button>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
