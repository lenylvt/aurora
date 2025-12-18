"use client";

import { Sparkles } from "lucide-react";

interface EvaluationLoadingProps {
    poemTitle: string;
    analysisCount: number;
}

export default function EvaluationLoading({
    poemTitle,
    analysisCount,
}: EvaluationLoadingProps) {
    return (
        <div
            className="flex h-full flex-col bg-background"
            style={{ ["--thread-max-width" as string]: "42rem" }}
        >
            <div className="relative flex flex-1 flex-col items-center justify-center px-4">
                <div className="mx-auto w-full max-w-[var(--thread-max-width)] text-center">
                    {/* Simple spinner */}
                    <div className="mb-6 inline-flex items-center justify-center">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-muted" />
                            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold mb-2">
                        Évaluation en cours...
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        {poemTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {analysisCount} analyse{analysisCount > 1 ? "s" : ""} à évaluer
                    </p>
                </div>
            </div>
        </div>
    );
}
