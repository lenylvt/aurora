import { z } from "zod";
import {
    ToolUIIdSchema,
    ToolUIReceiptSchema,
    ToolUIRoleSchema,
    parseWithSchema,
} from "../shared";

export const CodeBlockPropsSchema = z.object({
    id: ToolUIIdSchema,
    role: ToolUIRoleSchema.optional(),
    receipt: ToolUIReceiptSchema.optional(),
    code: z.string(),
    language: z.string().optional(),
    filename: z.string().optional(),
    showLineNumbers: z.boolean().optional(),
    highlightLines: z.array(z.number()).optional(),
    maxCollapsedLines: z.number().optional(),
});

export type CodeBlockProps = z.infer<typeof CodeBlockPropsSchema> & {
    className?: string;
    isLoading?: boolean;
};

export const SerializableCodeBlockSchema = CodeBlockPropsSchema;

export type SerializableCodeBlock = z.infer<typeof SerializableCodeBlockSchema>;

export function parseSerializableCodeBlock(input: unknown): SerializableCodeBlock {
    return parseWithSchema(SerializableCodeBlockSchema, input, "CodeBlock");
}
