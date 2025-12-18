"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMiniApps } from "@/components/miniapps";
import { useCodeFiles } from "./code-files-provider";
import { CodeEditor } from "./code-editor";
import { ConsolePanel } from "./console-panel";
import { Toolbar } from "./toolbar";

interface ConsoleOutput {
    type: "stdout" | "stderr" | "info";
    content: string;
    timestamp: Date;
}

export default function CodeMiniApp() {
    const { closeMiniApp } = useMiniApps();
    const { activeFile, updateFileContent, isLoading, isSaving } = useCodeFiles();

    // Console state
    const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stdin, setStdin] = useState("");

    // Handle code change
    const handleCodeChange = useCallback((code: string) => {
        if (activeFile) {
            updateFileContent(activeFile.id, code);
        }
    }, [activeFile, updateFileContent]);

    // Run code
    const handleRun = useCallback(async () => {
        if (!activeFile || isRunning) return;

        setIsRunning(true);
        setConsoleOutput((prev) => [
            ...prev,
            {
                type: "info",
                content: `▶ Exécution de ${activeFile.name}...`,
                timestamp: new Date(),
            },
        ]);

        try {
            const response = await fetch("/api/code/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: "python",
                    code: activeFile.content,
                    stdin, // Pass stdin for input() support
                }),
            });

            const result = await response.json();

            if (result.stdout) {
                setConsoleOutput((prev) => [
                    ...prev,
                    {
                        type: "stdout",
                        content: result.stdout,
                        timestamp: new Date(),
                    },
                ]);
            }

            if (result.stderr) {
                setConsoleOutput((prev) => [
                    ...prev,
                    {
                        type: "stderr",
                        content: result.stderr,
                        timestamp: new Date(),
                    },
                ]);
            }

            if (result.error) {
                setConsoleOutput((prev) => [
                    ...prev,
                    {
                        type: "stderr",
                        content: result.error,
                        timestamp: new Date(),
                    },
                ]);
            }
        } catch (error) {
            setConsoleOutput((prev) => [
                ...prev,
                {
                    type: "stderr",
                    content: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsRunning(false);
        }
    }, [activeFile, isRunning, stdin]);

    const handleClearConsole = useCallback(() => {
        setConsoleOutput([]);
    }, []);

    const handleClose = useCallback(() => {
        closeMiniApp();
    }, [closeMiniApp]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className="text-sm text-muted-foreground">Chargement des fichiers...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full flex-col bg-background overflow-hidden"
        >
            {/* Toolbar */}
            <Toolbar
                fileName={activeFile?.name || ""}
                isRunning={isRunning}
                isSaving={isSaving}
                onRun={handleRun}
                onClose={handleClose}
            />

            {/* Editor + Console */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Code Editor */}
                <div className="flex-1 overflow-hidden">
                    <CodeEditor
                        code={activeFile?.content || ""}
                        language={activeFile?.language || "python"}
                        onChange={handleCodeChange}
                        onRun={handleRun}
                    />
                </div>

                {/* Console */}
                <ConsolePanel
                    output={consoleOutput}
                    isRunning={isRunning}
                    onClear={handleClearConsole}
                    stdin={stdin}
                    onStdinChange={setStdin}
                />
            </div>
        </motion.div>
    );
}
