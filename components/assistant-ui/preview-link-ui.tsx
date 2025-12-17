"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
    MediaCard,
    MediaCardErrorBoundary,
    parseSerializableMediaCard,
} from "@/components/tool-ui/media-card";

/**
 * Tool UI for `preview_link` tool.
 */
export const PreviewLinkUI = makeAssistantToolUI({
    toolName: "preview_link",
    render: ({ result }) => {
        if (result === undefined) {
            return (
                <div className="w-full max-w-md animate-pulse">
                    <div className="h-32 bg-muted rounded-xl mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                </div>
            );
        }

        try {
            const card = parseSerializableMediaCard(result);
            return (
                <MediaCardErrorBoundary>
                    <MediaCard {...card} maxWidth="420px" />
                </MediaCardErrorBoundary>
            );
        } catch (error) {
            console.error("[PreviewLinkUI] Failed to parse result:", error);
            return (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm">
                    Failed to render link preview
                </div>
            );
        }
    },
});

/**
 * Tool UI for `show_media` tool - renders images, videos, audio with generation actions.
 */
export const ShowMediaUI = makeAssistantToolUI<unknown, { action: string } | null>({
    toolName: "show_media",
    render: ({ result, args, addResult }) => {
        console.log("[ShowMediaUI] Render", { result, args });

        // Show skeleton if no data at all
        if (result === undefined && !args) {
            return (
                <div className="w-full max-w-lg animate-pulse">
                    <div className="h-64 bg-muted rounded-xl mb-4" />
                    <div className="flex justify-center gap-3 pb-4">
                        <div className="h-10 w-24 bg-muted rounded-full" />
                        <div className="h-10 w-24 bg-muted rounded-full" />
                        <div className="h-10 w-24 bg-muted rounded-full" />
                    </div>
                </div>
            );
        }

        // Use result if available (after execute), otherwise use args (during streaming)
        const mediaData = result || args;
        if (!mediaData || mediaData === null || Array.isArray(mediaData) || typeof mediaData !== "object") {
            console.log("[ShowMediaUI] No valid media data");
            return null;
        }

        // Manually build the card data to handle missing fields
        const data = mediaData as Record<string, unknown>;

        // Generate missing required fields
        const cardData = {
            id: (data.id as string) || `media-${Date.now()}`,
            assetId: (data.assetId as string) || (data.id as string) || `asset-${Date.now()}`,
            kind: data.kind as "image" | "video" | "audio" | "link",
            src: data.src as string | undefined,
            title: data.title as string | undefined,
            description: data.description as string | undefined,
            alt: (data.alt as string) || (data.title as string) || "Generated media",
            ratio: data.ratio as "auto" | "1:1" | "4:3" | "16:9" | "9:16" | undefined,
        };

        console.log("[ShowMediaUI] Built card data:", cardData);

        // Check required fields
        if (!cardData.kind || !cardData.src) {
            console.log("[ShowMediaUI] Missing kind or src, showing skeleton");
            return (
                <div className="w-full max-w-lg animate-pulse">
                    <div className="h-64 bg-muted rounded-xl mb-4" />
                </div>
            );
        }

        // For generated images without result, show action buttons
        const showActions = (cardData.kind === "image" || cardData.kind === "video") && !result;

        return (
            <MediaCardErrorBoundary>
                <MediaCard
                    id={cardData.id}
                    assetId={cardData.assetId}
                    kind={cardData.kind}
                    src={cardData.src}
                    title={cardData.title}
                    description={cardData.description}
                    alt={cardData.alt}
                    ratio={cardData.ratio}
                    maxWidth="480px"
                    responseActions={showActions ? [
                        { id: "regenerate", label: "Réessayer", variant: "secondary" },
                        { id: "edit", label: "Modifier", variant: "outline" },
                        { id: "use", label: "Utiliser", variant: "default" },
                    ] : undefined}
                    onResponseAction={(actionId) => {
                        console.log("[ShowMediaUI] Action clicked:", actionId);
                        addResult({ action: actionId });
                    }}
                />
            </MediaCardErrorBoundary>
        );
    },
});
