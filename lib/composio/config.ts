/**
 * Composio Configuration Loader
 * 
 * Loads and provides access to composio.config.json settings.
 */

import type { ComposioConfig, ComposioToolkitConfig } from "@/types/composio";

// Import the config file directly
import config from "@/composio.config.json";

/**
 * Get the full Composio configuration
 */
export function getComposioConfig(): ComposioConfig {
    return config as ComposioConfig;
}

/**
 * Get all configured toolkits
 */
export function getConfiguredToolkits(): ComposioToolkitConfig[] {
    return config.toolkits as ComposioToolkitConfig[];
}

/**
 * Get only enabled toolkits
 */
export function getEnabledToolkits(): ComposioToolkitConfig[] {
    return getConfiguredToolkits().filter(t => t.enabled !== false);
}

/**
 * Get toolkit config by ID
 */
export function getToolkitById(id: string): ComposioToolkitConfig | undefined {
    return getConfiguredToolkits().find(t => t.id === id);
}

/**
 * Get toolkit config by toolkit slug
 */
export function getToolkitBySlug(slug: string): ComposioToolkitConfig | undefined {
    return getConfiguredToolkits().find(
        t => t.toolkit.toUpperCase() === slug.toUpperCase()
    );
}

/**
 * Get list of enabled toolkit slugs
 */
export function getEnabledToolkitSlugs(): string[] {
    return getEnabledToolkits().map(t => t.toolkit);
}
