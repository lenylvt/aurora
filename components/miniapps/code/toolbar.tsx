"use client";

import { Button } from "@/components/ui/button";
import { Play, X, FileCode2, Loader2 } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface ToolbarProps {
    fileName: string;
    isRunning: boolean;
    onRun: () => void;
    onClose: () => void;
}

export function Toolbar({ fileName, isRunning, onRun, onClose }: ToolbarProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            {/* Left: File info */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                    <FileCode2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{fileName}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={onRun}
                    disabled={isRunning}
                    size="sm"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                    {isRunning ? "Exécution..." : "Run"}
                    {!isRunning && (
                        <Kbd className="ml-1 bg-emerald-700/50 border-emerald-800/50 text-emerald-100 text-[10px]">
                            ⌘↵
                        </Kbd>
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
