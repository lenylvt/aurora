"use client";

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  role: "tool";
  name: string;
  content: string;
}

interface ToolCallsDisplayProps {
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

export function ToolCallsDisplay({ toolCalls, toolResults }: ToolCallsDisplayProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {toolCalls.map((toolCall) => {
        const result = toolResults.find((r) => r.tool_call_id === toolCall.id);
        const isComplete = !!result;
        const hasError = result && result.content.includes('"error"');

        let state: "input-streaming" | "input-available" | "output-available" | "output-error";
        if (!isComplete) {
          state = "input-available";
        } else if (hasError) {
          state = "output-error";
        } else {
          state = "output-available";
        }

        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          parsedArgs = { raw: toolCall.function.arguments };
        }

        let parsedOutput: any = null;
        let errorText: string | undefined;
        if (result) {
          try {
            parsedOutput = JSON.parse(result.content);
            if (parsedOutput.error) {
              errorText = parsedOutput.error;
            } else if (parsedOutput.data) {
              parsedOutput = parsedOutput.data;
            }
          } catch (e) {
            parsedOutput = result.content;
          }
        }

        return (
          <Tool key={toolCall.id}>
            <ToolHeader
              title={toolCall.function.name}
              type="tool-call" as any
              state={state}
            />
            <ToolContent>
              <ToolInput input={parsedArgs} />
              {isComplete && (
                <ToolOutput
                  output={parsedOutput}
                  errorText={errorText}
                />
              )}
            </ToolContent>
          </Tool>
        );
      })}
    </div>
  );
}
