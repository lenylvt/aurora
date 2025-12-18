"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2, BookOpen, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/appwrite/client";
import { getAllMiniAppSettings, toggleSidebarVisibility } from "@/lib/appwrite/miniapps/settings";
import { MINI_APPS, type MiniAppId, type MiniAppSettings } from "@/types/miniapps";

export default function MiniAppsTab() {
    const [settings, setSettings] = useState<Record<MiniAppId, MiniAppSettings | null>>({
        "analyse-france": null,
    });
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<MiniAppId | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const user = await getCurrentUser();
            if (!user) return;

            setUserId(user.$id);

            const allSettings = await getAllMiniAppSettings(user.$id);
            const settingsMap: Record<MiniAppId, MiniAppSettings | null> = {
                "analyse-france": null,
            };

            for (const s of allSettings) {
                if (s.miniAppId in settingsMap) {
                    settingsMap[s.miniAppId as MiniAppId] = s;
                }
            }

            setSettings(settingsMap);
        } catch (error) {
            console.error("[MiniAppsTab] Error loading settings:", error);
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSidebar = async (appId: MiniAppId, show: boolean) => {
        if (!userId) return;

        setUpdating(appId);
        try {
            await toggleSidebarVisibility(userId, appId, show);
            setSettings((prev) => ({
                ...prev,
                [appId]: prev[appId]
                    ? { ...prev[appId]!, showInSidebar: show }
                    : { $id: "", userId, miniAppId: appId, enabled: true, showInSidebar: show, hasSeenWelcome: false },
            }));
            toast.success(show ? "Affiché dans la sidebar" : "Masqué de la sidebar");
        } catch (error) {
            console.error("[MiniAppsTab] Error toggling:", error);
            toast.error("Erreur de mise à jour");
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            </div>
        );
    }

    const miniApps = Object.values(MINI_APPS);

    return (
        <div className="mx-auto max-w-lg px-6 py-8 space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold">Mini Apps</h2>
                <p className="text-muted-foreground">
                    Gérez la visibilité des mini applications
                </p>
            </div>

            {/* Mini Apps list */}
            <div className="space-y-3">
                {miniApps.map((app) => {
                    const appSettings = settings[app.id];
                    const showInSidebar = appSettings?.showInSidebar ?? true;
                    const isUpdating = updating === app.id;

                    return (
                        <div
                            key={app.id}
                            className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">{app.name}</p>
                                <p className="text-xs text-muted-foreground">{app.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {showInSidebar ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                                <Switch
                                    checked={showInSidebar}
                                    onCheckedChange={(checked) => handleToggleSidebar(app.id, checked)}
                                    disabled={isUpdating}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
                Les mini apps masquées restent accessibles via le menu de commandes (⌘K)
            </p>
        </div>
    );
}
