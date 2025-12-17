"use client";

import * as React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    componentName: string;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ToolUIErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[${this.props.componentName}] Error:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm">
                    <div className="font-medium">
                        {this.props.componentName} failed to render
                    </div>
                    {this.state.error?.message && (
                        <div className="mt-1 text-xs opacity-80">
                            {this.state.error.message}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
