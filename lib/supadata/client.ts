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
    const available = !!process.env.SUPADATA_API_KEY;
    console.log(`[Supadata] isSupadataAvailable: ${available}`);
    return available;
}

/**
 * Get or create Supadata client instance
 */
function getClient(): Supadata {
    if (!supadataClient) {
        console.log(`[Supadata] Creating new client instance...`);
        const apiKey = process.env.SUPADATA_API_KEY;
        if (!apiKey) {
            console.error(`[Supadata] ❌ SUPADATA_API_KEY is not configured`);
            throw new Error("SUPADATA_API_KEY is not configured");
        }
        supadataClient = new Supadata({ apiKey });
        console.log(`[Supadata] ✓ Client created`);
    }
    return supadataClient;
}

/**
 * Scrape web content from a URL
 * Returns markdown content from the page
 */
export async function scrapeWebContent(url: string): Promise<string> {
    const startTime = Date.now();
    console.log(`[Supadata] scrapeWebContent called at ${new Date().toISOString()}`);
    console.log(`[Supadata] URL: ${url}`);

    const client = getClient();

    try {
        console.log(`[Supadata] Scraping page...`);
        const result: Scrape = await client.web.scrape(url);
        const content = (result as any).content || (result as any).markdown || "Contenu non disponible";
        console.log(`[Supadata] ✓ Scraped ${content.length} chars in ${Date.now() - startTime}ms`);
        return content;
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error(`[Supadata] ❌ Scrape error: ${error.error} - ${error.message} (${Date.now() - startTime}ms)`);
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
    const startTime = Date.now();
    console.log(`[Supadata] getTranscript called at ${new Date().toISOString()}`);
    console.log(`[Supadata] URL: ${url}`);
    console.log(`[Supadata] Options: lang=${options?.lang || 'auto'}, text=${options?.text ?? true}, mode=${options?.mode || 'auto'}`);

    const client = getClient();

    try {
        console.log(`[Supadata] Requesting transcript...`);
        const result = await client.transcript({
            url,
            lang: options?.lang,
            text: options?.text ?? true,
            mode: options?.mode ?? "auto",
        });

        // Check if it's a job (async processing for large files)
        if ("jobId" in result) {
            console.log(`[Supadata] Job created: ${result.jobId}, polling for completion...`);
            // Poll for job completion
            let attempts = 0;
            const maxAttempts = 30; // Max 30 attempts (about 30 seconds)

            while (attempts < maxAttempts) {
                const jobResult = await client.transcript.getJobStatus(result.jobId);
                console.log(`[Supadata] Job status (attempt ${attempts + 1}): ${jobResult.status}`);

                if (jobResult.status === "completed") {
                    // JobResult has 'result' property when completed
                    const transcript = (jobResult as any).result;
                    let finalTranscript: string;
                    if (typeof transcript === "string") {
                        finalTranscript = transcript;
                    } else if (transcript?.chunks) {
                        finalTranscript = transcript.chunks.map((c: any) => c.text).join(" ");
                    } else if (transcript?.text) {
                        finalTranscript = transcript.text;
                    } else {
                        finalTranscript = JSON.stringify(transcript);
                    }
                    console.log(`[Supadata] ✓ Job completed, transcript: ${finalTranscript.length} chars in ${Date.now() - startTime}ms`);
                    return finalTranscript;
                } else if (jobResult.status === "failed") {
                    console.error(`[Supadata] ❌ Job failed: ${(jobResult as any).error}`);
                    throw new Error(`Transcription échouée: ${(jobResult as any).error || "Erreur inconnue"}`);
                }

                // Wait 1 second before next poll
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            console.error(`[Supadata] ❌ Job timeout after ${maxAttempts} attempts`);
            throw new Error("Transcription en cours, veuillez réessayer plus tard");
        }

        // Direct result - it's a Transcript object
        console.log(`[Supadata] Direct result received`);
        let finalResult: string;
        if (typeof result === "string") {
            finalResult = result;
        } else {
            // Handle Transcript object with chunks or text
            const transcript = result as any;
            if (transcript.chunks && Array.isArray(transcript.chunks)) {
                finalResult = transcript.chunks.map((chunk: any) => chunk.text).join(" ");
            } else if (transcript.text) {
                finalResult = transcript.text;
            } else {
                finalResult = JSON.stringify(result);
            }
        }

        console.log(`[Supadata] ✓ Transcript: ${finalResult.length} chars in ${Date.now() - startTime}ms`);
        return finalResult;
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error(`[Supadata] ❌ Transcript error: ${error.error} - ${error.message} (${Date.now() - startTime}ms)`);
            throw new Error(`Erreur de transcription: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Map website URLs (get sitemap)
 */
export async function mapWebsite(url: string): Promise<string[]> {
    const startTime = Date.now();
    console.log(`[Supadata] mapWebsite called for: ${url}`);

    const client = getClient();

    try {
        console.log(`[Supadata] Mapping website...`);
        const result = await client.web.map(url);
        const urls = (result as any).urls || [];
        console.log(`[Supadata] ✓ Found ${urls.length} URLs in ${Date.now() - startTime}ms`);
        return urls;
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error(`[Supadata] ❌ Map error: ${error.error} - ${error.message} (${Date.now() - startTime}ms)`);
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
    const startTime = Date.now();
    console.log(`[Supadata] getYouTubeVideoInfo called for videoId: ${videoId}`);

    const client = getClient();

    try {
        console.log(`[Supadata] Fetching video metadata...`);
        const video = await client.youtube.video({ id: videoId });
        const result = {
            title: video.title || "",
            description: video.description || "",
            channelName: (video as any).channelName || (video as any).channelTitle || "",
            duration: video.duration || 0,
            viewCount: video.viewCount || 0,
        };
        console.log(`[Supadata] ✓ Video info: "${result.title}" (${result.duration}s, ${result.viewCount} views) in ${Date.now() - startTime}ms`);
        return result;
    } catch (error) {
        if (error instanceof SupadataError) {
            console.error(`[Supadata] ❌ YouTube video error: ${error.error} - ${error.message} (${Date.now() - startTime}ms)`);
            throw new Error(`Erreur YouTube: ${error.message}`);
        }
        throw error;
    }
}
