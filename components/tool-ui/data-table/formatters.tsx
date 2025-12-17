"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FormatConfig, RowData, Tone } from "./types";

const TONE_CLASSES: Record<Tone, string> = {
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function NumberValue({
    value,
    options,
    locale = "en-US",
}: {
    value: number;
    options: Extract<FormatConfig, { kind: "number" }>;
    locale?: string;
}) {
    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: options.decimals,
        maximumFractionDigits: options.decimals,
        signDisplay: options.showSign ? "always" : "auto",
    }).format(value);
    return <span>{formatted}{options.unit || ""}</span>;
}

export function CurrencyValue({
    value,
    options,
    locale = "en-US",
}: {
    value: number;
    options: Extract<FormatConfig, { kind: "currency" }>;
    locale?: string;
}) {
    const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: options.currency,
        minimumFractionDigits: options.decimals,
        maximumFractionDigits: options.decimals,
    }).format(value);
    return <span>{formatted}</span>;
}

export function PercentValue({
    value,
    options,
}: {
    value: number;
    options: Extract<FormatConfig, { kind: "percent" }>;
}) {
    const pct = options.basis === "unit" ? value : value * 100;
    const sign = options.showSign && pct > 0 ? "+" : "";
    return <span>{sign}{pct.toFixed(options.decimals ?? 0)}%</span>;
}

export function DeltaValue({
    value,
    options,
}: {
    value: number;
    options: Extract<FormatConfig, { kind: "delta" }>;
}) {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const upIsPositive = options.upIsPositive ?? true;
    const colorClass = (upIsPositive ? isPositive : isNegative)
        ? "text-green-600 dark:text-green-400"
        : (upIsPositive ? isNegative : isPositive)
            ? "text-red-600 dark:text-red-400"
            : "";
    const sign = options.showSign && isPositive ? "+" : "";
    return (
        <span className={colorClass}>
            {sign}{value.toFixed(options.decimals ?? 0)}
        </span>
    );
}

export function DateValue({
    value,
    options,
    locale = "en-US",
}: {
    value: string;
    options: Extract<FormatConfig, { kind: "date" }>;
    locale?: string;
}) {
    const date = new Date(value);
    if (options.dateFormat === "relative") {
        const seconds = Math.round((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return <span>{seconds}s ago</span>;
        if (seconds < 3600) return <span>{Math.round(seconds / 60)}m ago</span>;
        if (seconds < 86400) return <span>{Math.round(seconds / 3600)}h ago</span>;
        return <span>{Math.round(seconds / 86400)}d ago</span>;
    }
    const formatted = new Intl.DateTimeFormat(locale, {
        dateStyle: options.dateFormat === "long" ? "long" : "short",
    }).format(date);
    return <span>{formatted}</span>;
}

export function BooleanValue({
    value,
    options,
}: {
    value: boolean;
    options: Extract<FormatConfig, { kind: "boolean" }>;
}) {
    const label = value
        ? options.labels?.true ?? "Yes"
        : options.labels?.false ?? "No";
    return <span>{label}</span>;
}

export function LinkValue({
    value,
    row,
    options,
}: {
    value: string;
    row?: RowData;
    options: Extract<FormatConfig, { kind: "link" }>;
}) {
    const href = options.hrefKey && row ? String(row[options.hrefKey]) : value;
    return (
        <a
            href={href}
            target={options.external ? "_blank" : undefined}
            rel={options.external ? "noopener noreferrer" : undefined}
            className="text-primary underline hover:no-underline"
        >
            {value}
        </a>
    );
}

export function BadgeValue({
    value,
    options,
}: {
    value: string;
    options: Extract<FormatConfig, { kind: "badge" }>;
}) {
    const tone = options.colorMap?.[value] ?? "neutral";
    return (
        <Badge variant="outline" className={cn("font-normal", TONE_CLASSES[tone])}>
            {value}
        </Badge>
    );
}

export function StatusBadge({
    value,
    options,
}: {
    value: string;
    options: Extract<FormatConfig, { kind: "status" }>;
}) {
    const status = options.statusMap[value];
    if (!status) return <span>{value}</span>;
    return (
        <Badge variant="outline" className={cn("font-normal", TONE_CLASSES[status.tone])}>
            {status.label ?? value}
        </Badge>
    );
}

export function ArrayValue({
    value,
    options,
}: {
    value: unknown[];
    options: Extract<FormatConfig, { kind: "array" }>;
}) {
    const maxVisible = options.maxVisible ?? 3;
    const visible = value.slice(0, maxVisible);
    const remaining = value.length - maxVisible;
    return (
        <span>
            {visible.map((v, i) => (
                <span key={i}>
                    {i > 0 && ", "}
                    {String(v)}
                </span>
            ))}
            {remaining > 0 && <span className="text-muted-foreground"> +{remaining}</span>}
        </span>
    );
}

export function renderFormattedValue(
    value: unknown,
    format: FormatConfig | undefined,
    row: RowData,
    locale: string = "en-US",
): React.ReactNode {
    if (value === null || value === undefined) return <span>—</span>;

    if (!format || format.kind === "text") {
        return <span>{String(value)}</span>;
    }

    switch (format.kind) {
        case "number":
            return <NumberValue value={Number(value)} options={format} locale={locale} />;
        case "currency":
            return <CurrencyValue value={Number(value)} options={format} locale={locale} />;
        case "percent":
            return <PercentValue value={Number(value)} options={format} />;
        case "delta":
            return <DeltaValue value={Number(value)} options={format} />;
        case "date":
            return <DateValue value={String(value)} options={format} locale={locale} />;
        case "boolean":
            return <BooleanValue value={Boolean(value)} options={format} />;
        case "link":
            return <LinkValue value={String(value)} row={row} options={format} />;
        case "badge":
            return <BadgeValue value={String(value)} options={format} />;
        case "status":
            return <StatusBadge value={String(value)} options={format} />;
        case "array":
            return <ArrayValue value={Array.isArray(value) ? value : [value]} options={format} />;
        default:
            return <span>{String(value)}</span>;
    }
}
