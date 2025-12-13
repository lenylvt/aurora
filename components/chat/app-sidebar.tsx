"use client";

import * as React from "react";
import { Sparkles, Plus, MessageSquare, Trash2, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { Chat, User } from "@/types";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null;
  chats: Chat[];
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onSignOut: () => void;
}

export function AppSidebar({
  user,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onSignOut,
  ...props
}: AppSidebarProps) {
  const { setOpenMobile, isMobile, toggleSidebar } = useSidebar();

  const handleChatClick = (chatId: string) => {
    onChatSelect(chatId);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header avec titre et bouton fermer */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <span className="text-base font-semibold">Aurora</span>

          {/* Bouton fermer/toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isMobile ? "Fermer" : "Toggle sidebar"}
            </span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Contenu scrollable */}
      <SidebarContent>
        <SidebarGroup>
          {/* Bouton nouvelle conversation */}
          <div className="px-2 pb-3 pt-1">
            <Button
              onClick={handleNewChat}
              className="w-full justify-center h-9"
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Nouvelle conversation</span>
            </Button>
          </div>

          {/* Liste des conversations */}
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">
                    Aucune conversation
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Commencez une nouvelle conversation
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <SidebarMenuItem key={chat.$id}>
                    <div className="group/chat-item flex items-center gap-1 w-full relative">
                      <SidebarMenuButton
                        onClick={() => handleChatClick(chat.$id)}
                        isActive={currentChatId === chat.$id}
                        className="flex-1 h-auto py-2.5 pr-9 group-data-[collapsible=icon]:!p-2"
                        tooltip={chat.title}
                      >
                        <MessageSquare className="!size-4 shrink-0" />
                        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                          <span className="truncate text-sm font-medium leading-tight">
                            {chat.title}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {new Date(chat.updatedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: new Date(chat.updatedAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                            })}
                          </span>
                        </div>
                      </SidebarMenuButton>

                      {/* Bouton supprimer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover/chat-item:opacity-100 transition-opacity shrink-0 absolute right-1 z-10 bg-sidebar hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.$id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer avec user */}
      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        {user && (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            }}
            onSignOut={onSignOut}
          />
        )}
      </SidebarFooter>

      {/* Rail pour toggle sur desktop (zone de drag) */}
      <SidebarRail />
    </Sidebar>
  );
}
