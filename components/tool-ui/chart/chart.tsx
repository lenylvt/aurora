"use client";

import {
    BarChart,
    LineChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

import { cn } from "@/lib/utils";
import type { ChartProps } from "./schema";

const DEFAULT_COLORS = [
    "hsl(221, 83%, 53%)", // Blue
    "hsl(262, 83%, 58%)", // Purple  
    "hsl(339, 90%, 51%)", // Pink
    "hsl(27, 96%, 61%)",  // Orange
    "hsl(142, 71%, 45%)", // Green
];

export function Chart({
    id,
    type,
    title,
    description,
    data,
    xKey,
    series,
    colors,
    showLegend = false,
    showGrid = true,
    className,
    onDataPointClick,
}: ChartProps) {
    const palette = colors?.length ? colors : DEFAULT_COLORS;
    const seriesColors = series.map(
        (seriesItem, index) => seriesItem.color ?? palette[index % palette.length],
    );

    const handleDataPointClick = (
        seriesKey: string,
        seriesLabel: string,
        payload: Record<string, unknown>,
        index: number,
    ) => {
        onDataPointClick?.({
            seriesKey,
            seriesLabel,
            xValue: payload[xKey],
            yValue: payload[seriesKey],
            index,
            payload,
        });
    };

    const ChartComponent = type === "bar" ? BarChart : LineChart;

    return (
        <div
            className={cn("w-full", className)}
            data-tool-ui-id={id}
            data-slot="chart"
        >
            {/* Header - minimalist */}
            {(title || description) && (
                <div className="mb-4">
                    {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
            )}

            {/* Chart */}
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={data}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />}
                        <XAxis
                            dataKey={xKey}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            tickMargin={8}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                            }}
                        />
                        {showLegend && <Legend wrapperStyle={{ fontSize: "12px" }} />}

                        {type === "bar" &&
                            series.map((s, i) => (
                                <Bar
                                    key={s.key || `bar-${i}`}
                                    dataKey={s.key}
                                    name={s.label}
                                    fill={seriesColors[i]}
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) =>
                                        data && handleDataPointClick(s.key, s.label, data.payload, data.index)
                                    }
                                    cursor={onDataPointClick ? "pointer" : undefined}
                                />
                            ))}

                        {type === "line" &&
                            series.map((s, i) => (
                                <Line
                                    key={s.key || `line-${i}`}
                                    dataKey={s.key}
                                    name={s.label}
                                    type="monotone"
                                    stroke={seriesColors[i]}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: seriesColors[i] }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
