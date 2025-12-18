"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Thread } from "@/components/assistant-ui/thread";
import { ChatRuntimeProvider } from "@/components/chat/runtime-provider";
import { SpecialtyProvider, useSpecialty } from "@/components/chat/specialty-provider";
import { SpecialtySelector } from "@/components/chat/specialty-selector";
import { ToolkitsProvider } from "@/components/chat/toolkits-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/chat/command-menu";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { getCurrentUser, signOut } from "@/lib/appwrite/client";
import {
  getUserChats,
  deleteChat,
  getChatMessages,
} from "@/lib/appwrite/database";
import type { Chat, User, Message } from "@/types";
import { MINI_APPS } from "@/types/miniapps";
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
import { MiniAppsProvider, WelcomePopup, useMiniApps } from "@/components/miniapps";
import AnalyseFrance from "@/components/miniapps/analyse-france";

function HomeContentInner() {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [conversationKey, setConversationKey] = useState<number>(Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "connections">("profile");

  // Mini Apps context
  const { activeMiniApp, openMiniApp } = useMiniApps();
  const activeMiniAppConfig = activeMiniApp ? MINI_APPS[activeMiniApp] : null;

  // Use the specialty context
  const { activeSpecialty } = useSpecialty();

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
    setConversationKey(Date.now());
  };

  const handleChatSelect = async (chatId: string) => {
    if (chatId !== currentChatId) {
      setCurrentChatId(chatId);
      const result = await getChatMessages(chatId);
      if (result.success) {
        setLoadedMessages(result.messages);
      } else {
        setLoadedMessages([]);
      }
      setConversationKey(Date.now());
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const result = await deleteChat(chatId);
    if (result.success) {
      setChats((prev) => prev.filter((c) => c.$id !== chatId));
      if (currentChatId === chatId) {
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
    if (user) {
      await loadChats(user.$id);
    }
  };

  const handleOpenSettings = (tab: "profile" | "connections") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const currentChat = currentChatId
    ? chats.find((c) => c.$id === currentChatId)
    : null;

  const shouldHideSelector = currentChatId !== null && !activeSpecialty;

  // Determine header title
  const headerTitle = activeMiniAppConfig
    ? activeMiniAppConfig.name
    : currentChat?.title || "Nouvelle conversation";

  return (
    <ToolkitsProvider>
      <CommandMenu
        chats={chats}
        onNewChat={handleNewChat}
        onChatSelect={handleChatSelect}
        onOpenSettings={handleOpenSettings}
        onOpenMiniApp={openMiniApp}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultTab={settingsTab}
      />
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
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center w-full gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{headerTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main content - switches between chat and mini app */}
        {activeMiniApp === "analyse-france" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnalyseFrance />
          </div>
        ) : (
          <>
            {/* Floating specialty selector under header */}
            <div className="relative">
              <SpecialtySelector
                hidden={shouldHideSelector}
                className="absolute left-4 top-2 z-10"
              />
            </div>

            {/* Thread */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatRuntimeProvider
                key={conversationKey}
                currentChatId={currentChatId}
                initialMessages={loadedMessages}
                onChatCreated={handleChatCreated}
              >
                <ErrorBoundary>
                  <Thread userName={user?.name} />
                </ErrorBoundary>
              </ChatRuntimeProvider>
            </div>
          </>
        )}
      </SidebarInset>
    </ToolkitsProvider>
  );
}

function HomeContent() {
  return (
    <SpecialtyProvider>
      <SidebarProvider>
        <MiniAppsProvider>
          <WelcomePopup />
          <HomeContentInner />
        </MiniAppsProvider>
      </SidebarProvider>
    </SpecialtyProvider>
  );
}

export default function HomePage() {
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
      <HomeContent />
    </Suspense>
  );
}
