import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { MarkdownMessage } from "./markdown-message";
import { useMemo } from "react";

interface FileAttachment {
  name: string;
  type: string;
}

interface ChatMessageProps {
  message: Message;
}

// Helper function to safely parse files
function parseFiles(files: unknown): FileAttachment[] {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  if (typeof files === 'string') {
    try {
      const parsed = JSON.parse(files);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  // Safely parse files - handles both string and array formats
  const files = useMemo(() => parseFiles(message.files), [message.files]);

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
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/30">
            {files.map((file, idx) => (
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