// Server-side Results API (for API routes that need write access)
import { Client, Databases, ID, Query } from "node-appwrite";
import type { UserResult, UserResultDocument, AIEvaluation } from "@/types/miniapps";

// Create admin databases client
function getAdminDatabases() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT!;
    const apiKey = process.env.APPWRITE_API_KEY!;

    console.log("[Results Server] Config:", {
        endpoint,
        projectId,
        hasApiKey: !!apiKey,
        databaseId: process.env.NEXT_PUBLIC_MINIAPPS_DATABASE_ID,
        resultsCollectionId: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID,
    });

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    return new Databases(client);
}

// Get config values directly
function getConfig() {
    return {
        databaseId: process.env.NEXT_PUBLIC_MINIAPPS_DATABASE_ID!,
        resultsCollectionId: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID!,
    };
}

// Convert document to UserResult
function toUserResult(doc: UserResultDocument): UserResult {
    return {
        ...doc,
        evaluations: JSON.parse(doc.evaluations || "[]"),
    };
}

// Create a new result (server-side with admin privileges)
export async function createResultServer(data: {
    userId: string;
    poemId: string;
    poemTitle: string;
    poemAuthor: string;
    mode: "complete" | "quick";
    totalStanzas: number;
    averageScore: number;
    evaluations: AIEvaluation[];
    // Include student input for display
    studentAnalyses?: {
        selectedWords: string[];
        analysis: string;
    }[];
}): Promise<UserResult | null> {
    try {
        const databases = getAdminDatabases();
        const config = getConfig();

        // Store evaluations with student input merged
        const enrichedEvaluations = data.evaluations.map((evaluation, index) => ({
            ...evaluation,
            studentInput: data.studentAnalyses?.[index] || null,
        }));

        const documentData = {
            userId: data.userId,
            poemId: data.poemId,
            poemTitle: data.poemTitle,
            poemAuthor: data.poemAuthor,
            mode: data.mode,
            totalStanzas: data.totalStanzas,
            averageScore: data.averageScore,
            evaluations: JSON.stringify(enrichedEvaluations),
            createdAt: new Date().toISOString(),
        };

        console.log("[Results Server] Creating document in:", config.databaseId, "/", config.resultsCollectionId);
        console.log("[Results Server] Document data keys:", Object.keys(documentData));

        const doc = await databases.createDocument(
            config.databaseId,
            config.resultsCollectionId,
            ID.unique(),
            documentData
        );

        console.log("[Results Server] ✓ Created result:", doc.$id);
        return toUserResult(doc as unknown as UserResultDocument);
    } catch (error: any) {
        console.error("[Results Server] Error creating result:", error?.message || error);
        console.error("[Results Server] Error details:", JSON.stringify(error, null, 2));
        return null;
    }
}

// Get all results for a user (server-side)
export async function getUserResultsServer(
    userId: string,
    limit: number = 50
): Promise<UserResult[]> {
    try {
        const databases = getAdminDatabases();
        const config = getConfig();

        const response = await databases.listDocuments(
            config.databaseId,
            config.resultsCollectionId,
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
        console.error("[Results Server] Error getting user results:", error);
        return [];
    }
}
