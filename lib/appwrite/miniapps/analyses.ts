import { ID, Query } from "appwrite";
import { databases } from "../client";
import { miniappsConfig } from "./config";
import type { UserAnalysis, UserAnalysisDocument } from "@/types/miniapps";

// Convert document to UserAnalysis
function toUserAnalysis(doc: UserAnalysisDocument): UserAnalysis {
    return {
        ...doc,
        selectedWords: JSON.parse(doc.selectedWords || "[]"),
    };
}

// Create a new analysis
export async function createAnalysis(data: {
    userId: string;
    poemId: string;
    poemTitle: string;
    stanzaId: number;
    selectedWords: string[];
    analysis: string;
    completed?: boolean;
}): Promise<UserAnalysis | null> {
    try {
        const doc = await databases.createDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            ID.unique(),
            {
                userId: data.userId,
                poemId: data.poemId,
                poemTitle: data.poemTitle,
                stanzaId: data.stanzaId,
                selectedWords: JSON.stringify(data.selectedWords),
                analysis: data.analysis,
                completed: data.completed ?? false,
                createdAt: new Date().toISOString(),
            }
        );

        return toUserAnalysis(doc as unknown as UserAnalysisDocument);
    } catch (error) {
        console.error("[Analyses] Error creating analysis:", error);
        return null;
    }
}

// Update an existing analysis
export async function updateAnalysis(
    analysisId: string,
    updates: Partial<{
        selectedWords: string[];
        analysis: string;
        completed: boolean;
    }>
): Promise<UserAnalysis | null> {
    try {
        const updateData: Record<string, unknown> = {};

        if (updates.selectedWords !== undefined) {
            updateData.selectedWords = JSON.stringify(updates.selectedWords);
        }
        if (updates.analysis !== undefined) {
            updateData.analysis = updates.analysis;
        }
        if (updates.completed !== undefined) {
            updateData.completed = updates.completed;
        }

        const doc = await databases.updateDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            analysisId,
            updateData
        );

        return toUserAnalysis(doc as unknown as UserAnalysisDocument);
    } catch (error) {
        console.error("[Analyses] Error updating analysis:", error);
        return null;
    }
}

// Delete an analysis
export async function deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
        await databases.deleteDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            analysisId
        );
        return true;
    } catch (error) {
        console.error("[Analyses] Error deleting analysis:", error);
        return false;
    }
}

// Get all analyses for a user and poem
export async function getUserAnalysesForPoem(
    userId: string,
    poemId: string
): Promise<UserAnalysis[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            [
                Query.equal("userId", userId),
                Query.equal("poemId", poemId),
                Query.orderDesc("createdAt"),
                Query.limit(100),
            ]
        );

        return (response.documents as unknown as UserAnalysisDocument[]).map(
            toUserAnalysis
        );
    } catch (error) {
        console.error("[Analyses] Error getting user analyses:", error);
        return [];
    }
}

// Get incomplete analyses for a user and poem
export async function getIncompleteAnalyses(
    userId: string,
    poemId: string
): Promise<UserAnalysis[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            [
                Query.equal("userId", userId),
                Query.equal("poemId", poemId),
                Query.equal("completed", false),
                Query.orderDesc("createdAt"),
                Query.limit(100),
            ]
        );

        return (response.documents as unknown as UserAnalysisDocument[]).map(
            toUserAnalysis
        );
    } catch (error) {
        console.error("[Analyses] Error getting incomplete analyses:", error);
        return [];
    }
}

// Check if user has incomplete analyses for any poem
export async function hasIncompleteAnalyses(userId: string): Promise<boolean> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.analyses,
            [
                Query.equal("userId", userId),
                Query.equal("completed", false),
                Query.limit(1),
            ]
        );

        return response.documents.length > 0;
    } catch (error) {
        console.error("[Analyses] Error checking incomplete:", error);
        return false;
    }
}

// Delete all incomplete analyses for a user and poem (for restart)
export async function deleteIncompleteAnalysesForPoem(
    userId: string,
    poemId: string
): Promise<boolean> {
    try {
        const incompletes = await getIncompleteAnalyses(userId, poemId);

        for (const analysis of incompletes) {
            await databases.deleteDocument(
                miniappsConfig.databaseId,
                miniappsConfig.collections.analyses,
                analysis.$id
            );
        }

        console.log(`[Analyses] Deleted ${incompletes.length} incomplete analyses for poem ${poemId}`);
        return true;
    } catch (error) {
        console.error("[Analyses] Error deleting incomplete analyses:", error);
        return false;
    }
}

