"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat2, Share, BadgeCheck, ExternalLink } from "lucide-react";
import { formatRelativeTime, formatCount } from "../shared";
import { ActionButtons, normalizeActionsConfig, type ActionsProp } from "../shared";
import type { XPostProps, XPostData } from "./schema";

function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function PostHeader({ author, createdAt }: { author: XPostData["author"]; createdAt?: string }) {
    return (
        <div className="flex items-center gap-2">
            {author.avatarUrl && (
                <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="h-10 w-10 rounded-full"
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <span className="font-bold truncate">{author.name}</span>
                    {author.verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <span>@{author.handle}</span>
                    {createdAt && (
                        <>
                            <span>·</span>
                            <time>{formatRelativeTime(createdAt)}</time>
                        </>
                    )}
                </div>
            </div>
            <XIcon className="h-5 w-5 text-foreground flex-shrink-0" />
        </div>
    );
}

function PostMedia({ media }: { media: NonNullable<XPostData["media"]> }) {
    if (media.length === 0) return null;

    return (
        <div className={cn(
            "grid gap-0.5 rounded-2xl overflow-hidden",
            media.length === 1 && "grid-cols-1",
            media.length === 2 && "grid-cols-2",
            media.length >= 3 && "grid-cols-2 grid-rows-2"
        )}>
            {media.slice(0, 4).map((item, i) => (
                <div
                    key={i}
                    className={cn(
                        "relative bg-muted aspect-video",
                        media.length === 3 && i === 0 && "row-span-2 aspect-auto h-full"
                    )}
                >
                    {item.type === "image" ? (
                        <img
                            src={item.url}
                            alt={item.alt || ""}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <video
                            src={item.url}
                            controls
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function PostStats({ stats, onAction, post }: {
    stats?: XPostData["stats"];
    onAction?: (action: string, post: XPostData) => void;
    post: XPostData;
}) {
    return (
        <div className="flex items-center justify-between text-muted-foreground mt-3">
            <button
                onClick={() => onAction?.("reply", post)}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
                <MessageCircle className="h-4 w-4" />
                {stats?.replies !== undefined && (
                    <span className="text-xs">{formatCount(stats.replies)}</span>
                )}
            </button>
            <button
                onClick={() => onAction?.("repost", post)}
                className="flex items-center gap-1 hover:text-green-500 transition-colors"
            >
                <Repeat2 className="h-4 w-4" />
                {stats?.reposts !== undefined && (
                    <span className="text-xs">{formatCount(stats.reposts)}</span>
                )}
            </button>
            <button
                onClick={() => onAction?.("like", post)}
                className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
                <Heart className="h-4 w-4" />
                {stats?.likes !== undefined && (
                    <span className="text-xs">{formatCount(stats.likes)}</span>
                )}
            </button>
            <button
                onClick={() => onAction?.("share", post)}
                className="hover:text-blue-500 transition-colors"
            >
                <Share className="h-4 w-4" />
            </button>
        </div>
    );
}

export function XPost({
    post,
    className,
    onAction,
    responseActions,
    onResponseAction,
    onBeforeResponseAction,
}: XPostProps & {
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
                "w-full max-w-[540px] rounded-2xl border bg-card p-4",
                className
            )}
            data-tool-ui-id={post.id}
            data-slot="x-post"
        >
            <PostHeader author={post.author} createdAt={post.createdAt} />

            {post.text && (
                <p className="mt-3 whitespace-pre-wrap">{post.text}</p>
            )}

            {post.media && post.media.length > 0 && (
                <div className="mt-3">
                    <PostMedia media={post.media} />
                </div>
            )}

            {post.linkPreview && (
                <a
                    href={post.linkPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block rounded-2xl border overflow-hidden hover:bg-accent/50 transition-colors"
                >
                    {post.linkPreview.imageUrl && (
                        <img
                            src={post.linkPreview.imageUrl}
                            alt=""
                            className="w-full aspect-video object-cover"
                        />
                    )}
                    <div className="p-3">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {post.linkPreview.domain}
                        </div>
                        {post.linkPreview.title && (
                            <div className="font-medium mt-1">{post.linkPreview.title}</div>
                        )}
                        {post.linkPreview.description && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                                {post.linkPreview.description}
                            </div>
                        )}
                    </div>
                </a>
            )}

            <PostStats stats={post.stats} onAction={onAction} post={post} />

            {normalizedActions && (
                <div className="mt-4 pt-3 border-t">
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
