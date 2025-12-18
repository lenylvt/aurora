"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  MessageSquare,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Code2,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { StarLogo } from "@/components/ui/star-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { Chat, User } from "@/types";
import { MINI_APPS, type MiniAppId } from "@/types/miniapps";
import { useMiniApps, AnalyseFranceSidebar, CodeSidebar } from "@/components/miniapps";

// Animation variants for sidebar content transitions
const slideVariants = {
  enterFromRight: {
    x: 30,
    opacity: 0,
  },
  enterFromLeft: {
    x: -30,
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exitToLeft: {
    x: -30,
    opacity: 0,
  },
  exitToRight: {
    x: 30,
    opacity: 0,
  },
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null;
  chats: Chat[];
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onSignOut: () => void;
  isLoading?: boolean;
}

export function AppSidebar({
  user,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onSignOut,
  isLoading = false,
  ...props
}: AppSidebarProps) {
  const { setOpenMobile, isMobile } = useSidebar();

  // Mini Apps integration
  let miniAppsContext;
  try {
    miniAppsContext = useMiniApps();
  } catch {
    miniAppsContext = null;
  }

  const activeMiniApp = miniAppsContext?.activeMiniApp || null;
  const activeMiniAppConfig = activeMiniApp ? MINI_APPS[activeMiniApp] : null;
  const isMiniAppMode = !!(activeMiniApp && activeMiniAppConfig);

  const handleChatClick = (chatId: string) => {
    onChatSelect(chatId);
    if (isMobile) setOpenMobile(false);
  };

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) setOpenMobile(false);
  };

  const handleMiniAppClick = async (id: MiniAppId) => {
    if (miniAppsContext) {
      await miniAppsContext.openMiniApp(id);
      if (isMobile) setOpenMobile(false);
    }
  };

  const handleCloseMiniApp = () => {
    if (miniAppsContext) {
      miniAppsContext.closeMiniApp();
    }
  };

  // Get visible mini apps
  const visibleMiniApps = Object.values(MINI_APPS).filter((app) => {
    if (!miniAppsContext) return true;
    const settings = miniAppsContext.settings[app.id];
    return !settings || settings.showInSidebar;
  });

  // Get icon for mini app
  const getMiniAppIcon = (id: MiniAppId) => {
    switch (id) {
      case "code":
        return <Code2 className="h-4 w-4" />;
      case "analyse-france":
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/home" prefetch>
                <StarLogo size={20} />
                <span className="truncate font-semibold">Aurora</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isMiniAppMode ? (
            <motion.div
              key="miniapp"
              initial="enterFromRight"
              animate="center"
              exit="exitToRight"
              variants={slideVariants}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Back button */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <Button
                    onClick={handleCloseMiniApp}
                    variant="ghost"
                    className="w-full justify-start h-9 gap-2 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour au chat</span>
                  </Button>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Dynamic sidebar content per mini app */}
              {activeMiniApp === "analyse-france" && <AnalyseFranceSidebar />}
              {activeMiniApp === "code" && <CodeSidebar />}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial="enterFromLeft"
              animate="center"
              exit="exitToLeft"
              variants={slideVariants}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* New chat button */}
              <SidebarGroup>
                <SidebarGroupContent>
                  <Button
                    onClick={handleNewChat}
                    variant="outline"
                    className="w-full justify-start h-9 gap-2 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouveau Chat</span>
                    <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
                  </Button>

                  {/* Mini Apps buttons */}
                  {visibleMiniApps.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {visibleMiniApps.map((app) => (
                        <Button
                          key={app.id}
                          variant="ghost"
                          onClick={() => handleMiniAppClick(app.id)}
                          className="w-full justify-start h-9 gap-2 font-medium text-muted-foreground hover:text-foreground"
                        >
                          {getMiniAppIcon(app.id)}
                          <span>{app.name}</span>
                          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      ))}
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Conversations list */}
              <SidebarGroup className="flex-1">
                <SidebarGroupLabel>Conversations</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {isLoading ? (
                      <>
                        <SidebarMenuItem>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                      </>
                    ) : chats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-2">
                        <p className="text-sm text-muted-foreground">
                          Aucune conversation
                        </p>
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <SidebarMenuItem key={chat.$id}>
                          <div
                            className="group/chat-item flex items-center w-full relative"
                            data-chat-id={chat.$id}
                          >
                            <SidebarMenuButton
                              onClick={() => handleChatClick(chat.$id)}
                              isActive={currentChatId === chat.$id}
                              className="flex-1 pr-8 data-[active=true]:bg-sidebar-accent/50 hover:bg-sidebar-accent/30"
                              tooltip={`${chat.title} (${chat.$id.slice(-4)})`}
                            >
                              <MessageSquare className="h-4 w-4 shrink-0" />
                              <span className="truncate">{chat.title}</span>
                            </SidebarMenuButton>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover/chat-item:opacity-60 hover:opacity-100 transition-opacity shrink-0 absolute right-1 z-10 hover:bg-sidebar-accent/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.$id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              <span className="sr-only">Supprimer {chat.title}</span>
                            </Button>
                          </div>
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarContent>

      <SidebarFooter className="mb-2 pb-[max(0rem,var(--sab))]">
        {user ? (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              labels: user.labels,
            }}
            onSignOut={onSignOut}
          />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
