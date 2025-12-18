"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Trash2, Loader2, KeyboardIcon } from "lucide-react";

interface ConsoleOutput {
    type: "stdout" | "stderr" | "info";
    content: string;
    timestamp: Date;
}

interface ConsolePanelProps {
    output: ConsoleOutput[];
    isRunning: boolean;
    onClear: () => void;
    stdin: string;
    onStdinChange: (value: string) => void;
}

export function ConsolePanel({
    output,
    isRunning,
    onClear,
    stdin,
    onStdinChange
}: ConsolePanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showStdin, setShowStdin] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

    // Detect if code might use input()
    useEffect(() => {
        const hasInputError = output.some(
            (o) => o.type === "stderr" && o.content.includes("EOFError")
        );
        if (hasInputError && !showStdin) {
            setShowStdin(true);
        }
    }, [output, showStdin]);

    return (
        <div className="h-48 border-t flex flex-col bg-muted/30">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/50">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" />
                    Console
                    {isRunning && (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant={showStdin ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowStdin(!showStdin)}
                        title="Entrée pour input()"
                    >
                        <KeyboardIcon className="h-3 w-3 mr-1" />
                        Input
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={onClear}
                        disabled={output.length === 0}
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                </div>
            </div>

            {/* Stdin input area */}
            {showStdin && (
                <div className="px-3 py-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Entrées (une par ligne pour chaque input) :
                        </span>
                        <Input
                            value={stdin}
                            onChange={(e) => onStdinChange(e.target.value)}
                            placeholder="valeur1&#10;valeur2&#10;..."
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>
            )}

            {/* Output area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-sm"
            >
                {output.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                        La sortie de votre programme apparaîtra ici...
                    </p>
                ) : (
                    output.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "whitespace-pre-wrap break-all",
                                item.type === "stderr" && "text-red-500",
                                item.type === "info" && "text-emerald-500 text-xs"
                            )}
                        >
                            {item.content.split("\n").map((line, lineIdx) => (
                                <div key={lineIdx}>{line}</div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
