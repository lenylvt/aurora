/**
 * Composio Configuration Loader
 * 
 * Re-exports from the unified MCP config for backwards compatibility.
 * Uses lib/mcp/config.ts as the source of truth.
 */

// Re-export Composio functions from the unified MCP config
export {
    getComposioToolkits as getConfiguredToolkits,
    getEnabledComposioToolkits as getEnabledToolkits,
    getComposioToolkitById as getToolkitById,
    getComposioToolkitBySlug as getToolkitBySlug,
    getEnabledComposioToolkitSlugs as getEnabledToolkitSlugs,
} from "@/lib/mcp/config";

// Re-export types
export type { ComposioToolkitConfig } from "@/types/mcp";

// For backwards compatibility, also export a getComposioConfig function
import { getMCPConfig } from "@/lib/mcp/config";
import { getComposioToolkits } from "@/lib/mcp/config";

export function getComposioConfig() {
    return {
        toolkits: getComposioToolkits(),
    };
}
