"use client";

import { type FC } from "react";
import { MarkdownMessage } from "@/components/chat/markdown-message";
import type { Message } from "@/types";

interface LoadedMessagesProps {
    messages: Message[];
}

export const LoadedMessages: FC<LoadedMessagesProps> = ({ messages }) => {
    if (messages.length === 0) return null;

    return (
        <>
            {messages.map((message) => (
                message.role === "user" ? (
                    // User message - exact same styling as UserMessage in thread.tsx
                    <div
                        key={message.$id}
                        className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
                        data-role="user"
                    >
                        <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
                            <div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Assistant message - exact same styling as AssistantMessage in thread.tsx
                    <div
                        key={message.$id}
                        className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
                        data-role="assistant"
                    >
                        <div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
                            <MarkdownMessage content={message.content} />
                        </div>
                    </div>
                )
            ))}

            {/* Séparateur visuel entre historique et nouveaux messages */}
            <div className="mx-auto w-full max-w-(--thread-max-width) py-2">
                <div className="border-b border-border/50" />
            </div>
        </>
    );
};

