"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Check, Copy, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { useCopyToClipboard } from "../shared";
import type { CodeBlockProps } from "./schema";

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    python: "Python",
    json: "JSON",
    bash: "Bash",
    sh: "Shell",
    css: "CSS",
    html: "HTML",
    markdown: "Markdown",
    sql: "SQL",
    yaml: "YAML",
    go: "Go",
    rust: "Rust",
    tsx: "TSX",
    jsx: "JSX",
    text: "Text",
};

export function CodeBlock({
    id,
    code,
    language = "text",
    filename,
    showLineNumbers = true,
    highlightLines = [],
    maxCollapsedLines,
    className,
    isLoading,
}: CodeBlockProps) {
    const { copiedId, copy } = useCopyToClipboard();
    const [isOpen, setIsOpen] = React.useState(true);
    const isCopied = copiedId === id;

    const lines = code.split("\n");
    const shouldCollapse = maxCollapsedLines && lines.length > maxCollapsedLines;

    const handleCopy = () => {
        copy(code, id);
    };

    if (isLoading) {
        return (
            <div className="animate-pulse rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
            </div>
        );
    }

    const languageDisplay = LANGUAGE_NAMES[language] || language;

    const codeContent = (
        <div className="overflow-x-auto">
            <pre className="p-4 text-sm font-mono">
                {lines.map((line, i) => {
                    const lineNum = i + 1;
                    const isHighlighted = highlightLines.includes(lineNum);
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex",
                                isHighlighted && "bg-yellow-500/10 -mx-4 px-4"
                            )}
                        >
                            {showLineNumbers && (
                                <span className="select-none text-muted-foreground w-8 text-right pr-4 flex-shrink-0">
                                    {lineNum}
                                </span>
                            )}
                            <code className="flex-1">{line || " "}</code>
                        </div>
                    );
                })}
            </pre>
        </div>
    );

    return (
        <div
            className={cn("rounded-lg border bg-muted/30 overflow-hidden", className)}
            data-tool-ui-id={id}
            data-slot="code-block"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileCode className="h-4 w-4" />
                    {filename && <span className="font-medium text-foreground">{filename}</span>}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {languageDisplay}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2"
                    >
                        {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>
                    {shouldCollapse && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(!isOpen)}
                            className="h-7 px-2"
                        >
                            {isOpen ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Code content */}
            {shouldCollapse ? (
                <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
                    <Collapsible.Content>
                        {codeContent}
                    </Collapsible.Content>
                    {!isOpen && (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                            {lines.length} lines • Click to expand
                        </div>
                    )}
                </Collapsible.Root>
            ) : (
                codeContent
            )}
        </div>
    );
}
