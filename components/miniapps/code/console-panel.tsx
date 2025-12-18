"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Terminal, Trash2, Loader2, Wifi, WifiOff } from "lucide-react";

interface ConsoleOutput {
    type: "stdout" | "stderr" | "info" | "stdin";
    content: string;
    timestamp: Date;
}

interface ConsolePanelProps {
    output: ConsoleOutput[];
    isRunning: boolean;
    onClear: () => void;
    stdin: string;
    onStdinChange: (value: string) => void;
    code: string;
    onSendInput?: (input: string) => void;
    isInteractive?: boolean;
    waitingForInput?: boolean;
}

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 400;
const DEFAULT_HEIGHT = 180;

export function ConsolePanel({
    output,
    isRunning,
    onClear,
    stdin,
    onStdinChange,
    code,
    onSendInput,
    isInteractive = false,
    waitingForInput = false,
}: ConsolePanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [height, setHeight] = useState(DEFAULT_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const [currentInput, setCurrentInput] = useState("");

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

    // Focus input when waiting for input
    useEffect(() => {
        if (waitingForInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [waitingForInput]);

    // Count expected inputs from code (for non-interactive mode)
    const expectedInputCount = code.match(/input\s*\(/g)?.length || 0;
    const inputValues = stdin.split("\n").filter((v) => v.trim() !== "");
    const missingInputs = Math.max(0, expectedInputCount - inputValues.length);

    // Handle resize drag
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);

            const startY = e.clientY;
            const startHeight = height;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = startY - moveEvent.clientY;
                const newHeight = Math.max(
                    MIN_HEIGHT,
                    Math.min(MAX_HEIGHT, startHeight + deltaY)
                );
                setHeight(newHeight);
            };

            const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [height]
    );

    // Handle interactive input submit
    const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && currentInput !== undefined) {
            if (isInteractive && onSendInput) {
                onSendInput(currentInput + "\n");
                setCurrentInput("");
            } else {
                // Non-interactive: add to stdin buffer
                onStdinChange(stdin + (stdin ? "\n" : "") + currentInput);
                setCurrentInput("");
            }
        }
    };

    return (
        <div
            className={cn(
                "border-t flex flex-col bg-muted/20",
                isResizing && "select-none"
            )}
            style={{ height }}
        >
            {/* Resize handle */}
            <div
                className={cn(
                    "h-[3px] cursor-ns-resize hover:bg-primary/40 transition-colors",
                    isResizing && "bg-primary/50"
                )}
                onMouseDown={handleMouseDown}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Console</span>
                    {isRunning && (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                    )}
                    {waitingForInput && (
                        <span className="text-amber-500 text-[10px] animate-pulse">
                            En attente d&apos;entrée...
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onClear}
                    disabled={output.length === 0}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            {/* Output area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-sm"
            >
                {output.length === 0 ? (
                    <div className="text-muted-foreground text-xs space-y-1">
                        <p>La sortie apparaîtra ici...</p>
                        {expectedInputCount > 0 && !isInteractive && (
                            <p className="text-amber-600">
                                💡 Entrez les {expectedInputCount} valeur{expectedInputCount > 1 ? "s" : ""} ci-dessous avant d&apos;exécuter.
                            </p>
                        )}
                    </div>
                ) : (
                    output.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "whitespace-pre-wrap break-all",
                                item.type === "stderr" && "text-red-500",
                                item.type === "info" && "text-emerald-500 text-xs",
                                item.type === "stdin" && "text-blue-400"
                            )}
                        >
                            {item.type === "stdin" && <span className="text-muted-foreground">› </span>}
                            {item.content.split("\n").map((line, lineIdx) => (
                                <span key={lineIdx}>
                                    {line}
                                    {lineIdx < item.content.split("\n").length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    ))
                )}
            </div>

            {/* Input area - more padding */}
            <div className="border-t px-5 py-4 bg-background/50 mb-2">
                <div className="flex items-center gap-3 font-mono text-sm">
                    <span className={cn(
                        "transition-colors",
                        waitingForInput ? "text-amber-500 animate-pulse" : "text-emerald-500"
                    )}>
                        {waitingForInput ? "?" : ">"}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={isInteractive ? currentInput : stdin}
                        onChange={(e) => {
                            if (isInteractive) {
                                setCurrentInput(e.target.value);
                            } else {
                                onStdinChange(e.target.value);
                            }
                        }}
                        onKeyDown={handleInputSubmit}
                        placeholder={
                            isInteractive
                                ? waitingForInput
                                    ? "Entrez une valeur et appuyez Entrée..."
                                    : "Entrée interactive..."
                                : `Entrées stdin (${inputValues.length}/${expectedInputCount})`
                        }
                        className={cn(
                            "flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50",
                            waitingForInput && "placeholder:text-amber-500/50"
                        )}
                        disabled={!isInteractive && isRunning}
                    />
                    {!isInteractive && missingInputs > 0 && (
                        <span className="text-xs text-amber-500">
                            {missingInputs} manquant{missingInputs > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
