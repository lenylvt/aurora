"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Chart, ChartErrorBoundary, parseSerializableChart } from "@/components/tool-ui/chart";

/**
 * Tool UI for `show_chart` tool.
 */
export const ShowChartUI = makeAssistantToolUI({
    toolName: "show_chart",
    render: ({ result }) => {
        if (result === undefined) {
            return (
                <div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                    <div className="h-48 bg-muted rounded-lg" />
                </div>
            );
        }

        try {
            const chart = parseSerializableChart(result);
            return (
                <ChartErrorBoundary>
                    <Chart {...chart} />
                </ChartErrorBoundary>
            );
        } catch (error) {
            console.error("[ShowChartUI] Failed to parse result:", error);
            return (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm">
                    Failed to render chart
                </div>
            );
        }
    },
});
