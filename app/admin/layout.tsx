"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, getSessionJWT } from "@/lib/appwrite/client";
import type { User } from "@/types";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2, ShieldX } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const userData = await getCurrentUser();
            if (!userData) {
                router.push("/login");
                return;
            }

            setUser(userData);

            // Check if user is admin via labels
            if (userData.labels && userData.labels.includes("admin")) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">
                        Vérification des accès...
                    </p>
                </div>
            </div>
        );
    }

    // Not admin
    if (isAdmin === false) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
                    <ShieldX className="h-16 w-16 text-destructive" />
                    <h1 className="text-2xl font-bold">Accès refusé</h1>
                    <p className="text-muted-foreground">
                        Vous n'avez pas les permissions nécessaires pour accéder au panneau
                        d'administration. Contactez un administrateur si vous pensez qu'il
                        s'agit d'une erreur.
                    </p>
                    <button
                        onClick={() => router.push("/chat")}
                        className="text-primary underline hover:no-underline"
                    >
                        Retour à l'application
                    </button>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AdminSidebar user={user} onSignOut={handleSignOut} />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
