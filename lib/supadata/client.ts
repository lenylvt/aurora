/**
 * Supadata client for web scraping and transcription
 * Uses Supadata API for web content extraction and video transcription
 */

import { Supadata, SupadataError, type Scrape } from "@supadata/js";

let supadataClient: Supadata | null = null;

/**
 * Check if Supadata is configured
 */
export function isSupadataAvailable(): boolean {
    return !!process.env.SUPADATA_API_KEY;
}

/**
 * Get or create Supadata client instance
 */
function getClient(): Supadata {
    if (!supadataClient) {
        const apiKey = process.env.SUPADATA_API_KEY;
        if (!apiKey) {
            throw new Error("SUPADATA_API_KEY is not configured");
        }
        supadataClient = new Supadata({ apiKey });
    }
    return supadataClient;
}

/**
 * Scrape web content from a URL
 * Returns markdown content from the page
 */
export async function scrapeWebContent(url: string): Promise<string> {
    const client = getClient();

    try {
        const result: Scrape = await client.web.scrape(url);
        // The Scrape type has 'content' which is the markdown content
        return (result as any).content || (result as any).markdown || "Contenu non disponible";
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error("[Supadata] Scrape error:", error.error, error.message);
            throw new Error(`Erreur de scraping: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Get transcript from video URL (YouTube, TikTok, Instagram, X)
 */
export async function getTranscript(
    url: string,
    options?: {
        lang?: string;
        text?: boolean;
        mode?: "native" | "auto" | "generate";
    }
): Promise<string> {
    const client = getClient();

    try {
        const result = await client.transcript({
            url,
            lang: options?.lang,
            text: options?.text ?? true,
            mode: options?.mode ?? "auto",
        });

        // Check if it's a job (async processing for large files)
        if ("jobId" in result) {
            // Poll for job completion
            let attempts = 0;
            const maxAttempts = 30; // Max 30 attempts (about 30 seconds)

            while (attempts < maxAttempts) {
                const jobResult = await client.transcript.getJobStatus(result.jobId);

                if (jobResult.status === "completed") {
                    // JobResult has 'result' property when completed
                    const transcript = (jobResult as any).result;
                    if (typeof transcript === "string") {
                        return transcript;
                    }
                    if (transcript?.chunks) {
                        return transcript.chunks.map((c: any) => c.text).join(" ");
                    }
                    if (transcript?.text) {
                        return transcript.text;
                    }
                    return JSON.stringify(transcript);
                } else if (jobResult.status === "failed") {
                    throw new Error(`Transcription échouée: ${(jobResult as any).error || "Erreur inconnue"}`);
                }

                // Wait 1 second before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            throw new Error("Transcription en cours, veuillez réessayer plus tard");
        }

        // Direct result - it's a Transcript object
        if (typeof result === "string") {
            return result;
        }

        // Handle Transcript object with chunks or text
        const transcript = result as any;
        if (transcript.chunks && Array.isArray(transcript.chunks)) {
            return transcript.chunks.map((chunk: any) => chunk.text).join(" ");
        }

        if (transcript.text) {
            return transcript.text;
        }

        return JSON.stringify(result);
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error("[Supadata] Transcript error:", error.error, error.message);
            throw new Error(`Erreur de transcription: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Map website URLs (get sitemap)
 */
export async function mapWebsite(url: string): Promise<string[]> {
    const client = getClient();

    try {
        const result = await client.web.map(url);
        return (result as any).urls || [];
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error("[Supadata] Map error:", error.error, error.message);
            throw new Error(`Erreur de mapping: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Get YouTube video metadata
 */
export async function getYouTubeVideoInfo(videoId: string): Promise<{
    title: string;
    description: string;
    channelName: string;
    duration: number;
    viewCount: number;
}> {
    const client = getClient();

    try {
        const video = await client.youtube.video({ id: videoId });
        return {
            title: video.title || "",
            description: video.description || "",
            channelName: (video as any).channelName || (video as any).channelTitle || "",
            duration: video.duration || 0,
            viewCount: video.viewCount || 0,
        };
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error("[Supadata] YouTube video error:", error.error, error.message);
            throw new Error(`Erreur YouTube: ${error.message}`);
        }
        throw error;
    }
}
