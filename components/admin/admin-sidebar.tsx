"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    MessageSquare,
    LayoutDashboard,
    ArrowLeft,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { StarLogo } from "@/components/ui/star-logo";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import type { User } from "@/types";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: User | null;
    onSignOut: () => void;
}

const adminNavItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Conversations",
        href: "/admin/conversations",
        icon: MessageSquare,
    },
];

export function AdminSidebar({
    user,
    onSignOut,
    ...props
}: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <Sidebar variant="inset" {...props}>
            {/* Header avec logo */}
            <SidebarHeader className="py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/admin" prefetch>
                                <StarLogo size={20} />
                                <span className="truncate font-semibold">Aurora Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={
                                            pathname === item.href ||
                                            (item.href !== "/admin" && pathname.startsWith(item.href))
                                        }
                                    >
                                        <Link href={item.href} prefetch>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Retour à l'app */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/chat" prefetch>
                                        <ArrowLeft className="h-4 w-4" />
                                        <span>Retour à Aurora</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with user */}
            <SidebarFooter className="mb-2 pb-[max(0rem,var(--sab))]">
                {user ? (
                    <NavUser
                        user={{
                            name: user.name,
                            email: user.email,
                            avatar: user.avatar,
                        }}
                        onSignOut={onSignOut}
                    />
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
