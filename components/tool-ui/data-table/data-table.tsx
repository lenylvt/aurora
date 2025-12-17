"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ActionButtons, normalizeActionsConfig } from "../shared";
import { renderFormattedValue } from "./formatters";
import type { DataTableProps, RowData, SortState, ColumnKey } from "./types";

export function sortData<T extends RowData>(
    data: T[],
    sort: SortState<T>,
): T[] {
    if (!sort.by) return data;
    return [...data].sort((a, b) => {
        const aVal = a[sort.by!];
        const bVal = b[sort.by!];
        let cmp = 0;
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = 1;
        else if (bVal == null) cmp = -1;
        else if (typeof aVal === "number" && typeof bVal === "number") {
            cmp = aVal - bVal;
        } else {
            cmp = String(aVal).localeCompare(String(bVal));
        }
        return sort.direction === "desc" ? -cmp : cmp;
    });
}

export function useDataTable<T extends RowData>(props: DataTableProps<T>) {
    const { data, defaultSort, sort: controlledSort, onSortChange } = props;

    const [internalSort, setInternalSort] = React.useState<SortState<T>>(
        defaultSort ?? {}
    );

    const sort = controlledSort ?? internalSort;

    const handleSortChange = React.useCallback(
        (column: ColumnKey<T>) => {
            const newSort: SortState<T> = {
                by: column,
                direction:
                    sort.by === column
                        ? sort.direction === "asc"
                            ? "desc"
                            : sort.direction === "desc"
                                ? undefined
                                : "asc"
                        : "asc",
            };
            if (!newSort.direction) {
                newSort.by = undefined;
            }
            if (onSortChange) {
                onSortChange(newSort);
            } else {
                setInternalSort(newSort);
            }
        },
        [sort, onSortChange]
    );

    const sortedData = React.useMemo(() => sortData(data, sort), [data, sort]);

    return { sort, handleSortChange, sortedData };
}

export function DataTable<T extends RowData>(props: DataTableProps<T>) {
    const {
        id,
        columns,
        data,
        rowIdKey,
        className,
        isLoading,
        locale = "en-US",
        responseActions,
        onResponseAction,
        onBeforeResponseAction,
    } = props;

    const { sort, handleSortChange, sortedData } = useDataTable(props);

    const normalizedActions = React.useMemo(
        () => normalizeActionsConfig(responseActions),
        [responseActions]
    );

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-2 p-4">
                <div className="h-8 bg-muted rounded w-full" />
                <div className="h-8 bg-muted rounded w-full" />
                <div className="h-8 bg-muted rounded w-full" />
            </div>
        );
    }

    return (
        <div
            className={cn("w-full", className)}
            data-tool-ui-id={id}
            data-slot="data-table"
        >
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    className={cn(
                                        col.align === "right" && "text-right",
                                        col.align === "center" && "text-center"
                                    )}
                                    style={{ width: col.width }}
                                >
                                    {col.sortable !== false ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="-ml-3 h-8"
                                            onClick={() => handleSortChange(col.key)}
                                        >
                                            {col.label}
                                            {sort.by === col.key ? (
                                                sort.direction === "asc" ? (
                                                    <ArrowUp className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <ArrowDown className="ml-2 h-4 w-4" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                            )}
                                        </Button>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Aucune donnée
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row, i) => {
                                const rowKey = rowIdKey && row[rowIdKey] != null ? String(row[rowIdKey]) : `row-${i}`;
                                return (
                                    <TableRow key={rowKey}>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.key}
                                                className={cn(
                                                    col.align === "right" && "text-right",
                                                    col.align === "center" && "text-center",
                                                    col.truncate && "max-w-[200px] truncate"
                                                )}
                                            >
                                                {renderFormattedValue(row[col.key], col.format, row, locale)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            }))
                        }
                    </TableBody>
                </Table>
            </div>

            {normalizedActions && (
                <div className="mt-4">
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
