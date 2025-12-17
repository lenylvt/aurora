import { z } from "zod";
import {
    ToolUIIdSchema,
    ToolUIReceiptSchema,
    ToolUIRoleSchema,
    parseWithSchema,
} from "../shared";
import type { Column, DataTableProps, RowData } from "./types";

const AlignEnum = z.enum(["left", "right", "center"]);
const PriorityEnum = z.enum(["primary", "secondary", "tertiary"]);
const LayoutEnum = z.enum(["auto", "table", "cards"]);

const formatSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text") }),
    z.object({
        kind: z.literal("number"),
        decimals: z.number().optional(),
        unit: z.string().optional(),
        compact: z.boolean().optional(),
        showSign: z.boolean().optional(),
    }),
    z.object({
        kind: z.literal("currency"),
        currency: z.string(),
        decimals: z.number().optional(),
    }),
    z.object({
        kind: z.literal("percent"),
        decimals: z.number().optional(),
        showSign: z.boolean().optional(),
        basis: z.enum(["fraction", "unit"]).optional(),
    }),
    z.object({
        kind: z.literal("date"),
        dateFormat: z.enum(["short", "long", "relative"]).optional(),
    }),
    z.object({
        kind: z.literal("delta"),
        decimals: z.number().optional(),
        upIsPositive: z.boolean().optional(),
        showSign: z.boolean().optional(),
    }),
    z.object({
        kind: z.literal("status"),
        statusMap: z.record(
            z.string(),
            z.object({
                tone: z.enum(["success", "warning", "danger", "info", "neutral"]),
                label: z.string().optional(),
            }),
        ),
    }),
    z.object({
        kind: z.literal("boolean"),
        labels: z
            .object({
                true: z.string(),
                false: z.string(),
            })
            .optional(),
    }),
    z.object({
        kind: z.literal("link"),
        hrefKey: z.string().optional(),
        external: z.boolean().optional(),
    }),
    z.object({
        kind: z.literal("badge"),
        colorMap: z
            .record(
                z.string(),
                z.enum(["success", "warning", "danger", "info", "neutral"]),
            )
            .optional(),
    }),
    z.object({
        kind: z.literal("array"),
        maxVisible: z.number().optional(),
    }),
]);

export const serializableColumnSchema = z.object({
    key: z.string(),
    label: z.string(),
    abbr: z.string().optional(),
    sortable: z.boolean().optional(),
    align: AlignEnum.optional(),
    width: z.string().optional(),
    truncate: z.boolean().optional(),
    priority: PriorityEnum.optional(),
    hideOnMobile: z.boolean().optional(),
    format: formatSchema.optional(),
});

const JsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const serializableDataSchema = z.record(
    z.string(),
    z.union([JsonPrimitiveSchema, z.array(JsonPrimitiveSchema)]),
);

export const SerializableDataTableSchema = z.object({
    id: ToolUIIdSchema,
    role: ToolUIRoleSchema.optional(),
    receipt: ToolUIReceiptSchema.optional(),
    columns: z.array(serializableColumnSchema),
    data: z.array(serializableDataSchema),
    layout: LayoutEnum.optional(),
});

export type SerializableDataTable = z.infer<typeof SerializableDataTableSchema>;

export function parseSerializableDataTable(
    input: unknown,
): Pick<
    DataTableProps<RowData>,
    "id" | "role" | "receipt" | "columns" | "data" | "layout"
> {
    const { id, role, receipt, columns, data, layout } = parseWithSchema(
        SerializableDataTableSchema,
        input,
        "DataTable",
    );
    return {
        id,
        role,
        receipt,
        columns: columns as unknown as Column<RowData>[],
        data: data as RowData[],
        layout,
    };
}
