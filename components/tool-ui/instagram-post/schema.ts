import { z } from "zod";
import {
    ToolUIIdSchema,
    parseWithSchema,
} from "../shared";

export const InstagramAuthorSchema = z.object({
    name: z.string(),
    handle: z.string(),
    avatarUrl: z.string().url().optional(),
    verified: z.boolean().optional(),
});

export const InstagramMediaSchema = z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url(),
    alt: z.string().optional(),
});

export const InstagramPostDataSchema = z.object({
    id: z.string(),
    author: InstagramAuthorSchema,
    text: z.string().optional(),
    media: z.array(InstagramMediaSchema).optional(),
    stats: z.object({
        likes: z.number().optional(),
        comments: z.number().optional(),
    }).optional(),
    createdAt: z.string().datetime().optional(),
});

export type InstagramPostData = z.infer<typeof InstagramPostDataSchema>;

export const InstagramPostPropsSchema = z.object({
    id: ToolUIIdSchema.optional(),
    post: InstagramPostDataSchema,
});

export type InstagramPostProps = z.infer<typeof InstagramPostPropsSchema> & {
    className?: string;
    onAction?: (action: string, post: InstagramPostData) => void;
};

export const SerializableInstagramPostSchema = InstagramPostPropsSchema;

export type SerializableInstagramPost = z.infer<typeof SerializableInstagramPostSchema>;

export function parseSerializableInstagramPost(input: unknown): InstagramPostData {
    const result = parseWithSchema(InstagramPostPropsSchema, input, "InstagramPost");
    return result.post;
}
