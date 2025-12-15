"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Thread } from "@/components/assistant-ui/thread";
import { ChatRuntimeProvider } from "@/components/chat/runtime-provider";
import { ToolkitsProvider } from "@/components/chat/toolkits-provider";
import { AppSidebar } from "@/components/chat/app-sidebar";
import { getCurrentUser, signOut } from "@/lib/appwrite/client";
import {
  getUserChats,
  deleteChat,
  getChatMessages,
} from "@/lib/appwrite/database";
import type { Chat, User, Message } from "@/types";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function ChatContent() {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  // Clé unique pour forcer le remontage du ChatRuntimeProvider
  const [conversationKey, setConversationKey] = useState<number>(Date.now());

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

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setLoadedMessages([]);
    // Forcer un nouveau provider pour reset le thread
    setConversationKey(Date.now());
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId !== currentChatId) {
      setCurrentChatId(chatId);
      // Charger les messages existants
      const result = await getChatMessages(chatId);
      if (result.success) {
        setLoadedMessages(result.messages);
      } else {
        setLoadedMessages([]);
      }
      // Forcer un nouveau provider pour charger la nouvelle conversation
      setConversationKey(Date.now());
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const result = await deleteChat(chatId);
    if (result.success) {
      setChats((prev) => prev.filter((c) => c.$id !== chatId));
      if (currentChatId === chatId) {
        // Reset to new conversation state
        setCurrentChatId(null);
        setLoadedMessages([]);
        setConversationKey(Date.now());
      }
      toast.success("Conversation supprimée");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleChatCreated = async (chatId: string) => {
    setCurrentChatId(chatId);
    // Recharger la liste des chats
    if (user) {
      await loadChats(user.$id);
    }
  };

  return (
    <SidebarProvider>
      <ToolkitsProvider>
        <AppSidebar
          user={user}
          chats={chats}
          currentChatId={currentChatId || undefined}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onSignOut={handleSignOut}
        />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <SidebarTriggerButton />

          {/* Thread assistant-ui - key force le remontage */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatRuntimeProvider
              key={conversationKey}
              currentChatId={currentChatId}
              onChatCreated={handleChatCreated}
            >
              <ErrorBoundary>
                <Thread loadedMessages={loadedMessages} />
              </ErrorBoundary>
            </ChatRuntimeProvider>
          </div>
        </SidebarInset>
      </ToolkitsProvider>
    </SidebarProvider>
  );
}

// Composant pour le bouton qui ouvre la sidebar
function SidebarTriggerButton() {
  const { toggleSidebar, isMobile, openMobile, open } = useSidebar();

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
