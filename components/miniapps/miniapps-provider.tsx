"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { MiniAppId, MiniAppSettings } from "@/types/miniapps";
import { getAllMiniAppSettings, upsertMiniAppSettings, markWelcomeSeen } from "@/lib/appwrite/miniapps";
import { getCurrentUser } from "@/lib/appwrite/client";

export type MiniAppView = "main" | "progress";

interface MiniAppsContextType {
    // Current active mini app (null = main chat)
    activeMiniApp: MiniAppId | null;
    setActiveMiniApp: (id: MiniAppId | null) => void;

    // Current view within the mini app
    currentView: MiniAppView;
    setCurrentView: (view: MiniAppView) => void;

    // User settings per mini app
    settings: Record<MiniAppId, MiniAppSettings | null>;

    // Actions
    openMiniApp: (id: MiniAppId) => Promise<void>;
    closeMiniApp: () => void;
    toggleSidebar: (id: MiniAppId, show: boolean) => Promise<void>;

    // Welcome popup state
    showWelcomeFor: MiniAppId | null;
    dismissWelcome: () => void;

    // Loading state
    isLoading: boolean;
}

const MiniAppsContext = createContext<MiniAppsContextType | null>(null);

export function useMiniApps() {
    const context = useContext(MiniAppsContext);
    if (!context) {
        throw new Error("useMiniApps must be used within MiniAppsProvider");
    }
    return context;
}

interface MiniAppsProviderProps {
    children: React.ReactNode;
}

export function MiniAppsProvider({ children }: MiniAppsProviderProps) {
    const [activeMiniApp, setActiveMiniApp] = useState<MiniAppId | null>(null);
    const [currentView, setCurrentView] = useState<MiniAppView>("main");
    const [settings, setSettings] = useState<Record<MiniAppId, MiniAppSettings | null>>({
        "analyse-france": null,
        "code": null,
    });
    const [showWelcomeFor, setShowWelcomeFor] = useState<MiniAppId | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Load user settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                setUserId(user.$id);

                const allSettings = await getAllMiniAppSettings(user.$id);
                const settingsMap: Record<MiniAppId, MiniAppSettings | null> = {
                    "analyse-france": null,
                    "code": null,
                };

                for (const s of allSettings) {
                    if (s.miniAppId in settingsMap) {
                        settingsMap[s.miniAppId as MiniAppId] = s;
                    }
                }

                setSettings(settingsMap);
            } catch (error) {
                console.error("[MiniApps] Error loading settings:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadSettings();
    }, []);

    const openMiniApp = useCallback(async (id: MiniAppId) => {
        if (!userId) return;

        const currentSettings = settings[id];

        // Check if user has seen welcome
        if (!currentSettings?.hasSeenWelcome) {
            // Show welcome popup
            setShowWelcomeFor(id);

            // Create settings if they don't exist
            const newSettings = await upsertMiniAppSettings(userId, id, {
                enabled: true,
                showInSidebar: true,
                hasSeenWelcome: false,
            });

            if (newSettings) {
                setSettings((prev) => ({ ...prev, [id]: newSettings }));
            }
        } else {
            // Open directly
            setActiveMiniApp(id);
            setCurrentView("main");
        }
    }, [userId, settings]);

    const closeMiniApp = useCallback(() => {
        setActiveMiniApp(null);
        setCurrentView("main");
    }, []);

    const dismissWelcome = useCallback(async () => {
        const id = showWelcomeFor;
        setShowWelcomeFor(null);

        if (id && userId) {
            // Mark welcome as seen and open the app
            await markWelcomeSeen(userId, id);

            setSettings((prev) => ({
                ...prev,
                [id]: prev[id] ? { ...prev[id]!, hasSeenWelcome: true } : null,
            }));

            setActiveMiniApp(id);
            setCurrentView("main");
        }
    }, [showWelcomeFor, userId]);

    const toggleSidebar = useCallback(async (id: MiniAppId, show: boolean) => {
        if (!userId) return;

        const updated = await upsertMiniAppSettings(userId, id, { showInSidebar: show });
        if (updated) {
            setSettings((prev) => ({ ...prev, [id]: updated }));
        }
    }, [userId]);

    return (
        <MiniAppsContext.Provider
            value={{
                activeMiniApp,
                setActiveMiniApp,
                currentView,
                setCurrentView,
                settings,
                openMiniApp,
                closeMiniApp,
                toggleSidebar,
                showWelcomeFor,
                dismissWelcome,
                isLoading,
            }}
        >
            {children}
        </MiniAppsContext.Provider>
    );
}
