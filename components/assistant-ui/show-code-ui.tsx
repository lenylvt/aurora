
"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CodeBlock, CodeBlockErrorBoundary, parseSerializableCodeBlock } from "@/components/tool-ui/code-block";

/**
 * Tool UI for `show_code` tool.
 */
export const ShowCodeUI = makeAssistantToolUI({
    toolName: "show_code",
    render: ({ result }) => {
        if (result === undefined) {
            return <CodeBlock id="loading" code="" isLoading />;
        }

        try {
            const codeProps = parseSerializableCodeBlock(result);
            return (
                <CodeBlockErrorBoundary>
                    <CodeBlock {...codeProps} />
                </CodeBlockErrorBoundary>
            );
        } catch (error) {
            console.error("[ShowCodeUI] Failed to parse result:", error);
            return (
                <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 p-4 text-sm">
                    Failed to render code block
                </div>
            );
        }
    },
});
