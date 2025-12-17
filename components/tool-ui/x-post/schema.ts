import { z } from "zod";
import {
    ToolUIIdSchema,
    parseWithSchema,
} from "../shared";

export const XPostAuthorSchema = z.object({
    name: z.string(),
    handle: z.string(),
    avatarUrl: z.string().url().optional(),
    verified: z.boolean().optional(),
});

export const XPostMediaSchema = z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url(),
    alt: z.string().optional(),
    aspectRatio: z.string().optional(),
});

export const XPostLinkPreviewSchema = z.object({
    url: z.string().url(),
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    domain: z.string().optional(),
});

export const XPostDataSchema = z.object({
    id: z.string(),
    author: XPostAuthorSchema,
    text: z.string().optional(),
    media: z.array(XPostMediaSchema).optional(),
    linkPreview: XPostLinkPreviewSchema.optional(),
    stats: z.object({
        likes: z.number().optional(),
        replies: z.number().optional(),
        reposts: z.number().optional(),
    }).optional(),
    createdAt: z.string().datetime().optional(),
});

export type XPostData = z.infer<typeof XPostDataSchema>;

const XPostQuotedSchema: z.ZodType<XPostData> = z.lazy(() => XPostDataSchema);

export const XPostPropsSchema = z.object({
    id: ToolUIIdSchema.optional(),
    post: XPostDataSchema.extend({
        quotedPost: XPostQuotedSchema.optional(),
    }),
});

export type XPostProps = z.infer<typeof XPostPropsSchema> & {
    className?: string;
    onAction?: (action: string, post: XPostData) => void;
};

export const SerializableXPostSchema = XPostPropsSchema;

export type SerializableXPost = z.infer<typeof SerializableXPostSchema>;

export function parseSerializableXPost(input: unknown): XPostData {
    const result = parseWithSchema(XPostPropsSchema, input, "XPost");
    return result.post;
}
