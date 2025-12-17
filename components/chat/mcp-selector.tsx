"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Puzzle, Check, Loader2, ExternalLink, Settings } from "lucide-react";
import { useToolkits } from "./toolkits-provider";
import { SettingsDialog } from "@/components/settings/settings-dialog";

interface Toolkit {
    id: string;
    name: string;
    toolkit: string;
    description: string;
    hasAuthConfig: boolean;
    isConnected: boolean;
    connectionId?: string;
}

interface ComposioSelectorProps {
    className?: string;
}

export function ComposioSelector({ className }: ComposioSelectorProps) {
    const { toolkits, loading, refetch } = useToolkits();
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleConnect = async (toolkit: Toolkit) => {
        if (!toolkit.hasAuthConfig) return;

        setConnectingId(toolkit.id);
        try {
            const jwt = await getSessionJWT();
            const callbackUrl = `${window.location.origin}/api/composio/callback`;

            const response = await fetch("/api/composio/auth/connect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ toolkit: toolkit.toolkit, callbackUrl }),
            });

            const data = await response.json();
            if (data.redirectUrl) {
                // Refetch toolkits before redirect to update cache
                await refetch();
                window.location.href = data.redirectUrl;
            }
        } catch (error) {
            console.error("Error connecting:", error);
        } finally {
            setConnectingId(null);
        }
    };

    // Count available integrations
    const availableCount = toolkits.filter(t => t.isConnected || !t.hasAuthConfig).length;
    const hasAvailable = availableCount > 0;

    if (loading) {
        return (
            <TooltipIconButton
                tooltip="Chargement..."
                side="bottom"
                variant="ghost"
                size="icon"
                disabled
                className={`size-[34px] rounded-full p-1 ${className || ""}`}
            >
                <Loader2 className="size-5 stroke-[1.5px] animate-spin" />
            </TooltipIconButton>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <TooltipIconButton
                    tooltip="Intégrations"
                    side="bottom"
                    variant="ghost"
                    size="icon"
                    className={`size-[34px] rounded-full p-1 hover:bg-muted-foreground/15 dark:hover:bg-muted-foreground/30 ${className || ""}`}
                    aria-label="Intégrations"
                >
                    <Puzzle className={`size-5 stroke-[1.5px] ${hasAvailable ? "text-primary" : "text-muted-foreground"}`} />
                </TooltipIconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between text-xs">
                    Intégrations
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="hover:bg-transparent"
                    >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {toolkits.length === 0 ? (
                    <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                        Aucune intégration configurée
                    </div>
                ) : (
                    toolkits.map((toolkit) => {
                        const isReady = toolkit.isConnected || !toolkit.hasAuthConfig;

                        return (
                            <DropdownMenuItem
                                key={toolkit.id}
                                className="flex items-center justify-between cursor-pointer text-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!isReady && toolkit.hasAuthConfig) {
                                        handleConnect(toolkit);
                                    }
                                }}
                                disabled={connectingId === toolkit.id}
                            >
                                <span className="truncate">{toolkit.name}</span>
                                <span className="ml-2 flex-shrink-0">
                                    {connectingId === toolkit.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : isReady ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </span>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>

            {/* Settings Dialog */}
            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                defaultTab="connections"
            />
        </DropdownMenu>
    );
}

// Keep backward compatible export
export { ComposioSelector as MCPSelector };
