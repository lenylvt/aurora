"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionJWT } from "@/lib/appwrite/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    GraduationCap,
    Send,
    Loader2,
    X,
    Sparkles,
    Copy,
    Check,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ProfPanelProps {
    code: string;
    fileName: string;
    consoleOutput: string[];
    onApplyCode: (code: string) => void;
    onClose: () => void;
}

export function ProfPanel({
    code,
    fileName,
    consoleOutput,
    onApplyCode,
    onClose,
}: ProfPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const jwt = await getSessionJWT();
            if (!jwt) {
                throw new Error("Session expirée, veuillez vous reconnecter");
            }

            const response = await fetch("/api/code/prof", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    code,
                    fileName,
                    consoleOutput: consoleOutput.map((o) =>
                        typeof o === "string" ? o : JSON.stringify(o)
                    ),
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur de communication avec le Prof");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader");

            const decoder = new TextDecoder();
            let assistantContent = "";
            const assistantId = `assistant-${Date.now()}`;

            setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: "" },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: assistantContent }
                            : m
                    )
                );
            }
        } catch (error: any) {
            console.error("[Prof] Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: `❌ ${error.message || "Une erreur est survenue"}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, code, fileName, consoleOutput]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderContent = (content: string, msgId: string) => {
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        pre({ children }) {
                            return <>{children}</>;
                        },
                        code({ node, className, children, ...props }: any) {
                            const codeContent = String(children).replace(/\n$/, "");
                            const match = /language-(\w+)(?::apply)?/.exec(className || "");
                            
                            const isInline = !className && !codeContent.includes('\n');
                            
                            if (isInline) {
                                return (
                                    <code
                                        className="bg-zinc-800/60 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/50"
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            }

                            const lang = match ? match[1] : "";
                            const isApply = className?.includes(":apply");
                            const blockId = `${msgId}-code-${Math.random()}`;

                            return (
                                <div className="my-3 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden not-prose">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 text-xs text-zinc-400 border-b border-zinc-800">
                                        <span className="font-medium">{lang || "code"}</span>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 hover:bg-zinc-700"
                                                onClick={() => handleCopy(codeContent, blockId)}
                                            >
                                                {copiedId === blockId ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                            {isApply && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-zinc-700"
                                                    onClick={() => onApplyCode(codeContent)}
                                                >
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    Appliquer
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <pre className="p-3 text-xs overflow-x-auto m-0">
                                        <code className="text-zinc-300">{codeContent}</code>
                                    </pre>
                                </div>
                            );
                        },
                        h1({ children, ...props }: any) {
                            return <h1 className="text-base font-bold mt-4 mb-2" {...props}>{children}</h1>;
                        },
                        h2({ children, ...props }: any) {
                            return <h2 className="text-sm font-bold mt-3 mb-2" {...props}>{children}</h2>;
                        },
                        h3({ children, ...props }: any) {
                            return <h3 className="text-sm font-semibold mt-2 mb-1" {...props}>{children}</h3>;
                        },
                        p({ children, ...props }: any) {
                            return <p className="text-sm leading-relaxed my-2" {...props}>{children}</p>;
                        },
                        ul({ children, ...props }: any) {
                            return <ul className="list-disc list-inside space-y-1 text-sm my-2" {...props}>{children}</ul>;
                        },
                        ol({ children, ...props }: any) {
                            return <ol className="list-decimal list-inside space-y-1 text-sm my-2" {...props}>{children}</ol>;
                        },
                        strong({ children, ...props }: any) {
                            return <strong className="font-semibold text-foreground" {...props}>{children}</strong>;
                        },
                        em({ children, ...props }: any) {
                            return <em className="italic" {...props}>{children}</em>;
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-sidebar border-l">
            {/* Header - simplifié */}
            <div className="flex items-center justify-between px-3 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-sm">Prof</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={onClose}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <GraduationCap className="h-12 w-12 mb-3 text-emerald-500/50" />
                        <p className="text-sm">
                            Salut ! Je suis ton Prof.
                        </p>
                        <p className="text-xs mt-1">
                            Pose-moi une question sur ton code.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-lg",
                                    msg.role === "user"
                                        ? "bg-emerald-600 text-white px-3 py-2"
                                        : "bg-muted"
                                )}
                            >
                                {msg.role === "assistant" ? (
                                    <div className="px-3 py-2">
                                        {renderContent(msg.content, msg.id)}
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap m-0">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && messages[messages.length - 1]?.content === "" && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input - amélioré */}
            <div className="px-3 py-2 pb-4 border-t">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pose ta question..."
                        className="flex-1 h-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="h-9 w    -9 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}