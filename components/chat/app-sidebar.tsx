"use client";

import * as React from "react";
import { Plus, Trash2, PanelLeft } from "lucide-react";
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
  SidebarGroupContent,
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
      {/* Header avec logo et bouton toggle */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <StarLogo size={18} />
            <span className="text-sm font-semibold">Aurora</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7"
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Scrollable content */}
      <SidebarContent>
        <SidebarGroup className="px-2">
          {/* Bouton nouvelle conversation */}
          <div className="py-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full justify-start h-9 gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle conversation</span>
            </Button>
          </div>

          {/* Liste des conversations */}
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-2">
                  <p className="text-sm text-muted-foreground">
                    Aucune conversation
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <SidebarMenuItem key={chat.$id}>
                    <div className="group/chat-item flex items-center w-full relative">
                      <SidebarMenuButton
                        onClick={() => handleChatClick(chat.$id)}
                        isActive={currentChatId === chat.$id}
                        className="flex-1 h-9 pr-8 group-data-[collapsible=icon]:!p-2"
                        tooltip={chat.title}
                      >
                        <span className="truncate text-sm">
                          {chat.title}
                        </span>
                      </SidebarMenuButton>

                      {/* Delete button - appears on hover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/chat-item:opacity-100 transition-opacity shrink-0 absolute right-1 z-10 hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.$id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
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

      {/* Footer with user - avec safe area pour mobile */}
      <SidebarFooter className="mt-auto border-t border-sidebar-border pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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

      {/* Rail for desktop toggle */}
      <SidebarRail />
    </Sidebar>
  );
}
