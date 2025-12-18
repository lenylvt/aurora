"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMiniApps } from "./miniapps-provider";
import { MINI_APPS } from "@/types/miniapps";

export function WelcomePopup() {
    const { showWelcomeFor, dismissWelcome, toggleSidebar, settings } = useMiniApps();
    const [showInSidebar, setShowInSidebar] = useState(true);

    if (!showWelcomeFor) return null;

    const miniApp = MINI_APPS[showWelcomeFor];
    if (!miniApp) return null;

    const handleConfirm = async () => {
        // Update sidebar preference if changed
        if (!showInSidebar) {
            await toggleSidebar(showWelcomeFor, false);
        }
        dismissWelcome();
    };

    return (
        <Dialog open={true} onOpenChange={() => dismissWelcome()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{miniApp.name}</DialogTitle>
                            <DialogDescription className="text-sm">
                                Mini App activée
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        {miniApp.description}
                    </p>

                    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">Fonctionnalités</span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                            <li>• Sélection interactive des mots-clés</li>
                            <li>• Analyses multiples par poème</li>
                            <li>• Évaluation IA avec feedback détaillé</li>
                            <li>• Sauvegarde automatique</li>
                            <li>• Suivi de progression</li>
                        </ul>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="space-y-0.5">
                            <Label htmlFor="sidebar-toggle" className="text-sm font-medium">
                                Afficher dans la sidebar
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {showInSidebar
                                    ? "Accès rapide depuis le menu principal"
                                    : "Accessible via ⌘K • Réactivable dans les paramètres"}
                            </p>
                        </div>
                        <Switch
                            id="sidebar-toggle"
                            checked={showInSidebar}
                            onCheckedChange={setShowInSidebar}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleConfirm} className="w-full gap-2">
                        <BookOpen className="w-4 h-4" />
                        Commencer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
