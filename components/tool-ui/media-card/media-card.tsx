"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SerializableMediaCard, parseSerializableMediaCard } from "./schema";
import { MediaCardProvider, MediaCardClientProps, MediaCardUIState, MediaCardContextValue } from "./context";
import { normalizeActionsConfig, getDomain } from "../shared";
import { ExternalLink, Play, Pause, Volume2, VolumeX, Download } from "lucide-react";

export const FALLBACK_LOCALE = "en-US" as const;

export type MediaCardProps = SerializableMediaCard & MediaCardClientProps;

function sanitizeHref(href?: string) {
    if (!href) return undefined;
    try {
        const url = new URL(href);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.toString();
        }
    } catch {
        return undefined;
    }
    return undefined;
}

function AspectContainer({
    ratio,
    children,
}: {
    ratio?: string;
    children: React.ReactNode;
}) {
    const aspectClass = {
        "1:1": "aspect-square",
        "4:3": "aspect-[4/3]",
        "16:9": "aspect-video",
        "9:16": "aspect-[9/16]",
    }[ratio || ""] || "";

    return (
        <div className={cn("relative w-full overflow-hidden rounded-xl", aspectClass || "min-h-[200px]")}>
            {children}
        </div>
    );
}

function ImageContent({
    src,
    alt,
    fit = "cover",
}: {
    src: string;
    alt: string;
    fit?: "cover" | "contain";
}) {
    return (
        <img
            src={src}
            alt={alt}
            className={cn(
                "absolute inset-0 h-full w-full",
                fit === "cover" ? "object-cover" : "object-contain"
            )}
        />
    );
}

function VideoContent({
    src,
    thumb,
}: {
    src: string;
    thumb?: string;
}) {
    const [playing, setPlaying] = React.useState(false);
    const [muted, setMuted] = React.useState(true);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (playing) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setPlaying(!playing);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !muted;
            setMuted(!muted);
        }
    };

    return (
        <div className="relative h-full w-full">
            <video
                ref={videoRef}
                src={src}
                poster={thumb}
                muted={muted}
                className="absolute inset-0 h-full w-full object-cover"
                onEnded={() => setPlaying(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <button
                    onClick={togglePlay}
                    className="rounded-full bg-black/50 p-4 text-white backdrop-blur-sm transition hover:bg-black/70"
                >
                    {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
            </div>
            <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
            >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
        </div>
    );
}

function AudioContent({
    src,
    title,
}: {
    src: string;
    title?: string;
}) {
    return (
        <div className="p-4">
            <audio src={src} controls className="w-full" />
            {title && <p className="mt-2 text-sm text-muted-foreground">{title}</p>}
        </div>
    );
}

function LinkContent({
    card,
    resolvedHref,
}: {
    card: SerializableMediaCard;
    resolvedHref?: string;
}) {
    const domain = card.domain || (resolvedHref ? getDomain(resolvedHref) : "");

    return (
        <a
            href={resolvedHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-4 hover:bg-accent/50 transition-colors"
        >
            {card.thumb && (
                <div className="aspect-video relative overflow-hidden rounded-lg mb-3">
                    <img
                        src={card.thumb}
                        alt={card.title || "Link preview"}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>
            )}
            <div className="flex flex-col gap-1">
                {card.title && (
                    <h3 className="font-medium text-foreground line-clamp-2">{card.title}</h3>
                )}
                {card.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{card.description}</p>
                )}
                {domain && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>{domain}</span>
                    </div>
                )}
            </div>
        </a>
    );
}

function LoadingSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-xl mb-4" />
            <div className="flex justify-center gap-3 p-4">
                <div className="h-10 w-24 bg-muted rounded-full" />
                <div className="h-10 w-24 bg-muted rounded-full" />
                <div className="h-10 w-24 bg-muted rounded-full" />
            </div>
        </div>
    );
}

// Pill-style action button component like in the reference image
function PillButton({
    label,
    variant = "secondary",
    onClick,
}: {
    label: string;
    variant?: "default" | "secondary" | "outline";
    onClick?: () => void;
}) {
    const baseClasses = "px-6 py-2.5 rounded-full text-sm font-medium transition-colors";

    const variantClasses = {
        default: "bg-foreground text-background hover:bg-foreground/90",
        secondary: "bg-muted hover:bg-muted/80 text-foreground",
        outline: "border border-border hover:bg-accent text-foreground",
    };

    return (
        <button
            onClick={onClick}
            className={cn(baseClasses, variantClasses[variant])}
        >
            {label}
        </button>
    );
}

