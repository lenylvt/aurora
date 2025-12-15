import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XCircleIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Human-readable names for Composio tools
const TOOL_NAMES: Record<string, string> = {
  GEMINI_GENERATE_IMAGE: "Génération d'image",
  GEMINI_GENERATE_CONTENT: "Génération de texte",
  GEMINI_GENERATE_VIDEOS: "Génération de vidéo",
  GEMINI_COUNT_TOKENS: "Comptage de tokens",
  GEMINI_EMBED_CONTENT: "Embedding",
  GEMINI_LIST_MODELS: "Liste des modèles",
  GEMINI_WAIT_FOR_VIDEO: "Attente vidéo",
  GEMINI_GET_VIDEOS_OPERATION: "Statut vidéo",
};

const getDisplayName = (toolName: string): string => {
  return TOOL_NAMES[toolName] || toolName.replace(/_/g, " ").toLowerCase();
};

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  args,
  result,
  status,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Use args object directly instead of argsText to avoid streaming issues
  const argsDisplay = useMemo(() => {
    if (!args) return "{}";
    try {
      // Filter out null values to show cleaner output
      const filtered = Object.fromEntries(
        Object.entries(args).filter(([_, v]) => v !== null && v !== undefined)
      );
      return JSON.stringify(filtered, null, 2);
    } catch {
      return JSON.stringify(args, null, 2);
    }
  }, [args]);

  // Determine state
  const isRunning = status?.type === "running";
  const isComplete = status?.type === "complete";
  const isError = status?.type === "incomplete" && status.reason === "error";
  const isCancelled = status?.type === "incomplete" && status.reason === "cancelled";

  // Get error message
  const errorMessage = isError && status.error
    ? typeof status.error === "string"
      ? status.error
      : JSON.stringify(status.error)
    : null;

  const cancelledReason = isCancelled && status.error
    ? typeof status.error === "string"
      ? status.error
      : JSON.stringify(status.error)
    : null;

  const displayName = getDisplayName(toolName);

  // Determine icon and colors
  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader2Icon className="size-4 animate-spin text-primary" />;
    }
    if (isError) {
      return <AlertCircleIcon className="size-4 text-destructive" />;
    }
    if (isCancelled) {
      return <XCircleIcon className="size-4 text-muted-foreground" />;
    }
    return <CheckIcon className="size-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isRunning) return "En cours...";
    if (isError) return "Erreur";
    if (isCancelled) return "Annulé";
    return "Terminé";
  };

  return (
    <div
      className={cn(
        "aui-action-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3 transition-colors",
        isRunning && "border-primary/50 bg-primary/5",
        isError && "border-destructive/50 bg-destructive/5",
        isCancelled && "border-muted-foreground/30 bg-muted/30",
        isComplete && "border-green-500/30 bg-green-500/5",
      )}
    >
      <div className="aui-action-fallback-header flex items-center gap-2 px-4">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "aui-action-fallback-title text-sm font-medium",
              isCancelled && "text-muted-foreground line-through",
              isError && "text-destructive",
            )}
          >
            <span className="text-muted-foreground">{getStatusText()}: </span>
            <span className="font-semibold">{displayName}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronUpIcon className="size-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="aui-action-fallback-content flex flex-col gap-2 border-t pt-2">
          {/* Error message */}
          {errorMessage && (
            <div className="aui-action-fallback-error-root px-4">
              <p className="aui-action-fallback-error-header font-semibold text-destructive text-sm">
                Erreur:
              </p>
              <p className="aui-action-fallback-error-message text-destructive/80 text-sm">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Cancelled reason */}
          {cancelledReason && (
            <div className="aui-action-fallback-cancelled-root px-4">
              <p className="aui-action-fallback-cancelled-header font-semibold text-muted-foreground text-sm">
                Raison de l'annulation:
              </p>
              <p className="aui-action-fallback-cancelled-reason text-muted-foreground text-sm">
                {cancelledReason}
              </p>
            </div>
          )}

          {/* Arguments */}
          <div
            className={cn(
              "aui-action-fallback-args-root px-4",
              (isCancelled || isError) && "opacity-60",
            )}
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Paramètres:
            </p>
            <pre className="aui-action-fallback-args-value whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-md overflow-x-auto">
              {argsDisplay}
            </pre>
          </div>

          {/* Result */}
          {isComplete && result !== undefined && (
            <div className="aui-action-fallback-result-root border-t border-dashed px-4 pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Résultat:
              </p>
              <pre className="aui-action-fallback-result-content whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
