import { ID, Query } from "appwrite";
import { databases } from "../client";
import { miniappsConfig } from "./config";
import type { MiniAppId, MiniAppSettings } from "@/types/miniapps";

// Get user's mini app settings
export async function getMiniAppSettings(
    userId: string,
    miniAppId: MiniAppId
): Promise<MiniAppSettings | null> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.settings,
            [
                Query.equal("userId", userId),
                Query.equal("miniAppId", miniAppId),
                Query.limit(1),
            ]
        );

        if (response.documents.length === 0) {
            return null;
        }

        return response.documents[0] as unknown as MiniAppSettings;
    } catch (error) {
        console.error("[MiniApps] Error getting settings:", error);
        return null;
    }
}

// Get all mini app settings for user
export async function getAllMiniAppSettings(
    userId: string
): Promise<MiniAppSettings[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.settings,
            [Query.equal("userId", userId), Query.limit(50)]
        );

        return response.documents as unknown as MiniAppSettings[];
    } catch (error) {
        console.error("[MiniApps] Error getting all settings:", error);
        return [];
    }
}

// Create or update mini app settings
export async function upsertMiniAppSettings(
    userId: string,
    miniAppId: MiniAppId,
    updates: Partial<Pick<MiniAppSettings, "enabled" | "showInSidebar" | "hasSeenWelcome">>
): Promise<MiniAppSettings | null> {
    try {
        // Check if settings exist
        const existing = await getMiniAppSettings(userId, miniAppId);

        if (existing) {
            // Update existing
            const updated = await databases.updateDocument(
                miniappsConfig.databaseId,
                miniappsConfig.collections.settings,
                existing.$id,
                updates
            );
            return updated as unknown as MiniAppSettings;
        } else {
            // Create new with defaults
            const created = await databases.createDocument(
                miniappsConfig.databaseId,
                miniappsConfig.collections.settings,
                ID.unique(),
                {
                    userId,
                    miniAppId,
                    enabled: true,
                    showInSidebar: true,
                    hasSeenWelcome: false,
                    ...updates,
                }
            );
            return created as unknown as MiniAppSettings;
        }
    } catch (error) {
        console.error("[MiniApps] Error upserting settings:", error);
        return null;
    }
}

// Mark welcome as seen
export async function markWelcomeSeen(
    userId: string,
    miniAppId: MiniAppId
): Promise<void> {
    await upsertMiniAppSettings(userId, miniAppId, { hasSeenWelcome: true });
}

// Toggle sidebar visibility
export async function toggleSidebarVisibility(
    userId: string,
    miniAppId: MiniAppId,
    showInSidebar: boolean
): Promise<void> {
    await upsertMiniAppSettings(userId, miniAppId, { showInSidebar });
}

// Toggle mini app enabled state
export async function toggleMiniAppEnabled(
    userId: string,
    miniAppId: MiniAppId,
    enabled: boolean
): Promise<void> {
    await upsertMiniAppSettings(userId, miniAppId, { enabled });
}
