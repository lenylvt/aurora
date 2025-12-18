"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface CodeFile {
    id: string;
    name: string;
    content: string;
    language: string;
}

interface CodeFilesContextType {
    files: CodeFile[];
    activeFileId: string;
    activeFile: CodeFile | undefined;
    setActiveFileId: (id: string) => void;
    createFile: (name: string) => void;
    renameFile: (id: string, newName: string) => void;
    deleteFile: (id: string) => void;
    updateFileContent: (id: string, content: string) => void;
}

const CodeFilesContext = createContext<CodeFilesContextType | null>(null);

const DEFAULT_FILE: CodeFile = {
    id: "main",
    name: "main.py",
    content: `# Bienvenue dans l'IDE Aurora! 🚀
# Écrivez votre code Python ici et cliquez sur Run

def saluer(nom):
    return f"Bonjour, {nom}!"

# Test
message = saluer("Aurora")
print(message)

# Boucle simple
for i in range(5):
    print(f"Compteur: {i}")
`,
    language: "python",
};

export function CodeFilesProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<CodeFile[]>([DEFAULT_FILE]);
    const [activeFileId, setActiveFileId] = useState<string>("main");

    const activeFile = files.find((f) => f.id === activeFileId);

    const createFile = useCallback((name: string) => {
        const id = `file-${Date.now()}`;
        const newFile: CodeFile = {
            id,
            name: name.endsWith(".py") ? name : `${name}.py`,
            content: `# ${name}\n`,
            language: "python",
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(id);
    }, []);

    const renameFile = useCallback((id: string, newName: string) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === id
                    ? { ...f, name: newName.endsWith(".py") ? newName : `${newName}.py` }
                    : f
            )
        );
    }, []);

    const deleteFile = useCallback((id: string) => {
        setFiles((prev) => {
            const newFiles = prev.filter((f) => f.id !== id);
            if (newFiles.length === 0) {
                return [DEFAULT_FILE];
            }
            return newFiles;
        });
        setActiveFileId((currentId) => {
            if (currentId === id) {
                return files.find((f) => f.id !== id)?.id || "main";
            }
            return currentId;
        });
    }, [files]);

    const updateFileContent = useCallback((id: string, content: string) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, content } : f))
        );
    }, []);

    return (
        <CodeFilesContext.Provider
            value={{
                files,
                activeFileId,
                activeFile,
                setActiveFileId,
                createFile,
                renameFile,
                deleteFile,
                updateFileContent,
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
