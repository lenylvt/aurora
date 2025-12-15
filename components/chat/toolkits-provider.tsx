"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getSessionJWT } from "@/lib/appwrite/client";

interface Toolkit {
    id: string;
    name: string;
    toolkit: string;
    description: string;
    hasAuthConfig: boolean;
    isConnected: boolean;
    connectionId?: string;
}

interface ToolkitsContextType {
    toolkits: Toolkit[];
    loading: boolean;
    refetch: () => Promise<void>;
}

const ToolkitsContext = createContext<ToolkitsContextType | null>(null);

export function ToolkitsProvider({ children }: { children: ReactNode }) {
    const [toolkits, setToolkits] = useState<Toolkit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchToolkits = async () => {
        try {
            const jwt = await getSessionJWT();
            if (!jwt) {
                setLoading(false);
                return;
            }

            const response = await fetch("/api/composio/toolkits", {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            const data = await response.json();

            if (!data.error) {
                setToolkits(data.toolkits || []);
            }
        } catch (error) {
            console.error("Error fetching toolkits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchToolkits();
    }, []);

    const refetch = async () => {
        setLoading(true);
        await fetchToolkits();
    };

    return (
        <ToolkitsContext.Provider value={{ toolkits, loading, refetch }}>
            {children}
        </ToolkitsContext.Provider>
    );
}

export function useToolkits() {
    const context = useContext(ToolkitsContext);
    if (!context) {
        throw new Error("useToolkits must be used within ToolkitsProvider");
    }
    return context;
}
