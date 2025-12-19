"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useMiniApps } from "@/components/miniapps";
import { useCodeFiles } from "./code-files-provider";
import { CodeEditor } from "./code-editor";
import { ConsolePanel } from "./console-panel";
import { Toolbar } from "./toolbar";
import { ProfPanel } from "./prof-panel";
import { useSidebar } from "@/components/ui/sidebar";

interface ConsoleOutput {
    type: "stdout" | "stderr" | "info" | "stdin";
    content: string;
    timestamp: Date;
}

// Check if WebSocket is available
async function checkWebSocketAvailable(): Promise<string | null> {
    try {
        const response = await fetch("/api/code/ws");
        if (response.ok) {
            const data = await response.json();
            return data.pistonWsUrl || null;
        }
        return null;
    } catch {
        return null;
    }
}

export default function CodeMiniApp() {
    const { closeMiniApp } = useMiniApps();
    const { activeFile, updateFileContent, isLoading, isSaving } = useCodeFiles();

    // Console state
    const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stdin, setStdin] = useState("");

    // Prof panel state
    const [isProfOpen, setIsProfOpen] = useState(false);
    const { setOpen: setSidebarOpen, open: isSidebarOpen } = useSidebar();

    // WebSocket state
    const [isInteractive, setIsInteractive] = useState(false);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [pistonWsUrl, setPistonWsUrl] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Check for WebSocket availability on mount
    useEffect(() => {
        checkWebSocketAvailable().then((url) => {
            if (url) {
                setPistonWsUrl(url);
                setIsInteractive(true);
            }
        });

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Handle code change
    const handleCodeChange = useCallback((code: string) => {
        if (activeFile) {
            updateFileContent(activeFile.id, code);
        }
    }, [activeFile, updateFileContent]);

    // Run code with WebSocket (interactive mode)
    const runInteractive = useCallback(() => {
        if (!activeFile || !pistonWsUrl) return;

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        setIsRunning(true);
        setConsoleOutput((prev) => [
            ...prev,
            {
                type: "info",
                content: `▶ Exécution interactive de ${activeFile.name}...`,
                timestamp: new Date(),
            },
        ]);

        const ws = new WebSocket(pistonWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            // Send init message
            ws.send(JSON.stringify({
                type: "init",
                language: "python",
                version: "*",
                files: [{ name: activeFile.name, content: activeFile.content }],
            }));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case "runtime":
                        setConsoleOutput((prev) => [
                            ...prev,
                            {
                                type: "info",
                                content: `Python ${msg.version}`,
                                timestamp: new Date(),
                            },
                        ]);
                        break;

                    case "stage":
                        if (msg.stage === "run") {
                            setWaitingForInput(false);
                        }
                        break;

                    case "data":
                        if (msg.stream === "stdout") {
                            setConsoleOutput((prev) => [
                                ...prev,
                                {
                                    type: "stdout",
                                    content: msg.data,
                                    timestamp: new Date(),
                                },
                            ]);
                            // Check if waiting for input (stdout ends with common prompts)
                            const lastLine = msg.data.trim();
                            if (lastLine.endsWith(":") || lastLine.endsWith("?") || lastLine.includes("input")) {
                                setWaitingForInput(true);
                            }
                        } else if (msg.stream === "stderr") {
                            // Filter out cgroup/isolate system errors
                            const ignoredPatterns = [
                                "cgroup",
                                "isolate",
                                "/sys/fs/",
                                "memory.events",
                                "No such file or directory"
                            ];
                            const shouldIgnore = ignoredPatterns.some(p =>
                                msg.data.toLowerCase().includes(p.toLowerCase())
                            );

                            if (!shouldIgnore) {
                                setConsoleOutput((prev) => [
                                    ...prev,
                                    {
                                        type: "stderr",
                                        content: msg.data,
                                        timestamp: new Date(),
                                    },
                                ]);
                            }
                        }
                        break;

                    case "exit":
                        setIsRunning(false);
                        setWaitingForInput(false);
                        setConsoleOutput((prev) => [
                            ...prev,
                            {
                                type: "info",
                                content: `✓ Terminé (code: ${msg.code || 0})`,
                                timestamp: new Date(),
                            },
                        ]);
                        break;

                    case "error":
                        setConsoleOutput((prev) => [
                            ...prev,
                            {
                                type: "stderr",
                                content: msg.message || "Erreur inconnue",
                                timestamp: new Date(),
                            },
                        ]);
                        break;
                }
            } catch (e) {
                console.error("[WS] Parse error:", e);
            }
        };

        ws.onerror = () => {
            setConsoleOutput((prev) => [
                ...prev,
                {
                    type: "stderr",
                    content: "Erreur de connexion WebSocket",
                    timestamp: new Date(),
                },
            ]);
            setIsRunning(false);
        };

        ws.onclose = () => {
            setIsRunning(false);
            setWaitingForInput(false);
        };
    }, [activeFile, pistonWsUrl]);

    // Send input via WebSocket
    const handleSendInput = useCallback((input: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "data",
                stream: "stdin",
                data: input,
            }));
            setConsoleOutput((prev) => [
                ...prev,
                {
                    type: "stdin",
                    content: input.trim(),
                    timestamp: new Date(),
                },
            ]);
            setWaitingForInput(false);
        }
    }, []);

    // Run code with REST API (batch mode)
    const runBatch = useCallback(async () => {
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
                    stdin,
                }),
            });

            const result = await response.json();

            if (result.stdout) {
                setConsoleOutput((prev) => [
                    ...prev,
                    { type: "stdout", content: result.stdout, timestamp: new Date() },
                ]);
            }

            if (result.stderr) {
                setConsoleOutput((prev) => [
                    ...prev,
                    { type: "stderr", content: result.stderr, timestamp: new Date() },
                ]);
            }

            if (result.error) {
                setConsoleOutput((prev) => [
                    ...prev,
                    { type: "stderr", content: result.error, timestamp: new Date() },
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

    // Main run handler
    const handleRun = useCallback(() => {
        if (isInteractive && pistonWsUrl) {
            runInteractive();
        } else {
            runBatch();
        }
    }, [isInteractive, pistonWsUrl, runInteractive, runBatch]);

    const handleClearConsole = useCallback(() => {
        setConsoleOutput([]);
    }, []);

    // Stop execution
    const handleStop = useCallback(() => {
        if (wsRef.current) {
            // Send SIGKILL signal via WebSocket
            wsRef.current.send(JSON.stringify({
                type: "signal",
                signal: "SIGKILL"
            }));
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsRunning(false);
        setWaitingForInput(false);
        setConsoleOutput((prev) => [
            ...prev,
            {
                type: "info",
                content: "⏹ Exécution arrêtée",
                timestamp: new Date(),
            },
        ]);
    }, []);

    const handleClose = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        closeMiniApp();
    }, [closeMiniApp]);

    // Toggle Prof panel - close sidebar when opening Prof
    const handleToggleProf = useCallback(() => {
        if (!isProfOpen) {
            // Opening Prof - close sidebar first, then open Prof
            if (isSidebarOpen) {
                setSidebarOpen(false);
            }
            setIsProfOpen(true);
        } else {
            // Closing Prof
            setIsProfOpen(false);
        }
    }, [isProfOpen, isSidebarOpen, setSidebarOpen]);

    // Track previous sidebar state to detect when user opens sidebar
    const prevSidebarOpenRef = useRef(isSidebarOpen);
    useEffect(() => {
        // If sidebar just opened and Prof is open, close Prof (deferred)
        if (isSidebarOpen && !prevSidebarOpenRef.current && isProfOpen) {
            // Use setTimeout to avoid setState during render
            setTimeout(() => setIsProfOpen(false), 0);
        }
        prevSidebarOpenRef.current = isSidebarOpen;
    }, [isSidebarOpen, isProfOpen]);

    // Handle applying code from Prof
    const handleApplyCode = useCallback((newCode: string) => {
        if (activeFile) {
            updateFileContent(activeFile.id, newCode);
        }
    }, [activeFile, updateFileContent]);

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
            className="flex h-full flex-row bg-background overflow-hidden"
        >
            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <Toolbar
                    fileName={activeFile?.name || ""}
                    isRunning={isRunning}
                    isSaving={isSaving}
                    isInteractive={isInteractive}
                    isProfOpen={isProfOpen}
                    onRun={handleRun}
                    onStop={handleStop}
                    onClose={handleClose}
                    onToggleProf={handleToggleProf}
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
                        code={activeFile?.content || ""}
                        onSendInput={handleSendInput}
                        isInteractive={isInteractive}
                        waitingForInput={waitingForInput}
                    />
                </div>
            </div>

            {/* Prof Panel */}
            <AnimatePresence>
                {isProfOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 360, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                        className="h-full overflow-hidden"
                    >
                        <ProfPanel
                            code={activeFile?.content || ""}
                            fileName={activeFile?.name || ""}
                            consoleOutput={consoleOutput.map((o) => o.content)}
                            onApplyCode={handleApplyCode}
                            onClose={() => setIsProfOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
