"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function XPostErrorBoundary({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolUIErrorBoundary componentName="XPost">
            {children}
        </ToolUIErrorBoundary>
    );
}
