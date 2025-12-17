"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function OptionListErrorBoundary({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolUIErrorBoundary componentName="OptionList">
            {children}
        </ToolUIErrorBoundary>
    );
}
