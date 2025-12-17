"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
    Search,
    MoreHorizontal,
    Eye,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
} from "lucide-react";
import { toast } from "sonner";

interface ConversationUser {
    $id: string;
    name: string;
    email: string;
}

interface Conversation {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    title: string;
    userId: string;
    user: ConversationUser | null;
}

interface ConversationsResponse {
    conversations: Conversation[];
    total: number;
}

interface UsersResponse {
    users: { $id: string; name: string; email: string }[];
    total: number;
}

const ITEMS_PER_PAGE = 15;

// Truncate email for display
function truncateEmail(email: string, maxLength: number = 25): string {
    if (email.length <= maxLength) return email;
    const [localPart, domain] = email.split("@");
    if (!domain) return email.slice(0, maxLength) + "...";
    const maxLocal = maxLength - domain.length - 4; // 4 for "...@"
    if (maxLocal < 5) return email.slice(0, maxLength) + "...";
    return localPart.slice(0, maxLocal) + "...@" + domain;
}

export default function AdminConversationsPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [users, setUsers] = useState<{ $id: string; name: string; email: string }[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("");

    // Dialog states
    const [deleteConv, setDeleteConv] = useState<Conversation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Load users for filter
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const jwt = await getSessionJWT();
            if (!jwt) return;

            const response = await fetch(`/api/admin/users?limit=100`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (response.ok) {
                const data: UsersResponse = await response.json();
                setUsers(data.users);
            }
        } catch (err) {
            // Silently fail
        }
    };

    const loadConversations = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                offset: (page * ITEMS_PER_PAGE).toString(),
            });

            if (search) params.set("search", search);
            if (selectedUserId) params.set("userId", selectedUserId);

            const response = await fetch(`/api/admin/conversations?${params}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!response.ok) {
                throw new Error("Erreur lors du chargement des conversations");
            }

            let data: ConversationsResponse = await response.json();

            // Filter by date if needed (client-side since AppWrite doesn't support date range easily)
            if (dateFilter) {
                const filterDate = new Date(dateFilter);
                data.conversations = data.conversations.filter((conv) => {
                    const convDate = new Date(conv.$createdAt);
                    return (
                        convDate.getFullYear() === filterDate.getFullYear() &&
                        convDate.getMonth() === filterDate.getMonth() &&
                        convDate.getDate() === filterDate.getDate()
                    );
                });
            }

            setConversations(data.conversations);
            setTotal(dateFilter ? data.conversations.length : data.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [page, search, selectedUserId, dateFilter]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async () => {
        if (!deleteConv) return;

        setIsDeleting(true);
        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(`/api/admin/conversations/${deleteConv.$id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");

            toast.success("Conversation supprimée");
            setDeleteConv(null);
            loadConversations();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedUserId("");
        setDateFilter("");
        setPage(0);
    };

    const hasFilters = search || selectedUserId || dateFilter;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} conversation{total !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] max-w-sm space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Recherche</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Titre de conversation..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                {/* User filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Utilisateur</label>
                    <Select
                        value={selectedUserId || "all"}
                        onValueChange={(v) => setSelectedUserId(v === "all" ? "" : v)}
                    >
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Tous les utilisateurs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les utilisateurs</SelectItem>
                            {users.map((u) => (
                                <SelectItem key={u.$id} value={u.$id}>
                                    {u.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date filter */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="h-9 w-[160px]"
                    />
                </div>

                {/* Clear button */}
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 text-muted-foreground hover:text-foreground"
                    >
                        Effacer les filtres
                    </Button>
                )}
            </div>

            {/* Table */}
            {error ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-destructive">{error}</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Créée</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conversations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Aucune conversation trouvée
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    conversations.map((conv) => (
                                        <TableRow
                                            key={conv.$id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/admin/conversations/${conv.$id}`)}
                                        >
                                            <TableCell className="font-medium max-w-[300px] truncate">
                                                {conv.title}
                                            </TableCell>
                                            <TableCell>
                                                {conv.user ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-medium">{conv.user.name}</p>
                                                        <p
                                                            className="text-xs text-muted-foreground"
                                                            title={conv.user.email}
                                                        >
                                                            {truncateEmail(conv.user.email)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(conv.$createdAt).toLocaleDateString("fr-FR", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/admin/conversations/${conv.$id}`);
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteConv(conv);
                                                            }}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {page + 1} / {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                open={!!deleteConv}
                onOpenChange={(open) => !open && setDeleteConv(null)}
                title="Supprimer la conversation"
                description={`Supprimer "${deleteConv?.title}" et tous ses messages ?`}
                confirmText="Supprimer"
                onConfirm={handleDelete}
                isLoading={isDeleting}
                variant="destructive"
            />
        </div>
    );
}
