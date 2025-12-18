"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Terminal, Trash2, Loader2 } from "lucide-react";

interface ConsoleOutput {
    type: "stdout" | "stderr" | "info";
    content: string;
    timestamp: Date;
}

interface ConsolePanelProps {
    output: ConsoleOutput[];
    isRunning: boolean;
    onClear: () => void;
}

export function ConsolePanel({ output, isRunning, onClear }: ConsolePanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

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
