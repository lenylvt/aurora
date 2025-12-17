"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Loader2 } from "lucide-react";

interface UserEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        $id: string;
        name: string;
        email: string;
        labels: string[];
        status: boolean;
    };
    onSave: (data: {
        name: string;
        email: string;
        labels: string[];
        status: boolean;
    }) => Promise<void>;
}

export function UserEditDialog({
    open,
    onOpenChange,
    user,
    onSave,
}: UserEditDialogProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [labels, setLabels] = useState<string[]>(user.labels || []);
    const [status, setStatus] = useState(user.status);
    const [newLabel, setNewLabel] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleAddLabel = () => {
        if (newLabel.trim() && !labels.includes(newLabel.trim())) {
            setLabels([...labels, newLabel.trim()]);
            setNewLabel("");
        }
    };

    const handleRemoveLabel = (label: string) => {
        setLabels(labels.filter((l) => l !== label));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, email, labels, status });
            onOpenChange(false);
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de l'utilisateur {user.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nom de l'utilisateur"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemple.com"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Labels</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {labels.map((label) => (
                                    <Badge
                                        key={label}
                                        variant={label === "admin" ? "default" : "secondary"}
                                        className="gap-1"
                                    >
                                        {label}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLabel(label)}
                                            className="ml-1 hover:bg-white/20 rounded-full"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="Nouveau label"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddLabel();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddLabel}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="status">Compte actif</Label>
                                <p className="text-xs text-muted-foreground">
                                    Désactiver bloquera l'accès de l'utilisateur
                                </p>
                            </div>
                            <Switch
                                id="status"
                                checked={status}
                                onCheckedChange={setStatus}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
