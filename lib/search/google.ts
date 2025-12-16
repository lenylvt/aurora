/**
 * Google Custom Search API client
 * Uses Google Programmable Search Engine for web search
 * Includes content loading from top results
 */

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    content?: string;
}

export interface SearchResponse {
    results: SearchResult[];
    totalResults: string;
    searchTime: number;
}

const GOOGLE_SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1";

// Max content length per page (to avoid overwhelming the LLM)
const MAX_CONTENT_LENGTH = 3000;

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
 * Fetch and extract text content from a URL
 */
async function fetchPageContent(url: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FriendAI/1.0)",
                "Accept": "text/html",
            },
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return "";
        }

        const html = await response.text();

        // Extract text from HTML (simple extraction)
        let text = html
            // Remove scripts and styles
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            // Remove HTML tags
            .replace(/<[^>]+>/g, " ")
            // Decode HTML entities
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // Clean whitespace
            .replace(/\s+/g, " ")
            .trim();

        // Truncate to max length
        if (text.length > MAX_CONTENT_LENGTH) {
            text = text.substring(0, MAX_CONTENT_LENGTH) + "...";
        }

        return text;
    } catch (error) {
        console.error(`[Web Loader] Failed to fetch ${url}:`, error);
        return "";
    }
}

/**
 * Search the web using Google Custom Search API
 * @param query - Search query
 * @param numResults - Number of results to return (max 10)
 * @param loadContent - Whether to load content from top results
 */
export async function searchWeb(
    query: string,
    numResults: number = 5,
    loadContent: boolean = true
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

    // Load content from top 3 results in parallel
    if (loadContent && results.length > 0) {
        const top3 = results.slice(0, 3);
        console.log(`[Web Loader] Fetching content from ${top3.length} pages...`);

        const contents = await Promise.all(
            top3.map(r => fetchPageContent(r.url))
        );

        contents.forEach((content, i) => {
            if (content) {
                results[i].content = content;
                console.log(`[Web Loader] Loaded ${content.length} chars from ${results[i].url}`);
            }
        });
    }

    return {
        results,
        totalResults: data.searchInformation?.totalResults || "0",
        searchTime: data.searchInformation?.searchTime || 0,
    };
}

/**
 * Format search results for AI consumption (including loaded content)
 */
export function formatSearchResults(response: SearchResponse): string {
    if (response.results.length === 0) {
        return "Aucun résultat trouvé.";
    }

    const formatted = response.results
        .map((r, i) => {
            let result = `## ${i + 1}. ${r.title}\n**Source:** ${r.url}\n\n${r.snippet}`;

            if (r.content) {
                result += `\n\n**Contenu extrait:**\n${r.content}`;
            }

            return result;
        })
        .join("\n\n---\n\n");

    return `# Résultats de recherche (${response.results.length} sur ${response.totalResults})\n\n${formatted}`;
}
