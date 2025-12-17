import type { ReactNode } from "react";
import type { ActionsProp, ToolUIReceipt, ToolUIRole } from "../shared";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export type FormatConfig =
    | { kind: "text" }
    | { kind: "number"; decimals?: number; unit?: string; compact?: boolean; showSign?: boolean }
    | { kind: "currency"; currency: string; decimals?: number }
    | { kind: "percent"; decimals?: number; showSign?: boolean; basis?: "fraction" | "unit" }
    | { kind: "date"; dateFormat?: "short" | "long" | "relative" }
    | { kind: "delta"; decimals?: number; upIsPositive?: boolean; showSign?: boolean }
    | { kind: "status"; statusMap: Record<string, { tone: Tone; label?: string }> }
    | { kind: "boolean"; labels?: { true: string; false: string } }
    | { kind: "link"; hrefKey?: string; external?: boolean }
    | { kind: "badge"; colorMap?: Record<string, Tone> }
    | { kind: "array"; maxVisible?: number };

export type RowPrimitive = string | number | boolean | null;
export type RowData = Record<string, RowPrimitive | RowPrimitive[]>;
export type ColumnKey<T> = keyof T & string;

export interface Column<T extends RowData> {
    key: ColumnKey<T>;
    label: string;
    abbr?: string;
    sortable?: boolean;
    align?: "left" | "right" | "center";
    width?: string;
    truncate?: boolean;
    priority?: "primary" | "secondary" | "tertiary";
    hideOnMobile?: boolean;
    format?: FormatConfig;
}

export interface SortState<T extends RowData> {
    by?: ColumnKey<T>;
    direction?: "asc" | "desc";
}

export interface DataTableSerializableProps<T extends RowData> {
    id: string;
    role?: ToolUIRole;
    receipt?: ToolUIReceipt;
    columns: Column<T>[];
    data: T[];
    layout?: "auto" | "table" | "cards";
}

export interface DataTableClientProps<T extends RowData> {
    rowIdKey?: ColumnKey<T>;
    className?: string;
    isLoading?: boolean;
    locale?: string;
    defaultSort?: SortState<T>;
    sort?: SortState<T>;
    onSortChange?: (sort: SortState<T>) => void;
    responseActions?: ActionsProp;
    onResponseAction?: (actionId: string) => void | Promise<void>;
    onBeforeResponseAction?: (actionId: string) => boolean | Promise<boolean>;
}

export interface DataTableProps<T extends RowData>
    extends DataTableSerializableProps<T>,
    DataTableClientProps<T> { }

export type DataTableRowData = RowData;
