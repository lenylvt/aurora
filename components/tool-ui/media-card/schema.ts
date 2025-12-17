import { z } from "zod";
import {
    ToolUIIdSchema,
    ToolUIReceiptSchema,
    ToolUIRoleSchema,
    parseWithSchema,
} from "../shared";

export const MediaKindSchema = z.enum(["image", "video", "audio", "link"]);
export type MediaCardKind = z.infer<typeof MediaKindSchema>;

export const AspectRatioSchema = z
    .enum(["auto", "1:1", "4:3", "16:9", "9:16"])
    .default("auto");
export type Aspect = z.infer<typeof AspectRatioSchema>;

export const MediaFitSchema = z.enum(["cover", "contain"]).default("cover");
export type Fit = z.infer<typeof MediaFitSchema>;

export const SerializableMediaCardSchema = z
    .object({
        /**
         * Unique identifier for this tool UI instance in the conversation.
         */
        id: ToolUIIdSchema,
        role: ToolUIRoleSchema.optional(),
        receipt: ToolUIReceiptSchema.optional(),
        /**
         * The media asset's persistent identifier.
         */
        assetId: z.string(),
        kind: MediaKindSchema,
        title: z.string().optional(),
        description: z.string().optional(),
        createdAt: z.string().datetime().optional(),
        locale: z.string().optional(),
        href: z.string().url().optional(),
        domain: z.string().optional(),
        source: z
            .object({
                label: z.string(),
                iconUrl: z.string().url().optional(),
                url: z.string().url().optional(),
            })
            .optional(),
        ratio: AspectRatioSchema.optional(),
        fit: MediaFitSchema.optional(),
        src: z.string().url().optional(),
        thumb: z.string().url().optional(),
        alt: z.string().optional(),
        durationMs: z.number().int().positive().optional(),
        fileSizeBytes: z.number().int().positive().optional(),
        og: z
            .object({
                title: z.string().optional(),
                description: z.string().optional(),
                imageUrl: z.string().url().optional(),
            })
            .optional(),
    })
    .superRefine((value, ctx) => {
        if (value.kind === "image" && !(value.alt && value.alt.trim())) {
            ctx.addIssue({
                code: "custom",
                message: "Images require alt text.",
            });
        }
        if (
            (value.kind === "image" ||
                value.kind === "video" ||
                value.kind === "audio") &&
            !value.src
        ) {
            ctx.addIssue({
                code: "custom",
                message: `${value.kind} requires src.`,
            });
        }
        if (value.kind === "link" && !value.href && !value.src) {
            ctx.addIssue({
                code: "custom",
                message: "link requires href or src.",
            });
        }
    });

export type SerializableMediaCard = z.infer<typeof SerializableMediaCardSchema>;

export function parseSerializableMediaCard(input: unknown) {
    return parseWithSchema(SerializableMediaCardSchema, input, "MediaCard");
}
