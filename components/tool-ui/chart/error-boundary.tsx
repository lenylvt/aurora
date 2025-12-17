"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function ChartErrorBoundary({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolUIErrorBoundary componentName="Chart">
            {children}
        </ToolUIErrorBoundary>
    );
}
