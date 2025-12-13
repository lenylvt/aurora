import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { MarkdownMessage } from "./markdown-message";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-foreground"
        )}
      >
        {/* Fichiers attachés */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/30">
            {message.files.map((file, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-xs px-2 py-1 rounded-md flex items-center gap-1.5",
                  isUser ? "bg-primary-foreground/10" : "bg-background/50"
                )}
              >
                <span className="text-sm">
                  {file.type.startsWith("image/") && "🖼️"}
                  {file.type === "application/pdf" && "📄"}
                  {!file.type.startsWith("image/") &&
                    file.type !== "application/pdf" &&
                    "📎"}
                </span>
                <span className="font-medium">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Contenu du message */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <MarkdownMessage content={message.content} />
        )}
      </div>
    </div>
  );
}
