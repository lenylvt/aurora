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
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Navigation verticale */}
          <div className="w-56 border-r bg-muted/10 p-4 flex flex-col">
            <DialogHeader className="mb-4 px-2">
              <DialogTitle className="text-lg">Paramètres</DialogTitle>
            </DialogHeader>
            <nav className="space-y-1 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-auto">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "connections" && <ConnectionsTab />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
