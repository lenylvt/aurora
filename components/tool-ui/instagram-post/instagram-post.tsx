"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Heart, MessageCircle, Send, Bookmark, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime, formatCount } from "../shared";
import { ActionButtons, normalizeActionsConfig, type ActionsProp } from "../shared";
import type { InstagramPostProps, InstagramPostData } from "./schema";

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}

function MediaCarousel({ media }: { media: NonNullable<InstagramPostData["media"]> }) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const hasMultiple = media.length > 1;

    if (media.length === 0) return null;

    return (
        <div className="relative aspect-square bg-black">
            {media[currentIndex].type === "image" ? (
                <img
                    src={media[currentIndex].url}
                    alt={media[currentIndex].alt || ""}
                    className="h-full w-full object-cover"
                />
            ) : (
                <video
                    src={media[currentIndex].url}
                    controls
                    className="h-full w-full object-cover"
                />
            )}

            {hasMultiple && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={() => setCurrentIndex(i => i - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-lg hover:bg-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    )}
                    {currentIndex < media.length - 1 && (
                        <button
                            onClick={() => setCurrentIndex(i => i + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-lg hover:bg-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                        {media.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-colors",
                                    i === currentIndex ? "bg-blue-500" : "bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function InstagramPost({
    post,
    className,
    onAction,
    responseActions,
    onResponseAction,
    onBeforeResponseAction,
}: InstagramPostProps & {
    responseActions?: ActionsProp;
    onResponseAction?: (actionId: string) => void | Promise<void>;
    onBeforeResponseAction?: (actionId: string) => boolean | Promise<boolean>;
}) {
    const normalizedActions = React.useMemo(
        () => normalizeActionsConfig(responseActions),
        [responseActions]
    );

    return (
        <div
            className={cn(
                "w-full max-w-[470px] rounded-lg border bg-card overflow-hidden",
                className
            )}
            data-tool-ui-id={post.id}
            data-slot="instagram-post"
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                {post.author.avatarUrl && (
                    <img
                        src={post.author.avatarUrl}
                        alt={post.author.name}
                        className="h-8 w-8 rounded-full ring-2 ring-pink-500/20"
                    />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm">{post.author.handle}</span>
                        {post.author.verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                        )}
                    </div>
                </div>
                <InstagramIcon className="h-5 w-5" />
            </div>

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <MediaCarousel media={post.media} />
            )}

            {/* Actions */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onAction?.("like", post)}
                        className="hover:opacity-60 transition-opacity"
                    >
                        <Heart className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => onAction?.("comment", post)}
                        className="hover:opacity-60 transition-opacity"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => onAction?.("share", post)}
                        className="hover:opacity-60 transition-opacity"
                    >
                        <Send className="h-6 w-6" />
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => onAction?.("save", post)}
                        className="hover:opacity-60 transition-opacity"
                    >
                        <Bookmark className="h-6 w-6" />
                    </button>
                </div>

                {/* Likes */}
                {post.stats?.likes !== undefined && (
                    <div className="mt-2 text-sm font-semibold">
                        {formatCount(post.stats.likes)} J'aime
                    </div>
                )}

                {/* Caption */}
                {post.text && (
                    <div className="mt-1 text-sm">
                        <span className="font-semibold mr-1">{post.author.handle}</span>
                        {post.text}
                    </div>
                )}

                {/* Comments */}
                {post.stats?.comments !== undefined && post.stats.comments > 0 && (
                    <button className="mt-1 text-sm text-muted-foreground">
                        Voir les {formatCount(post.stats.comments)} commentaires
                    </button>
                )}

                {/* Time */}
                {post.createdAt && (
                    <div className="mt-1 text-xs text-muted-foreground uppercase">
                        {formatRelativeTime(post.createdAt)}
                    </div>
                )}
            </div>

            {normalizedActions && (
                <div className="px-4 pb-4">
                    <ActionButtons
                        actions={normalizedActions.items}
                        align={normalizedActions.align}
                        confirmTimeout={normalizedActions.confirmTimeout}
                        onAction={(actionId) => onResponseAction?.(actionId)}
                        onBeforeAction={onBeforeResponseAction}
                    />
                </div>
            )}
        </div>
    );
}
