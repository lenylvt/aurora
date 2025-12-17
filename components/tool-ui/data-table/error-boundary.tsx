"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function DataTableErrorBoundary({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolUIErrorBoundary componentName="DataTable">
            {children}
        </ToolUIErrorBoundary>
    );
}
