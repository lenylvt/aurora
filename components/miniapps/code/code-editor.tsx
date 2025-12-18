"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";

interface CodeEditorProps {
    code: string;
    language: string;
    onChange: (code: string) => void;
    onRun: () => void;
}

export function CodeEditor({ code, language, onChange, onRun }: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const [highlightedHtml, setHighlightedHtml] = useState<string>("");
    const { resolvedTheme } = useTheme();

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

    // Highlight code with Shiki
    useEffect(() => {
        const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";

        codeToHtml(code || " ", {
            lang: language === "python" ? "python" : "javascript",
            theme,
        })
            .then((html) => {
                setHighlightedHtml(html);
            })
            .catch((err) => {
                console.error("[CodeEditor] Shiki error:", err);
            });
    }, [code, language, resolvedTheme]);

    // Sync scroll between textarea and highlighted code
    const handleScroll = useCallback(() => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    }, []);

    // Get line numbers
    const lines = (code || "").split("\n");
    const lineNumbers = lines.map((_, i) => i + 1);
    const isDark = resolvedTheme === "dark";

    return (
        <div className="h-full w-full flex bg-background font-mono text-sm overflow-hidden">
            {/* Line numbers */}
            <div className="flex-shrink-0 bg-muted/30 border-r text-muted-foreground select-none py-3 px-2 overflow-hidden">
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

            {/* Editor area with overlay */}
            <div className="flex-1 relative overflow-hidden">
                {/* Highlighted code (background layer) */}
                <div
                    ref={highlightRef}
                    className="absolute inset-0 p-3 overflow-auto pointer-events-none leading-6 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_code]:!bg-transparent"
                    style={{
                        fontFamily:
                            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />

                {/* Textarea (foreground layer - transparent text, visible caret) */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    className="absolute inset-0 w-full h-full p-3 bg-transparent resize-none outline-none leading-6 selection:bg-primary/30"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    placeholder="# Écrivez votre code Python ici..."
                    style={{
                        fontFamily:
                            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
                        tabSize: 4,
                        color: "transparent",
                        caretColor: isDark ? "#fff" : "#000",
                        WebkitTextFillColor: "transparent",
                    }}
                />
            </div>
        </div>
    );
}
