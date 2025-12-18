"use client";

import { Button } from "@/components/ui/button";
import { Play, Square, FileCode2, Loader2 } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface ToolbarProps {
    fileName: string;
    isRunning: boolean;
    isSaving?: boolean;
    isInteractive?: boolean;
    onRun: () => void;
    onStop?: () => void;
    onClose: () => void;
}

export function Toolbar({
    fileName,
    isRunning,
    isSaving,
    onRun,
    onStop,
}: ToolbarProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            {/* Left: File info */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                    <FileCode2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{fileName}</span>
                </div>
                {/* Save indicator only */}
                {isSaving && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Sauvegarde...
                    </span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {isRunning ? (
                    <Button
                        onClick={onStop}
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                    >
                        <Square className="h-4 w-4" />
                        Stop
                    </Button>
                ) : (
                    <Button
                        onClick={onRun}
                        size="sm"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Play className="h-4 w-4" />
                        Run
                        <Kbd className="ml-1 bg-emerald-700/50 border-emerald-800/50 text-emerald-100 text-[10px]">
                            ⌘↵
                        </Kbd>
                    </Button>
                )}
            </div>
        </div>
    );
}