export function MediaCard(props: MediaCardProps) {
    const {
        className,
        maxWidth,
        isLoading,
        state: controlledState,
        defaultState,
        onStateChange,
        onNavigate,
        onMediaEvent,
        responseActions,
        onResponseAction,
        onBeforeResponseAction,
        onMediaAction,
        onBeforeMediaAction,
        locale: providedLocale,
        ...serializable
    } = props;

    const { href: rawHref, source, ...rest } = serializable;
    const locale = providedLocale ?? FALLBACK_LOCALE;

    const sanitizedHref = sanitizeHref(rawHref);
    const sanitizedSourceUrl = sanitizeHref(source?.url);

    const cardPayload: SerializableMediaCard = {
        ...rest,
        href: sanitizedHref,
        source: source
            ? {
                ...source,
                url: sanitizedSourceUrl,
            }
            : undefined,
        locale,
    };

    const [uncontrolledState, setUncontrolledState] =
        React.useState<MediaCardUIState>(() => defaultState ?? {});
    const effectiveState = controlledState ?? uncontrolledState;

    const updateState = React.useCallback(
        (patch: Partial<MediaCardUIState>) => {
            if (controlledState) {
                const next = { ...controlledState, ...patch };
                onStateChange?.(next);
                return;
            }
            setUncontrolledState((prev) => {
                const next = { ...prev, ...patch };
                onStateChange?.(next);
                return next;
            });
        },
        [controlledState, onStateChange],
    );

    const [mediaElement, setMediaElement] =
        React.useState<HTMLMediaElement | null>(null);

    const resolvedHref = React.useMemo(() => {
        if (cardPayload.kind === "link") {
            return cardPayload.href ?? sanitizeHref(cardPayload.src);
        }
        return cardPayload.href;
    }, [cardPayload.href, cardPayload.kind, cardPayload.src]);

    const value: MediaCardContextValue = {
        card: cardPayload,
        locale,
        resolvedHref,
        resolvedSourceUrl: sanitizedSourceUrl,
        state: effectiveState,
        setState: updateState,
        handlers: {
            onNavigate,
            onMediaAction,
            onBeforeMediaAction,
            onMediaEvent,
        },
        mediaElement,
        setMediaElement,
    };

    const containerStyle: React.CSSProperties = maxWidth
        ? { maxWidth, width: "100%" }
        : { width: "100%" };

    const isImageCard = cardPayload.kind === "image";
    const isVideoCard = cardPayload.kind === "video";
    const isAudioCard = cardPayload.kind === "audio";
    const isLinkCard = cardPayload.kind === "link";

    const normalizedFooterActions = React.useMemo(
        () => normalizeActionsConfig(responseActions),
        [responseActions],
    );

    const handleAction = async (actionId: string) => {
        if (onBeforeResponseAction) {
            const shouldProceed = await onBeforeResponseAction(actionId);
            if (!shouldProceed) return;
        }
        onResponseAction?.(actionId);
    };

    return (
        <MediaCardProvider value={value}>
            <div
                data-tool-ui-id={cardPayload.id}
                data-slot="media-card"
                className={cn(
                    "bg-card rounded-2xl overflow-hidden shadow-sm",
                    className
                )}
                style={containerStyle}
            >
                {isLoading ? (
                    <LoadingSkeleton />
                ) : (
                    <>
                        {/* Media content */}
                        <div className="p-3">
                            {isImageCard && (
                                <AspectContainer ratio={cardPayload.ratio}>
                                    <ImageContent
                                        src={cardPayload.src!}
                                        alt={cardPayload.alt || ""}
                                        fit={cardPayload.fit}
                                    />
                                </AspectContainer>
                            )}
                            {isVideoCard && (
                                <AspectContainer ratio={cardPayload.ratio || "16:9"}>
                                    <VideoContent src={cardPayload.src!} thumb={cardPayload.thumb} />
                                </AspectContainer>
                            )}
                            {isAudioCard && (
                                <AudioContent src={cardPayload.src!} title={cardPayload.title} />
                            )}
                            {isLinkCard && (
                                <LinkContent card={cardPayload} resolvedHref={resolvedHref} />
                            )}
                        </div>

                        {/* Actions - pill style like in reference image */}
                        {normalizedFooterActions && normalizedFooterActions.items.length > 0 && (
                            <div className="flex justify-center gap-3 px-4 pb-5 pt-2">
                                {normalizedFooterActions.items.map((action) => (
                                    <PillButton
                                        key={action.id}
                                        label={action.label}
                                        variant={action.variant as "default" | "secondary" | "outline" | undefined}
                                        onClick={() => handleAction(action.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </MediaCardProvider>
    );
}
