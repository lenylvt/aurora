import { Query } from "appwrite";
import { databases } from "../client";
import { miniappsConfig } from "./config";
import type { Poem, PoemDocument, Stanza } from "@/types/miniapps";

// Parse fullText into stanzas (split by double newlines)
function parseStanzas(fullText: string): Stanza[] {
    const stanzaTexts = fullText.split(/\n\s*\n/);
    return stanzaTexts
        .filter((text) => text.trim())
        .map((text) => ({
            lines: text.split("\n").filter((line) => line.trim()),
        }));
}

// Convert document to Poem with parsed stanzas
function toPoem(doc: PoemDocument): Poem {
    return {
        ...doc,
        stanzas: parseStanzas(doc.fullText),
    };
}

// Get all poems
export async function getAllPoems(): Promise<Poem[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.poems,
            [Query.orderAsc("title"), Query.limit(100)]
        );

        return (response.documents as unknown as PoemDocument[]).map(toPoem);
    } catch (error) {
        console.error("[Poems] Error getting all poems:", error);
        return [];
    }
}

// Get all poems progressively (for better UX)
export async function getAllPoemsProgressive(
    onPoem: (poem: Poem) => void
): Promise<void> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.poems,
            [Query.orderAsc("title"), Query.limit(100)]
        );

        for (const doc of response.documents) {
            onPoem(toPoem(doc as unknown as PoemDocument));
        }
    } catch (error) {
        console.error("[Poems] Error loading poems progressively:", error);
    }
}

// Get poem by ID
export async function getPoemById(poemId: string): Promise<Poem | null> {
    try {
        const doc = await databases.getDocument(
            miniappsConfig.databaseId,
            miniappsConfig.collections.poems,
            poemId
        );

        return toPoem(doc as unknown as PoemDocument);
    } catch (error) {
        console.error("[Poems] Error getting poem by ID:", error);
        return null;
    }
}

// Search poems by title or author
export async function searchPoems(query: string): Promise<Poem[]> {
    try {
        const response = await databases.listDocuments(
            miniappsConfig.databaseId,
            miniappsConfig.collections.poems,
            [Query.limit(50)]
        );

        const lowercaseQuery = query.toLowerCase();
        const filtered = (response.documents as unknown as PoemDocument[]).filter(
            (doc) =>
                doc.title.toLowerCase().includes(lowercaseQuery) ||
                doc.author.toLowerCase().includes(lowercaseQuery)
        );

        return filtered.map(toPoem);
    } catch (error) {
        console.error("[Poems] Error searching poems:", error);
        return [];
    }
}
