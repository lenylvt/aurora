"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import type { OptionListProps, OptionListSelection, OptionListOption } from "./schema";

function normalizeSelection(
    value: OptionListSelection | undefined,
    mode: "single" | "multi"
): string[] {
    if (value === null || value === undefined) return [];
    if (typeof value === "string") return [value];
    return value;
}

function selectionToOutput(
    selected: string[],
    mode: "single" | "multi"
): OptionListSelection {
    if (mode === "single") {
        return selected.length > 0 ? selected[0] : null;
    }
    return selected;
}

export function OptionList({
    id,
    options,
    selectionMode = "single",
    value,
    defaultValue,
    confirmed,
    minSelections = 1,
    maxSelections,
    onChange,
    onConfirm,
    onCancel,
    responseActions,
    onResponseAction,
    onBeforeResponseAction,
    className,
}: OptionListProps) {
    const isControlled = value !== undefined;
    const [internalSelection, setInternalSelection] = React.useState<string[]>(
        () => normalizeSelection(defaultValue, selectionMode)
    );

    const selection = isControlled
        ? normalizeSelection(value, selectionMode)
        : internalSelection;

    const handleSelect = React.useCallback(
        (optionId: string) => {
            if (confirmed !== undefined) return; // Read-only in receipt state

            let newSelection: string[];
            if (selectionMode === "single") {
                newSelection = [optionId];
            } else {
                if (selection.includes(optionId)) {
                    newSelection = selection.filter((id) => id !== optionId);
                } else {
                    if (maxSelections && selection.length >= maxSelections) {
                        return;
                    }
                    newSelection = [...selection, optionId];
                }
            }

            if (!isControlled) {
                setInternalSelection(newSelection);
            }
            onChange?.(selectionToOutput(newSelection, selectionMode));

            // Auto-confirm on single selection mode if onConfirm is provided
            if (selectionMode === "single" && onConfirm && newSelection.length > 0) {
                onConfirm(selectionToOutput(newSelection, selectionMode));
            }
        },
        [selection, selectionMode, maxSelections, confirmed, isControlled, onChange, onConfirm]
    );

    // Receipt state: show only confirmed options
    if (confirmed !== undefined) {
        const confirmedIds = normalizeSelection(confirmed, selectionMode);
        const confirmedOptions = options.filter((opt) => confirmedIds.includes(opt.id));

        return (
            <div
                className={cn("w-full max-w-md", className)}
                data-tool-ui-id={id}
                data-slot="option-list"
            >
                <div className="space-y-2">
                    {confirmedOptions.map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3"
                        >
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{option.label}</div>
                                {option.description && (
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("w-full max-w-md", className)}
            data-tool-ui-id={id}
            data-slot="option-list"
        >
            <div className="space-y-2">
                {options.map((option) => {
                    const isSelected = selection.includes(option.id);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={option.disabled}
                            onClick={() => handleSelect(option.id)}
                            className={cn(
                                "w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all",
                                "border hover:border-primary/50 hover:bg-accent/30",
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background",
                                option.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors",
                                    isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/40"
                                )}
                            >
                                {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{option.label}</div>
                                {option.description && (
                                    <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                                )}
                            </div>
                            {option.icon}
                        </button>
                    );
                })}
            </div>

            {/* Confirm button for multi-select mode */}
            {selectionMode === "multi" && onConfirm && (
                <div className="mt-4 flex justify-end gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        onClick={() => onConfirm(selectionToOutput(selection, selectionMode))}
                        disabled={selection.length < minSelections}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                            selection.length >= minSelections
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        Confirmer
                    </button>
                </div>
            )}
        </div>
    );
}
