"use client";

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
import { cn } from "@/lib/utils";

// Human-readable names for tools
const TOOL_NAMES: Record<string, string> = {
  transcrire_video: "Transcription de la vidéo",
  create_file: "Création de fichier",
  recherche_internet: "Recherche Internet",
  afficher_traduction: "Traduction",
  afficher_synonymes: "Synonymes",
  afficher_conjugaison: "Conjugaison",
  afficher_antonymes: "Antonymes",
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
  const [isExpanded, setIsExpanded] = useState(false);

  const argsDisplay = useMemo(() => {
    if (!args) return "{}";
    try {
      const filtered = Object.fromEntries(
        Object.entries(args).filter(([_, v]) => v !== null && v !== undefined)
      );
      return JSON.stringify(filtered, null, 2);
    } catch {
      return JSON.stringify(args, null, 2);
    }
  }, [args]);

  const isRunning = status?.type === "running";
  const isComplete = status?.type === "complete";
  const isError = status?.type === "incomplete" && status.reason === "error";
  const isCancelled = status?.type === "incomplete" && status.reason === "cancelled";

  const errorMessage = isError && status.error
    ? typeof status.error === "string"
      ? status.error
      : JSON.stringify(status.error)
    : null;

  const displayName = getDisplayName(toolName);

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {isRunning && (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          )}
          {isError && (
            <AlertCircleIcon className="size-4 text-destructive" />
          )}
          {isCancelled && (
            <XCircleIcon className="size-4 text-muted-foreground" />
          )}
          {isComplete && (
            <CheckIcon className="size-4 text-emerald-500" />
          )}
        </div>

        {/* Tool name */}
        <span
          className={cn(
            "flex-1 text-sm font-medium truncate",
            isCancelled && "text-muted-foreground line-through",
            isError && "text-destructive",
          )}
        >
          {displayName}
        </span>

        {/* Status text */}
        <span className="text-xs text-muted-foreground">
          {isRunning && "En cours..."}
          {isError && "Erreur"}
          {isCancelled && "Annulé"}
          {isComplete && "Terminé"}
        </span>

        {/* Expand icon */}
        {isExpanded ? (
          <ChevronUpIcon className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/40 px-3 py-2.5 space-y-2.5">
          {/* Error message */}
          {errorMessage && (
            <div className="text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Arguments */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Paramètres</p>
            <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto font-mono">
              {argsDisplay}
            </pre>
          </div>

          {/* Result */}
          {isComplete && result !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Résultat</p>
              <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto font-mono">
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
