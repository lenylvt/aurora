/**
 * Google Custom Search API client
 * Uses Google Programmable Search Engine for web search
 */

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export interface SearchResponse {
    results: SearchResult[];
    totalResults: string;
    searchTime: number;
}

const GOOGLE_SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1";

/**
 * Check if Google Search is configured
 */
export function isGoogleSearchAvailable(): boolean {
    return !!(
        process.env.GOOGLE_SEARCH_API_KEY &&
        process.env.GOOGLE_SEARCH_ENGINE_ID
    );
}

/**
 * Search the web using Google Custom Search API
 * @param query - Search query
 * @param numResults - Number of results to return (max 10)
 */
export async function searchWeb(
    query: string,
    numResults: number = 5
): Promise<SearchResponse> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
        throw new Error("Google Search API not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID.");
    }

    const params = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: Math.min(numResults, 10).toString(),
    });

    const response = await fetch(`${GOOGLE_SEARCH_API_URL}?${params}`);

    if (!response.ok) {
        const error = await response.text();
        console.error("[Google Search] API error:", error);
        throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();

    const results: SearchResult[] = (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
    }));

    return {
        results,
        totalResults: data.searchInformation?.totalResults || "0",
        searchTime: data.searchInformation?.searchTime || 0,
    };
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResults(response: SearchResponse): string {
    if (response.results.length === 0) {
        return "Aucun résultat trouvé.";
    }

    const formatted = response.results
        .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");

    return `Trouvé ${response.totalResults} résultats (${response.searchTime}s):\n\n${formatted}`;
}
