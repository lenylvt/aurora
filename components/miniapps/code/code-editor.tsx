"use client";

import { useRef, useEffect } from "react";

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
    onRun: () => void;
}

export function CodeEditor({ code, language, onChange, onRun }: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Handle keyboard shortcut for run (Cmd/Ctrl + Enter)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onRun();
        }

        // Handle Tab key for indentation
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = code.substring(0, start) + "    " + code.substring(end);
            onChange(newValue);

            // Set cursor position after the indent
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            });
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [code]);

    // Get line numbers
    const lines = code.split("\n");
    const lineNumbers = lines.map((_, i) => i + 1);

    return (
        <div className="h-full w-full flex bg-background font-mono text-sm overflow-hidden">
            {/* Line numbers */}
            <div className="flex-shrink-0 bg-muted/30 border-r text-muted-foreground select-none py-3 px-2">
                {lineNumbers.map((num) => (
                    <div
                        key={num}
                        className="text-right pr-2 leading-6"
                        style={{ minWidth: "2.5rem" }}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto">
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full min-h-full p-3 bg-transparent resize-none outline-none leading-6 text-foreground"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    placeholder="# Écrivez votre code Python ici..."
                    style={{
                        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
                        tabSize: 4,
                    }}
                />
            </div>
        </div>
    );
}
