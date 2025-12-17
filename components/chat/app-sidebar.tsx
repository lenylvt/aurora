"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, MessageSquare } from "lucide-react";
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
    <Sidebar variant="inset" {...props}>
      {/* Header avec logo - compact */}
      <SidebarHeader className="py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/chat" prefetch>
                <StarLogo size={20} />
                <span className="truncate font-semibold">Aurora</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Scrollable content */}
      <SidebarContent>
        {/* Bouton nouvelle conversation */}
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
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Liste des conversations */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                // Skeleton loading state
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

                      {/* Delete button - appears on hover */}
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
      </SidebarContent>

      {/* Footer with user - avec safe area pour mobile */}
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
