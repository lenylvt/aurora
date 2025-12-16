"use client";

import * as React from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  PlusCircleIcon,
  MessageSquareIcon,
  UserIcon,
  LinkIcon,
} from "lucide-react";
import type { Chat } from "@/types";

interface CommandMenuProps {
  chats: Chat[];
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  onOpenSettings: (tab: "profile" | "connections") => void;
}

export function CommandMenu({
  chats,
  onNewChat,
  onChatSelect,
  onOpenSettings,
}: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNewChat = () => {
    onNewChat();
    setOpen(false);
  };

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    setOpen(false);
  };

  const handleOpenSettings = (tab: "profile" | "connections") => {
    onOpenSettings(tab);
    setOpen(false);
  };

  // Prendre les 5 chats les plus récents
  const recentChats = chats.slice(0, 5);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une commande..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleNewChat}>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            <span>Nouvelle conversation</span>
          </CommandItem>
        </CommandGroup>

        {recentChats.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Conversations récentes">
              {recentChats.map((chat) => (
                <CommandItem
                  key={chat.$id}
                  onSelect={() => handleChatSelect(chat.$id)}
                >
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Paramètres">
          <CommandItem onSelect={() => handleOpenSettings("connections")}>
            <LinkIcon className="mr-2 h-4 w-4" />
            <span>Connexions</span>
          </CommandItem>
          <CommandItem onSelect={() => handleOpenSettings("profile")}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
