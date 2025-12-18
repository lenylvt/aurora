"use client";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { BookOpen, FileEdit, BarChart3 } from "lucide-react";
import { useMiniApps } from "../miniapps-provider";

export function AnalyseFranceSidebar() {
    const { currentView, setCurrentView } = useMiniApps();

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Analyse Linéaire
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setCurrentView("main")}
                            isActive={currentView === "main"}
                            className="data-[active=true]:bg-sidebar-accent/50"
                        >
                            <FileEdit className="h-4 w-4" />
                            <span>Analyser</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setCurrentView("progress")}
                            isActive={currentView === "progress"}
                            className="data-[active=true]:bg-sidebar-accent/50"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span>Suivi</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
