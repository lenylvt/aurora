import { ID, Query } from "appwrite";
import { databases } from "../client";
import { miniappsConfig } from "./config";
import type { UserResult, UserResultDocument, AIEvaluation } from "@/types/miniapps";

// Convert document to UserResult
function toUserResult(doc: UserResultDocument): UserResult {
    return {
        ...doc,
        evaluations: JSON.parse(doc.evaluations || "[]"),
    };
}

// Create a new result
export async function createResult(data: {
    userId: string;
    poemId: string;
    poemTitle: string;
    poemAuthor: string;
    mode: "complete" | "quick";
    totalStanzas: number;
    averageScore: number;
    evaluations: AIEvaluation[];
}): Promise<UserResult | null> {
    try {
        const doc = await databases.createDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.results,
            ID.unique(),
            {
                userId: data.userId,
                poemId: data.poemId,
                poemTitle: data.poemTitle,
                poemAuthor: data.poemAuthor,
                mode: data.mode,
                totalStanzas: data.totalStanzas,
                averageScore: data.averageScore,
                evaluations: JSON.stringify(data.evaluations),
                createdAt: new Date().toISOString(),
            }
        );

        return toUserResult(doc as unknown as UserResultDocument);
    } catch (error) {
        console.error("[Results] Error creating result:", error);
        return null;
    }
}

// Get all results for a user
export async function getUserResults(
    userId: string,
    limit: number = 50
): Promise<UserResult[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.results,
            [
                Query.equal("userId", userId),
                Query.orderDesc("createdAt"),
                Query.limit(limit),
            ]
        );

        return (response.documents as unknown as UserResultDocument[]).map(
            toUserResult
        );
    } catch (error) {
        console.error("[Results] Error getting user results:", error);
        return [];
    }
}

// Delete a result
export async function deleteResult(resultId: string): Promise<boolean> {
    try {
        await databases.deleteDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.results,
            resultId
        );
        return true;
    } catch (error) {
        console.error("[Results] Error deleting result:", error);
        return false;
    }
}

// Get user statistics
export async function getUserResultsStats(userId: string): Promise<{
    totalTests: number;
    averageScore: number;
    bestScore: number;
    recentTests: number;
    poemsTested: number;
}> {
    try {
        const results = await getUserResults(userId, 100);

        if (results.length === 0) {
            return {
                totalTests: 0,
                averageScore: 0,
                bestScore: 0,
                recentTests: 0,
                poemsTested: 0,
            };
        }

        // Calculate stats
        const totalTests = results.length;
        const averageScore =
            results.reduce((sum, r) => sum + r.averageScore, 0) / totalTests;
        const bestScore = Math.max(...results.map((r) => r.averageScore));

        // Recent tests (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentTests = results.filter(
            (r) => new Date(r.createdAt) > oneWeekAgo
        ).length;

        // Unique poems tested
        const poemsTested = new Set(results.map((r) => r.poemId)).size;

        return {
            totalTests,
            averageScore: Math.round(averageScore * 10) / 10,
            bestScore: Math.round(bestScore * 10) / 10,
            recentTests,
            poemsTested,
        };
    } catch (error) {
        console.error("[Results] Error getting stats:", error);
        return {
            totalTests: 0,
            averageScore: 0,
            bestScore: 0,
            recentTests: 0,
            poemsTested: 0,
        };
    }
}
