"use client";

import { useEffect, useState } from "react";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Users, MessageSquare, MessagesSquare, Loader2 } from "lucide-react";

interface Stats {
    totalUsers: number;
    totalChats: number;
    totalMessages: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch("/api/admin/stats", {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!response.ok) throw new Error("Erreur");

            const data = await response.json();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    const statItems = [
        {
            label: "Utilisateurs",
            value: stats?.totalUsers ?? 0,
            icon: Users,
        },
        {
            label: "Conversations",
            value: stats?.totalChats ?? 0,
            icon: MessageSquare,
        },
        {
            label: "Messages",
            value: stats?.totalMessages ?? 0,
            icon: MessagesSquare,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Vue d'ensemble</p>
            </div>

            {/* Stats - simple inline display */}
            <div className="flex flex-wrap gap-6">
                {statItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
