"use client";

import { useState } from "react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Code2,
    FilePlus,
    FileCode2,
    Pencil,
    Check,
    X,
    Trash2,
} from "lucide-react";
import { useCodeFiles } from "./code-files-provider";

export function CodeSidebar() {
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const { files, activeFileId, setActiveFileId, createFile, renameFile, deleteFile } = useCodeFiles();

    const handleCreate = () => {
        if (newFileName.trim()) {
            createFile(newFileName.trim());
            setNewFileName("");
            setIsCreating(false);
        }
    };

    const handleRename = (id: string) => {
        if (editingName.trim()) {
            renameFile(id, editingName.trim());
            setEditingId(null);
            setEditingName("");
        }
    };

    const startEditing = (id: string, currentName: string) => {
        setEditingId(id);
        setEditingName(currentName.replace(".py", ""));
    };

    return (
        <SidebarGroup className="flex-1">
            <SidebarGroupLabel className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    <span>Fichiers</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setIsCreating(true)}
                >
                    <FilePlus className="h-3.5 w-3.5" />
                </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {/* New file input */}
                    {isCreating && (
                        <SidebarMenuItem>
                            <div className="flex items-center gap-1 px-2 py-1">
                                <Input
                                    autoFocus
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreate();
                                        if (e.key === "Escape") {
                                            setIsCreating(false);
                                            setNewFileName("");
                                        }
                                    }}
                                    placeholder="nom.py"
                                    className="h-6 text-sm flex-1"
                                />
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCreate}>
                                    <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewFileName("");
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </SidebarMenuItem>
                    )}

                    {/* File list */}
                    {files.map((file) => (
                        <SidebarMenuItem key={file.id}>
                            {editingId === file.id ? (
                                <div className="flex items-center gap-1 px-2 py-1">
                                    <Input
                                        autoFocus
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRename(file.id);
                                            if (e.key === "Escape") {
                                                setEditingId(null);
                                                setEditingName("");
                                            }
                                        }}
                                        className="h-6 text-sm flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => handleRename(file.id)}
                                    >
                                        <Check className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => {
                                            setEditingId(null);
                                            setEditingName("");
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="group/file flex items-center w-full relative">
                                    <SidebarMenuButton
                                        onClick={() => setActiveFileId(file.id)}
                                        isActive={activeFileId === file.id}
                                        className="flex-1 pr-14 data-[active=true]:bg-sidebar-accent/50"
                                    >
                                        <FileCode2 className="h-4 w-4 text-emerald-500" />
                                        <span className="truncate">{file.name}</span>
                                    </SidebarMenuButton>
                                    <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(file.id, file.name);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        {files.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteFile(file.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
