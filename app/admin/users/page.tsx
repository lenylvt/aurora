"use client";

import { useEffect, useState, useCallback } from "react";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import {
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface User {
    $id: string;
    $createdAt: string;
    name: string;
    email: string;
    labels: string[];
    status: boolean;
}

interface UsersResponse {
    users: User[];
    total: number;
}

const ITEMS_PER_PAGE = 15;

// Truncate email for display
function truncateEmail(email: string, maxLength: number = 25): string {
    if (email.length <= maxLength) return email;
    const [localPart, domain] = email.split("@");
    if (!domain) return email.slice(0, maxLength) + "...";
    const maxLocal = maxLength - domain.length - 4;
    if (maxLocal < 5) return email.slice(0, maxLength) + "...";
    return localPart.slice(0, maxLocal) + "...@" + domain;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadUsers = useCallback(async () => {
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

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!response.ok) throw new Error("Erreur lors du chargement");

            const data: UsersResponse = await response.json();
            setUsers(data.users);
            setTotal(data.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        const timer = setTimeout(() => setPage(0), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async () => {
        if (!deleteUser) return;

        setIsDeleting(true);
        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(
                `/api/admin/users/${deleteUser.$id}?deleteData=true`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );

            if (!response.ok) throw new Error("Erreur lors de la suppression");

            toast.success("Utilisateur supprimé");
            setDeleteUser(null);
            loadUsers();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveUser = async (data: {
        name: string;
        email: string;
        labels: string[];
        status: boolean;
    }) => {
        if (!editUser) return;

        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(`/api/admin/users/${editUser.$id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Erreur lors de la mise à jour");

            toast.success("Utilisateur mis à jour");
            loadUsers();
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
                    <p className="text-sm text-muted-foreground">
                        {total} utilisateur{total !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                />
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
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Labels</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Inscrit</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Aucun utilisateur trouvé
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.$id}>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    <p className="font-medium">{user.name}</p>
                                                    <p
                                                        className="text-xs text-muted-foreground"
                                                        title={user.email}
                                                    >
                                                        {truncateEmail(user.email)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {user.labels?.length > 0 ? (
                                                        user.labels.map((label) => (
                                                            <Badge
                                                                key={label}
                                                                variant={label === "admin" ? "default" : "secondary"}
                                                                className="text-xs"
                                                            >
                                                                {label}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.status ? "outline" : "destructive"}>
                                                    {user.status ? "Actif" : "Bloqué"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(user.$createdAt).toLocaleDateString("fr-FR", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteUser(user)}
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
                open={!!deleteUser}
                onOpenChange={(open) => !open && setDeleteUser(null)}
                title="Supprimer l'utilisateur"
                description={`Supprimer ${deleteUser?.name} et toutes ses données ?`}
                confirmText="Supprimer"
                onConfirm={handleDelete}
                isLoading={isDeleting}
                variant="destructive"
            />

            {/* Edit dialog */}
            {editUser && (
                <UserEditDialog
                    open={!!editUser}
                    onOpenChange={(open) => !open && setEditUser(null)}
                    user={editUser}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
