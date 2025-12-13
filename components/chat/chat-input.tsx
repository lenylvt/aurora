"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Paperclip, X, Loader2, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { processFile, ProcessedFile } from "@/lib/files/processor";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  onSend: (message: string, files?: ProcessedFile[]) => void;
  disabled?: boolean;
  lastFailedMessage?: {
    content: string;
    files?: ProcessedFile[];
  } | null;
}

export function ChatInput({ onSend, disabled, lastFailedMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (lastFailedMessage) {
      setMessage(lastFailedMessage.content);
      if (lastFailedMessage.files) {
        setProcessedFiles(lastFailedMessage.files);
      }
    }
  }, [lastFailedMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() && processedFiles.length === 0) return;
    if (disabled || isProcessing) return;

    onSend(message, processedFiles.length > 0 ? processedFiles : undefined);
    setMessage("");
    setFiles([]);
    setProcessedFiles([]);
    setError("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    const existingImages = files.filter((f) => f.type.startsWith("image/"));

    if (existingImages.length + imageFiles.length > 10) {
      setError(`Trop d'images: ${existingImages.length + imageFiles.length}. Maximum: 10.`);
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(true);
    setError("");

    try {
      const processed = await Promise.all(newFiles.map((file) => processFile(file)));
      setProcessedFiles((prev) => [...prev, ...processed]);
    } catch (err: any) {
      setError(err.message || "Erreur lors du traitement des fichiers");
      setFiles((prev) => prev.filter((f) => !newFiles.includes(f)));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setProcessedFiles((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-3 w-3" />;
    if (type === "application/pdf") return <FileText className="h-3 w-3" />;
    return <Paperclip className="h-3 w-3" />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {error && (
        <div className="mb-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {files.map((file, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="flex items-center gap-1 pl-1.5 pr-1 py-0.5 text-xs h-6"
            >
              {getFileIcon(file.type)}
              <span className="max-w-[100px] truncate text-[11px]">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(idx)}
                disabled={isProcessing}
                className="h-4 w-4 hover:bg-background/50"
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-background border rounded-3xl shadow-lg p-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.json"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileClick}
          disabled={disabled || isProcessing}
          className="shrink-0 h-10 w-10 rounded-full"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none",
            "border-0 bg-transparent px-4 py-3 text-sm",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          disabled={disabled || isProcessing}
          rows={1}
        />

        <Button
          onClick={handleSubmit}
          disabled={disabled || isProcessing || (!message.trim() && processedFiles.length === 0)}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
