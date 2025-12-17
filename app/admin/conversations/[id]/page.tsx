"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import {
    ArrowLeft,
    Trash2,
    Loader2,
    User,
    Calendar,
    MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
    $id: string;
    $createdAt: string;
    role: "user" | "assistant";
    content: string;
    chatId: string;
}

interface Conversation {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    title: string;
    userId: string;
    user: {
        $id: string;
        name: string;
        email: string;
    } | null;
}

interface ConversationData {
    conversation: Conversation;
    messages: Message[];
}

// Truncate email for display
function truncateEmail(email: string, maxLength: number = 30): string {
    if (email.length <= maxLength) return email;
    const [localPart, domain] = email.split("@");
    if (!domain) return email.slice(0, maxLength) + "...";
    const maxLocal = maxLength - domain.length - 4;
    if (maxLocal < 5) return email.slice(0, maxLength) + "...";
    return localPart.slice(0, maxLocal) + "...@" + domain;
}

export default function AdminConversationViewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [data, setData] = useState<ConversationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [deleteMessage, setDeleteMessage] = useState<Message | null>(null);
    const [deleteConversation, setDeleteConversation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadConversation();
    }, [resolvedParams.id]);

    const loadConversation = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(
                `/api/admin/conversations/${resolvedParams.id}`,
                { headers: { Authorization: `Bearer ${jwt}` } }
            );

            if (!response.ok) throw new Error("Conversation non trouvée");

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMessage = async () => {
        if (!deleteMessage) return;

        setIsDeleting(true);
        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(`/api/admin/messages/${deleteMessage.$id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${jwt}` },
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression");

            toast.success("Message supprimé");
            setDeleteMessage(null);
            setData((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: prev.messages.filter((m) => m.$id !== deleteMessage.$id),
                };
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteConversation = async () => {
        if (!data) return;

        setIsDeleting(true);
        try {
            const jwt = await getSessionJWT();
            if (!jwt) throw new Error("Non authentifié");

            const response = await fetch(
                `/api/admin/conversations/${data.conversation.$id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );

            if (!response.ok) throw new Error("Erreur lors de la suppression");

            toast.success("Conversation supprimée");
            router.push("/admin/conversations");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsDeleting(false);
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
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/conversations")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <div className="flex items-center justify-center h-64">
                    <p className="text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { conversation, messages } = data;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/conversations")}
                        className="-ml-2"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Retour
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight">{conversation.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" title={conversation.user?.email}>
                            <User className="h-3.5 w-3.5" />
                            {conversation.user
                                ? `${conversation.user.name} (${truncateEmail(conversation.user.email)})`
                                : "Utilisateur supprimé"}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(conversation.$createdAt).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {messages.length}
                        </span>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConversation(true)}
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Supprimer
                </Button>
            </div>

            {/* Messages - Same style as chat thread */}
            <div className="border rounded-lg bg-background">
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Aucun message
                        </div>
                    ) : (
                        <div className="divide-y">
                            {messages.map((message) => (
                                <div
                                    key={message.$id}
                                    className="group relative px-4 py-3 hover:bg-muted/30"
                                >
                                    {message.role === "user" ? (
                                        // User message - right aligned like in thread
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%]">
                                                <div className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
                                                    <p className="whitespace-pre-wrap break-words text-sm">
                                                        {message.content}
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-right text-xs text-muted-foreground">
                                                    {new Date(message.$createdAt).toLocaleTimeString("fr-FR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        // Assistant message - left aligned with markdown
                                        <div className="max-w-full">
                                            <div className="text-foreground leading-relaxed">
                                                <MarkdownMessage content={message.content} />
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {new Date(message.$createdAt).toLocaleTimeString("fr-FR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Delete button on hover */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setDeleteMessage(message)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete message dialog */}
            <ConfirmDialog
                open={!!deleteMessage}
                onOpenChange={(open) => !open && setDeleteMessage(null)}
                title="Supprimer le message"
                description="Supprimer ce message ? Cette action est irréversible."
                confirmText="Supprimer"
                onConfirm={handleDeleteMessage}
                isLoading={isDeleting}
                variant="destructive"
            />

            {/* Delete conversation dialog */}
            <ConfirmDialog
                open={deleteConversation}
                onOpenChange={setDeleteConversation}
                title="Supprimer la conversation"
                description="Supprimer cette conversation et tous ses messages ?"
                confirmText="Supprimer"
                onConfirm={handleDeleteConversation}
                isLoading={isDeleting}
                variant="destructive"
            />
        </div>
    );
}
