"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getCurrentUser } from "@/lib/appwrite/client";
import {
    getUserCodeFiles,
    createCodeFile,
    updateCodeFile,
    deleteCodeFile,
    type CodeFile as DbCodeFile,
} from "@/lib/appwrite/miniapps/code-files";

export interface CodeFile {
    id: string;
    name: string;
    content: string;
    language: string;
    dbId?: string; // Database document ID (for cloud-synced files)
    isDirty?: boolean; // Has unsaved changes
}

interface CodeFilesContextType {
    files: CodeFile[];
    activeFileId: string;
    activeFile: CodeFile | undefined;
    isLoading: boolean;
    isSaving: boolean;
    setActiveFileId: (id: string) => void;
    createFile: (name: string) => void;
    renameFile: (id: string, newName: string) => void;
    deleteFile: (id: string) => void;
    updateFileContent: (id: string, content: string) => void;
}

const CodeFilesContext = createContext<CodeFilesContextType | null>(null);

const DEFAULT_CODE = `# Bienvenue dans l'IDE Aurora! 🚀
# Écrivez votre code Python ici et cliquez sur Run

def saluer(nom):
    return f"Bonjour, {nom}!"

# Test
message = saluer("Aurora")
print(message)

# Boucle simple
for i in range(5):
    print(f"Compteur: {i}")
`;

// Debounce delay for auto-save (in ms)
const AUTOSAVE_DELAY = 3000;

export function CodeFilesProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<CodeFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Refs for debouncing
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSavesRef = useRef<Map<string, string>>(new Map());

    const activeFile = files.find((f) => f.id === activeFileId);

    // Load files from database on mount
    useEffect(() => {
        async function loadFiles() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setIsLoading(false);
                    // Create default file for non-authenticated users
                    const defaultFile: CodeFile = {
                        id: "main",
                        name: "main.py",
                        content: DEFAULT_CODE,
                        language: "python",
                    };
                    setFiles([defaultFile]);
                    setActiveFileId("main");
                    return;
                }

                setUserId(user.$id);
                const dbFiles = await getUserCodeFiles(user.$id);

                if (dbFiles.length === 0) {
                    // Create default file in DB
                    const newFile = await createCodeFile(user.$id, "main.py", DEFAULT_CODE, "python");
                    if (newFile) {
                        const file: CodeFile = {
                            id: newFile.id,
                            name: newFile.name,
                            content: newFile.content,
                            language: newFile.language,
                            dbId: newFile.id,
                        };
                        setFiles([file]);
                        setActiveFileId(file.id);
                    }
                } else {
                    const loadedFiles: CodeFile[] = dbFiles.map((f) => ({
                        id: f.id,
                        name: f.name,
                        content: f.content,
                        language: f.language,
                        dbId: f.id,
                    }));
                    setFiles(loadedFiles);
                    setActiveFileId(loadedFiles[0].id);
                }
            } catch (error) {
                console.error("[CodeFilesProvider] Error loading files:", error);
                // Fallback to default file
                const defaultFile: CodeFile = {
                    id: "main",
                    name: "main.py",
                    content: DEFAULT_CODE,
                    language: "python",
                };
                setFiles([defaultFile]);
                setActiveFileId("main");
            } finally {
                setIsLoading(false);
            }
        }

        loadFiles();
    }, []);

    // Auto-save with debounce
    const scheduleSave = useCallback((fileId: string, content: string) => {
        pendingSavesRef.current.set(fileId, content);

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Schedule new save
        saveTimeoutRef.current = setTimeout(async () => {
            const savesToProcess = new Map(pendingSavesRef.current);
            pendingSavesRef.current.clear();

            if (savesToProcess.size === 0) return;

            setIsSaving(true);

            for (const [fId, fContent] of savesToProcess) {
                const file = files.find((f) => f.id === fId);
                if (file?.dbId) {
                    await updateCodeFile(file.dbId, { content: fContent });
                }
            }

            // Mark files as saved
            setFiles((prev) =>
                prev.map((f) =>
                    savesToProcess.has(f.id) ? { ...f, isDirty: false } : f
                )
            );

            setIsSaving(false);
        }, AUTOSAVE_DELAY);
    }, [files]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleCreateFile = useCallback(async (name: string) => {
        const fileName = name.endsWith(".py") ? name : `${name}.py`;

        if (userId) {
            const newFile = await createCodeFile(userId, fileName, `# ${fileName}\n`, "python");
            if (newFile) {
                const file: CodeFile = {
                    id: newFile.id,
                    name: newFile.name,
                    content: newFile.content,
                    language: newFile.language,
                    dbId: newFile.id,
                };
                setFiles((prev) => [...prev, file]);
                setActiveFileId(file.id);
            }
        } else {
            // Local-only file
            const id = `file-${Date.now()}`;
            const file: CodeFile = {
                id,
                name: fileName,
                content: `# ${fileName}\n`,
                language: "python",
            };
            setFiles((prev) => [...prev, file]);
            setActiveFileId(id);
        }
    }, [userId]);

    const handleRenameFile = useCallback(async (id: string, newName: string) => {
        const fileName = newName.endsWith(".py") ? newName : `${newName}.py`;
        const file = files.find((f) => f.id === id);

        if (file?.dbId) {
            await updateCodeFile(file.dbId, { name: fileName });
        }

        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, name: fileName } : f))
        );
    }, [files]);

    const handleDeleteFile = useCallback(async (id: string) => {
        const file = files.find((f) => f.id === id);

        if (file?.dbId) {
            await deleteCodeFile(file.dbId);
        }

        setFiles((prev) => {
            const newFiles = prev.filter((f) => f.id !== id);
            if (newFiles.length === 0 && userId) {
                // Create a new default file
                createCodeFile(userId, "main.py", DEFAULT_CODE, "python").then((newFile) => {
                    if (newFile) {
                        const file: CodeFile = {
                            id: newFile.id,
                            name: newFile.name,
                            content: newFile.content,
                            language: newFile.language,
                            dbId: newFile.id,
                        };
                        setFiles([file]);
                        setActiveFileId(file.id);
                    }
                });
                return prev; // Return old state, will update async
            }
            return newFiles;
        });

        // Update active file if needed
        if (activeFileId === id) {
            const remaining = files.filter((f) => f.id !== id);
            if (remaining.length > 0) {
                setActiveFileId(remaining[0].id);
            }
        }
    }, [files, activeFileId, userId]);

    const handleUpdateFileContent = useCallback((id: string, content: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, content, isDirty: true } : f))
        );

        // Schedule auto-save
        const file = files.find((f) => f.id === id);
        if (file?.dbId) {
            scheduleSave(id, content);
        }
    }, [files, scheduleSave]);

    return (
        <CodeFilesContext.Provider
            value={{
                files,
                activeFileId,
                activeFile,
                isLoading,
                isSaving,
                setActiveFileId,
                createFile: handleCreateFile,
                renameFile: handleRenameFile,
                deleteFile: handleDeleteFile,
                updateFileContent: handleUpdateFileContent,
            }}
        >
            {children}
        </CodeFilesContext.Provider>
    );
}

export function useCodeFiles() {
    const context = useContext(CodeFilesContext);
    if (!context) {
        throw new Error("useCodeFiles must be used within CodeFilesProvider");
    }
    return context;
}
