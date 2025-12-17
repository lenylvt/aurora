"use client";

import { makeAssistantToolUI, useThreadRuntime } from "@assistant-ui/react";
import { OptionList, OptionListErrorBoundary } from "@/components/tool-ui/option-list";

/**
 * Tool UI for `show_options` tool.
 * Since Groq doesn't support true human-in-the-loop,
 * we send a follow-up message with the user's selection.
 */
export const ShowOptionsUI = makeAssistantToolUI<unknown, { selected: string | string[] | null }>({
    toolName: "show_options",
    render: function ShowOptionsRender({ result, args, status, addResult }) {
        // Access thread runtime to send messages
        const threadRuntime = useThreadRuntime();

        // Parse args with fallback for missing id
        const parseArgs = (input: unknown) => {
            if (!input || typeof input !== "object") return null;
            const obj = input as Record<string, unknown>;

            // Check if options exist and have items
            if (!obj.options || !Array.isArray(obj.options) || obj.options.length === 0) {
                return null;
            }

            return {
                id: (obj.id as string) || `options-${Date.now()}`,
                options: obj.options as Array<{ id: string; label: string; description?: string }>,
                selectionMode: (obj.selectionMode as "single" | "multi") || "single",
            };
        };

        // Show confirmed state after result
        if (result !== undefined) {
            const resultData = result as { selected: string | string[] | null };
            const optionsProps = parseArgs(args);
            if (!optionsProps) return null;

            return (
                <OptionListErrorBoundary>
                    <OptionList
                        id={optionsProps.id}
                        options={optionsProps.options}
                        selectionMode={optionsProps.selectionMode}
                        confirmed={resultData.selected}
                    />
                </OptionListErrorBoundary>
            );
        }

        // Show loading skeleton while args are streaming
        const optionsProps = parseArgs(args);
        if (!optionsProps) {
            return (
                <div className="w-full max-w-md animate-pulse">
                    <div className="h-14 bg-muted rounded-lg mb-2" />
                    <div className="h-14 bg-muted rounded-lg mb-2" />
                    <div className="h-14 bg-muted rounded-lg" />
                </div>
            );
        }

        // Handler for when user confirms selection
        const handleConfirm = (selected: string | string[] | null) => {
            console.log("[ShowOptionsUI] User confirmed selection:", selected);

            // Update local state to show confirmed
            addResult({ selected });

            // Find the selected option label(s)
            const selectedIds = Array.isArray(selected) ? selected : selected ? [selected] : [];
            const selectedLabels = optionsProps.options
                .filter(opt => selectedIds.includes(opt.id))
                .map(opt => opt.label);

            // Send a follow-up message with the selection
            const message = selectedLabels.length === 1
                ? `J'ai choisi: ${selectedLabels[0]}`
                : `J'ai choisi: ${selectedLabels.join(", ")}`;

            console.log("[ShowOptionsUI] Sending follow-up message:", message);

            // Use thread runtime to append a user message
            threadRuntime.append({
                role: "user",
                content: [{ type: "text", text: message }],
            });
        };

        return (
            <OptionListErrorBoundary>
                <OptionList
                    id={optionsProps.id}
                    options={optionsProps.options}
                    selectionMode={optionsProps.selectionMode}
                    onConfirm={handleConfirm}
                />
            </OptionListErrorBoundary>
        );
    },
});
