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
      <DialogContent className="max-w-3xl w-[95vw] h-[550px] p-0 gap-0 flex flex-col rounded-2xl overflow-hidden">
        {/* Header avec titre */}
        <DialogHeader className="p-4 pb-2 shrink-0">
          <DialogTitle className="text-lg">Paramètres</DialogTitle>
        </DialogHeader>

        {/* Navigation horizontale sur mobile, verticale sur desktop */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Navigation */}
          <nav className="flex sm:flex-col gap-1 p-2 sm:p-4 sm:w-48 border-b sm:border-b-0 sm:border-r bg-muted/10 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center sm:justify-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors flex-1 sm:flex-none",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Contenu - les deux onglets sont montés mais un seul visible */}
          <div className="flex-1 overflow-auto relative">
            <div className={activeTab === "profile" ? "block" : "hidden"}>
              <ProfileTab />
            </div>
            <div className={activeTab === "connections" ? "block" : "hidden"}>
              <ConnectionsTab />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
