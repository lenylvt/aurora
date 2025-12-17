"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { DataTable, DataTableErrorBoundary, parseSerializableDataTable } from "@/components/tool-ui/data-table";

/**
 * Tool UI for `show_table` tool.
 */
export const ShowTableUI = makeAssistantToolUI({
    toolName: "show_table",
    render: ({ result }) => {
        if (result === undefined) {
            return (
                <div className="bg-card/60 text-muted-foreground w-full rounded-lg border animate-pulse">
                    <div className="h-10 bg-muted rounded-t-lg mb-1" />
                    <div className="h-10 bg-muted mb-1" />
                    <div className="h-10 bg-muted mb-1" />
                    <div className="h-10 bg-muted rounded-b-lg" />
                </div>
            );
        }

        try {
            const tableProps = parseSerializableDataTable(result);
            return (
                <DataTableErrorBoundary>
                    <DataTable {...tableProps} />
                </DataTableErrorBoundary>
            );
        } catch (error) {
            console.error("[ShowTableUI] Failed to parse result:", error);
            return (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm">
                    Failed to render table
                </div>
            );
        }
    },
});
