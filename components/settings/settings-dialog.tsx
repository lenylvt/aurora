"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { User, Link2 } from "lucide-react";
import ConnectionsTab from "./connections-tab";
import ProfileTab from "./profile-tab";

type Tab = "profile" | "connections";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: Tab;
}

export function SettingsDialog({ open, onOpenChange, defaultTab = "profile" }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Réinitialiser l'onglet actif quand le dialog s'ouvre avec un nouveau defaultTab
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const tabs = [
    { id: "profile" as Tab, label: "Profil", icon: User },
    { id: "connections" as Tab, label: "Connexions", icon: Link2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] h-[85vh] max-h-[650px] p-0 gap-0 flex flex-col bg-background rounded-2xl overflow-hidden">
        {/* Header avec titre pour accessibilité */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Paramètres</DialogTitle>
        </DialogHeader>

        {/* Navigation style chat - tabs horizontaux simples */}
        <nav className="flex gap-1 px-6 py-3 border-b bg-muted/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Contenu avec animation */}
        <div className="flex-1 overflow-auto">
          <div className={cn(
            "fade-in animate-in duration-200",
            activeTab === "profile" ? "block" : "hidden"
          )}>
            <ProfileTab />
          </div>
          <div className={cn(
            "fade-in animate-in duration-200",
            activeTab === "connections" ? "block" : "hidden"
          )}>
            <ConnectionsTab />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
