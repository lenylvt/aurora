"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function InstagramPostErrorBoundary({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolUIErrorBoundary componentName="InstagramPost">
            {children}
        </ToolUIErrorBoundary>
    );
}
