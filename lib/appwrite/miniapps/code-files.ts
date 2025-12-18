// Code Files CRUD operations for Mini App Code
// Uses miniapp-code-db database

import { ID, Query } from "appwrite";
import { databases } from "../client";
import { miniappCodeConfig } from "./config";

export interface CodeFileDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    userId: string;
    name: string;
    content: string;
    language: string;
    updatedAt: string;
}

export interface CodeFile {
    id: string;
    name: string;
    content: string;
    language: string;
    updatedAt: Date;
}

// Transform document to CodeFile
function toCodeFile(doc: CodeFileDocument): CodeFile {
    return {
        id: doc.$id,
        name: doc.name,
        content: doc.content,
        language: doc.language,
        updatedAt: new Date(doc.updatedAt),
    };
}

/**
 * Get all code files for a user
 */
export async function getUserCodeFiles(userId: string): Promise<CodeFile[]> {
    try {
        const response = await databases.listDocuments(
            miniappCodeConfig.databaseId,
            miniappCodeConfig.collections.codeFiles,
            [
                Query.equal("userId", userId),
                Query.orderDesc("updatedAt"),
                Query.limit(100),
            ]
        );

        return response.documents.map((doc) => toCodeFile(doc as unknown as CodeFileDocument));
    } catch (error) {
        console.error("[CodeFiles] Error getting user files:", error);
        return [];
    }
}

/**
 * Create a new code file
 */
export async function createCodeFile(
    userId: string,
    name: string,
    content: string,
    language: string = "python"
): Promise<CodeFile | null> {
    try {
        const doc = await databases.createDocument(
            miniappCodeConfig.databaseId,
            miniappCodeConfig.collections.codeFiles,
            ID.unique(),
            {
                userId,
                name,
                content,
                language,
                updatedAt: new Date().toISOString(),
            }
        );

        return toCodeFile(doc as unknown as CodeFileDocument);
    } catch (error) {
        console.error("[CodeFiles] Error creating file:", error);
        return null;
    }
}

/**
 * Update a code file (content, name, or language)
 */
export async function updateCodeFile(
    fileId: string,
    data: {
        name?: string;
        content?: string;
        language?: string;
    }
): Promise<CodeFile | null> {
    try {
        const doc = await databases.updateDocument(
            miniappCodeConfig.databaseId,
            miniappCodeConfig.collections.codeFiles,
            fileId,
            {
                ...data,
                updatedAt: new Date().toISOString(),
            }
        );

        return toCodeFile(doc as unknown as CodeFileDocument);
    } catch (error) {
        console.error("[CodeFiles] Error updating file:", error);
        return null;
    }
}

/**
 * Delete a code file
 */
export async function deleteCodeFile(fileId: string): Promise<boolean> {
    try {
        await databases.deleteDocument(
            miniappCodeConfig.databaseId,
            miniappCodeConfig.collections.codeFiles,
            fileId
        );
        return true;
    } catch (error) {
        console.error("[CodeFiles] Error deleting file:", error);
        return false;
    }
}
