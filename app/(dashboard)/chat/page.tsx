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
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function ChatContent() {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
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
    setIsLoadingChats(true);
    const result = await getUserChats(userId);
    if (result.success) {
      setChats(result.chats);
    }
    setIsLoadingChats(false);
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

  // Trouver le titre du chat actuel
  const currentChat = currentChatId
    ? chats.find((c) => c.$id === currentChatId)
    : null;

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
          isLoading={isLoadingChats}
        />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          {/* Header avec trigger et breadcrumb */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {currentChat?.title || "Nouvelle conversation"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Thread assistant-ui - key force le remontage */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatRuntimeProvider
              key={conversationKey}
              currentChatId={currentChatId}
              initialMessages={loadedMessages}
              onChatCreated={handleChatCreated}
            >
              <ErrorBoundary>
                <Thread />
              </ErrorBoundary>
            </ChatRuntimeProvider>
          </div>
        </SidebarInset>
      </ToolkitsProvider>
    </SidebarProvider>
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
