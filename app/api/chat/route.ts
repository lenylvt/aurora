import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import { getComposioTools, isComposioAvailable } from "@/lib/composio/client";
import { getEnabledToolkitSlugs, getAllowedToolsForToolkits } from "@/lib/composio/config";
import { getMCPTools, isMCPAvailable } from "@/lib/mcp/client";
import { optimizeMessageContext } from "@/lib/groq/context";
import { searchWeb, formatSearchResults, isGoogleSearchAvailable } from "@/lib/search/google";
import { isSupadataAvailable, scrapeWebContent, getTranscript } from "@/lib/supadata/client";
import { getTranslation, getSynonyms, getConjugation, getAntonyms, isReversoAvailable } from "@/lib/reverso/client";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  messages: UIMessage[];
}

// Fallback chain: try each model in order
const MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "openai/gpt-oss-20b",
] as const;

// Vision model for images
const VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";

// Helper to recursively remove reasoning from messages (not supported by vision model)
function removeReasoning(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item: any) => !(item && typeof item === 'object' && item.type === 'reasoning'))
      .map(removeReasoning);
  }

  const { reasoning, ...rest } = obj;
  const cleaned: Record<string, any> = {};

  for (const key of Object.keys(rest)) {
    cleaned[key] = removeReasoning(rest[key]);
  }

  return cleaned;
}

// Helper to check if a message part is an image
function isImagePart(part: any): boolean {
  if (!part || typeof part !== 'object') return false;
  return (
    part.type === 'image' ||
    part.type === 'image_url' ||
    (part.type === 'file' && part.mediaType?.startsWith('image/'))
  );
}

// Helper to check if messages contain images (AI SDK v5 format)
function hasImages(messages: any[]): boolean {
  return messages.some((msg) => {
    // AI SDK v5: images are in 'parts' array with type 'file' and mediaType starting with 'image/'
    if (msg.parts && Array.isArray(msg.parts)) {
      const hasImagePart = msg.parts.some((part: any) => isImagePart(part));
      if (hasImagePart) {
        return true;
      }
    }
    // Legacy format: images in 'content' array
    if (msg.content && Array.isArray(msg.content)) {
      const hasImageContent = msg.content.some((c: any) => isImagePart(c));
      if (hasImageContent) {
        return true;
      }
    }
    return false;
  });
}

// Maximum number of images allowed by the vision model
const MAX_IMAGES = 5;

/**
 * Limit images in messages to the last MAX_IMAGES to prevent model errors
 * "Too many images provided. This model supports up to 5 images"
 */
function limitImages(messages: UIMessage[]): UIMessage[] {
  // First pass: collect all images with their location info
  const imageLocations: Array<{
    messageIndex: number;
    partType: 'parts' | 'content';
    partIndex: number;
  }> = [];

  messages.forEach((msg: any, msgIndex) => {
    if (msg.parts && Array.isArray(msg.parts)) {
      msg.parts.forEach((part: any, partIndex: number) => {
        if (isImagePart(part)) {
          imageLocations.push({
            messageIndex: msgIndex,
            partType: 'parts',
            partIndex,
          });
        }
      });
    }
    if (msg.content && Array.isArray(msg.content)) {
      msg.content.forEach((part: any, partIndex: number) => {
        if (isImagePart(part)) {
          imageLocations.push({
            messageIndex: msgIndex,
            partType: 'content',
            partIndex,
          });
        }
      });
    }
  });

  // If within limit, return as-is
  if (imageLocations.length <= MAX_IMAGES) {
    return messages;
  }

  console.log(`[Chat API] Limiting images: ${imageLocations.length} → ${MAX_IMAGES}`);

  // Keep only the last MAX_IMAGES
  const imagesToRemove = new Set(
    imageLocations.slice(0, -MAX_IMAGES).map(loc =>
      `${loc.messageIndex}-${loc.partType}-${loc.partIndex}`
    )
  );

  // Second pass: filter out old images
  return messages.map((msg: any, msgIndex) => {
    let modified = false;
    let newParts = msg.parts;
    let newContent = msg.content;

    if (msg.parts && Array.isArray(msg.parts)) {
      newParts = msg.parts.filter((part: any, partIndex: number) => {
        if (isImagePart(part) && imagesToRemove.has(`${msgIndex}-parts-${partIndex}`)) {
          modified = true;
          return false;
        }
        return true;
      });

      // If we removed all parts from a user message, add placeholder text
      if (msg.role === 'user' && newParts.length === 0 && msg.parts.length > 0) {
        newParts = [{ type: 'text', text: '[Image précédente]' }];
      }
    }

    if (msg.content && Array.isArray(msg.content)) {
      newContent = msg.content.filter((part: any, partIndex: number) => {
        if (isImagePart(part) && imagesToRemove.has(`${msgIndex}-content-${partIndex}`)) {
          modified = true;
          return false;
        }
        return true;
      });

      if (msg.role === 'user' && newContent.length === 0 && msg.content.length > 0) {
        newContent = [{ type: 'text', text: '[Image précédente]' }];
      }
    }

    if (!modified) return msg;

    return {
      ...msg,
      parts: newParts,
      content: newContent,
    };
  });
}

export async function POST(req: NextRequest) {
  const requestStartTime = new Date();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`[Chat API] ===== NEW REQUEST =====`);
  console.log(`[Chat API] Timestamp: ${requestStartTime.toISOString()}`);

  try {
    console.log(`[Chat API] Authenticating user...`);
    const user = await getCurrentUserServer();

    if (!user) {
      console.log(`[Chat API] ❌ Authentication failed - no user found`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`[Chat API] ✓ User authenticated: ${user.$id} (${user.email})`);

    console.log(`[Chat API] Parsing request body...`);
    const { messages }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.log(`[Chat API] ❌ Invalid request - messages missing or not array`);
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log(`[Chat API] ✓ Received ${messages.length} messages`);
    console.log(`[Chat API] Last message role: ${messages[messages.length - 1]?.role}`);

    // Get tools from all sources
    let tools: Record<string, any> = {};
    console.log(`[Chat API] Loading tools...`);

    // 1. Get Composio tools for connected toolkits
    if (isComposioAvailable()) {
      console.log(`[Chat API] Composio available, fetching tools...`);
      try {
        const allowedConfig = getAllowedToolsForToolkits();
        console.log(`[Chat API] Allowed tools config: hasFilter=${allowedConfig.hasFilter}, tools=${allowedConfig.tools.length}, toolkits=${allowedConfig.toolkits.length}`);

        // Fetch specific tools if configured, or all tools from toolkits without filter
        let composioTools: Record<string, any> = {};

        // First, get specific tools if any are configured
        if (allowedConfig.tools.length > 0) {
          console.log(`[Chat API] Fetching specific tools: ${allowedConfig.tools.join(", ")}`);
          const specificTools = await getComposioTools(user.$id, {
            tools: allowedConfig.tools,
          });
          composioTools = { ...composioTools, ...specificTools };
          console.log(`[Chat API] ✓ Loaded ${Object.keys(specificTools).length} specific Composio tools`);
        }

        // Then, get all tools from toolkits that don't have a filter
        if (allowedConfig.toolkits.length > 0) {
          console.log(`[Chat API] Fetching all tools from toolkits: ${allowedConfig.toolkits.join(", ")}`);
          const toolkitTools = await getComposioTools(user.$id, {
            toolkits: allowedConfig.toolkits,
          });
          composioTools = { ...composioTools, ...toolkitTools };
          console.log(`[Chat API] ✓ Loaded ${Object.keys(toolkitTools).length} toolkit Composio tools`);
        }

        tools = { ...tools, ...composioTools };
        console.log(`[Chat API] ✓ Total Composio tools: ${Object.keys(composioTools).length}`);
      } catch (toolError) {
        console.warn("[Chat API] ⚠ Composio tools not available:", toolError);
      }
    } else {
      console.log(`[Chat API] Composio not available (no API key)`);
    }

    // 2. Get MCP HTTP server tools
    if (isMCPAvailable()) {
      console.log(`[Chat API] MCP available, fetching tools...`);
      try {
        const mcpTools = await getMCPTools();
        tools = { ...tools, ...mcpTools };
        console.log(`[Chat API] ✓ Loaded ${Object.keys(mcpTools).length} MCP tools`);
      } catch (mcpError) {
        console.warn("[Chat API] ⚠ MCP tools not available:", mcpError);
      }
    } else {
      console.log(`[Chat API] MCP not available (no servers configured)`);
    }

    // Add web search tool if configured
    const MAX_SEARCHES_PER_REQUEST = 2;
    let searchCount = 0;

    if (isGoogleSearchAvailable()) {
      console.log(`[Chat API] ✓ Google Search available, adding tool (max ${MAX_SEARCHES_PER_REQUEST} per request)`);
      tools.recherche_internet = tool({
        description: "Recherche sur internet pour obtenir des informations actuelles, récentes ou en temps réel. Utilise cet outil quand l'utilisateur demande des informations que tu ne connais pas ou qui nécessitent des données actualisées. LIMITE: Maximum 3 recherches par message.",
        inputSchema: z.object({
          q: z.string().describe("La requête de recherche"),
        }),
        execute: async ({ q }) => {
          console.log(`[Web Search] Executing search at ${new Date().toISOString()}`);
          console.log("[Web Search] Query:", q);
          console.log(`[Web Search] Search count: ${searchCount + 1}/${MAX_SEARCHES_PER_REQUEST}`);

          // Check search limit
          if (searchCount >= MAX_SEARCHES_PER_REQUEST) {
            console.log("[Web Search] ❌ Search limit reached");
            return "Limite de recherches atteinte (3 maximum par message). Utilise les résultats déjà obtenus pour répondre.";
          }

          if (!q) {
            console.log("[Web Search] ❌ No query provided");
            return "Erreur: aucune requête de recherche fournie";
          }

          try {
            searchCount++;
            const searchStart = Date.now();
            const response = await searchWeb(q, 5);
            console.log(`[Web Search] ✓ Search completed in ${Date.now() - searchStart}ms`);
            console.log(`[Web Search] Results: ${response.results.length} / ${response.totalResults} total`);
            return formatSearchResults(response);
          } catch (error: any) {
            console.error("[Web Search] ❌ Error:", error);
            return `Erreur lors de la recherche: ${error.message}`;
          }
        },
      });
    } else {
      console.log(`[Chat API] Google Search not available (no API key)`);
    }

    // Add Supadata web scraping tool if configured
    if (isSupadataAvailable()) {
      console.log(`[Chat API] ✓ Supadata available, adding tools`);
      /*tools.lire_page_web = tool({
        description: "Lit et extrait le contenu complet d'une page web. Utilise cet outil quand l'utilisateur te donne une URL spécifique et veut que tu lises ou analyses son contenu.",
        inputSchema: z.object({
          url: z.string().url().describe("L'URL de la page web à lire"),
        }),
        execute: async ({ url }) => {
          console.log("[Supadata] Scraping URL:", url);
          if (!url) {
            return "Erreur: aucune URL fournie";
          }
          try {
            const content = await scrapeWebContent(url);
            return `# Contenu de ${url}\n\n${content}`;
          } catch (error: any) {
            console.error("[Supadata] Scrape error:", error);
            return `Erreur lors de la lecture de la page: ${error.message}`;
          }
        },
      });*/

      tools.transcrire_video = tool({
        description: "Transcrit une vidéo depuis YouTube, TikTok, Instagram ou X (Twitter). Utilise cet outil quand l'utilisateur te donne une URL de vidéo et veut connaître son contenu ou sa transcription.",
        inputSchema: z.object({
          url: z.string().url().describe("L'URL de la vidéo à transcrire"),
          lang: z.string().optional().describe("Code de langue optionnel (ex: 'fr', 'en')"),
        }),
        execute: async ({ url, lang }) => {
          console.log(`[Supadata] Transcribing video at ${new Date().toISOString()}`);
          console.log("[Supadata] URL:", url, "| Lang:", lang || "auto");
          if (!url) {
            console.log("[Supadata] ❌ No URL provided");
            return "Erreur: aucune URL fournie";
          }
          try {
            const transcriptStart = Date.now();
            const transcript = await getTranscript(url, { lang, text: true });
            console.log(`[Supadata] ✓ Transcription completed in ${Date.now() - transcriptStart}ms`);
            console.log(`[Supadata] Transcript length: ${transcript.length} chars`);
            return `# Transcription de la vidéo\n\n${transcript}`;
          } catch (error: any) {
            console.error("[Supadata] ❌ Transcript error:", error);
            return `Erreur lors de la transcription: ${error.message}`;
          }
        },
      });
    } else {
      console.log(`[Chat API] Supadata not available (no API key)`);
    }

    // Add preview_link tool for Tool UI demonstration
    tools.preview_link = tool({
      description: "Affiche un aperçu visuel d'un lien URL sous forme de carte. Utilise cet outil quand l'utilisateur demande de prévisualiser ou d'afficher un lien.",
      inputSchema: z.object({
        url: z.string().url().describe("L'URL à prévisualiser"),
        title: z.string().optional().describe("Titre optionnel pour la carte"),
        description: z.string().optional().describe("Description optionnelle"),
      }),
      execute: async ({ url, title, description }) => {
        console.log(`[Preview Link] Creating preview for: ${url}`);
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/^www\./, "");

          return {
            id: `link-preview-${Date.now()}`,
            assetId: url,
            kind: "link" as const,
            href: url,
            title: title || `Lien vers ${domain}`,
            description: description || `Contenu de ${domain}`,
            domain,
          };
        } catch (error: any) {
          console.error("[Preview Link] ❌ Error:", error);
          return {
            id: `link-preview-error-${Date.now()}`,
            assetId: url,
            kind: "link" as const,
            href: url,
            title: "Lien",
            description: `Erreur: ${error.message}`,
          };
        }
      },
    });
    console.log(`[Chat API] ✓ Added preview_link tool`);

    // Add show_chart tool
    tools.show_chart = tool({
      description: "Affiche des données sous forme de graphique (barres ou lignes). Utilise cet outil pour visualiser des tendances, comparaisons ou données numériques.",
      inputSchema: z.object({
        type: z.enum(["bar", "line"]).describe("Type de graphique"),
        title: z.string().describe("Titre du graphique"),
        description: z.string().optional().describe("Description optionnelle"),
        data: z.array(z.record(z.string(), z.unknown())).describe("Données à afficher"),
        xKey: z.string().describe("Clé pour l'axe X"),
        series: z.array(z.object({
          key: z.string(),
          label: z.string(),
        })).describe("Séries de données à afficher"),
        showLegend: z.boolean().optional().describe("Afficher la légende"),
        showGrid: z.boolean().optional().describe("Afficher la grille"),
      }),
      execute: async (args) => {
        console.log(`[Show Chart] Creating chart: ${args.title}`);
        return {
          id: `chart-${Date.now()}`,
          ...args,
        };
      },
    });
    console.log(`[Chat API] ✓ Added show_chart tool`);

    // Add show_table tool
    tools.show_table = tool({
      description: "Affiche des données sous forme de tableau triable. Utilise cet outil pour les listes, résultats de recherche ou données structurées.",
      inputSchema: z.object({
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          format: z.object({
            kind: z.enum(["text", "number", "currency", "date", "status", "badge"]),
          }).optional(),
          align: z.enum(["left", "right", "center"]).optional(),
        })).describe("Colonnes du tableau"),
        data: z.array(z.record(z.string(), z.unknown())).describe("Données à afficher"),
      }),
      execute: async ({ columns, data }) => {
        console.log(`[Show Table] Creating table with ${data.length} rows`);
        return {
          id: `table-${Date.now()}`,
          columns,
          data,
        };
      },
    });
    console.log(`[Chat API] ✓ Added show_table tool`);

    // Add show_code tool
    tools.show_code = tool({
      description: "Affiche du code avec coloration syntaxique. Utilise cet outil pour les exemples de code, scripts ou configurations.",
      inputSchema: z.object({
        code: z.string().describe("Le code à afficher"),
        language: z.string().describe("Langage de programmation (typescript, python, bash, etc.)"),
        filename: z.string().optional().describe("Nom du fichier"),
        highlightLines: z.array(z.number()).optional().describe("Lignes à mettre en évidence"),
      }),
      execute: async (args) => {
        console.log(`[Show Code] Creating code block: ${args.language}`);
        return {
          id: `code-${Date.now()}`,
          ...args,
        };
      },
    });
    console.log(`[Chat API] ✓ Added show_code tool`);

    // Add show_media tool for images, videos, audio
    tools.show_media = tool({
      description: "Affiche un média (image, vidéo, audio) avec un titre et une description. Utilise cet outil après avoir généré ou récupéré un média.",
      inputSchema: z.object({
        kind: z.enum(["image", "video", "audio"]).describe("Type de média"),
        src: z.string().url().describe("URL du média"),
        title: z.string().describe("Titre du média"),
        description: z.string().optional().describe("Description ou contexte"),
        alt: z.string().optional().describe("Texte alternatif pour les images"),
        ratio: z.enum(["auto", "1:1", "4:3", "16:9", "9:16"]).optional().describe("Ratio d'aspect"),
      }),
      execute: async (args) => {
        console.log(`[Show Media] Creating media card: ${args.kind} - ${args.title}`);
        return {
          id: `media-${Date.now()}`,
          assetId: `asset-${Date.now()}`,
          ...args,
          alt: args.alt || args.title,
        };
      },
    });
    console.log(`[Chat API] ✓ Added show_media tool`);

    // Add show_options tool - NO execute function means human-in-the-loop
    // Frontend will call addResult when user selects an option
    tools.show_options = tool({
      description: "Présente une liste d'options à l'utilisateur pour faire un choix. L'utilisateur DOIT sélectionner une option. Attends sa réponse.",
      inputSchema: z.object({
        options: z.array(z.object({
          id: z.string(),
          label: z.string(),
          description: z.string().optional(),
        })).describe("Liste des options"),
        selectionMode: z.enum(["single", "multi"]).optional().describe("Mode de sélection"),
      }),
      // No execute function - this is a human-in-the-loop tool
    });
    console.log(`[Chat API] ✓ Added show_options tool (human-in-the-loop)`);

    // Add Reverso translation/synonyms/conjugation tools
    if (isReversoAvailable()) {
      console.log(`[Chat API] ✓ Reverso available, adding tools`);

      // Translation tool - AI generates translation and examples
      tools.afficher_traduction = tool({
        description: "Affiche une traduction avec exemples de contexte. IMPORTANT: Tu dois d'abord TRADUIRE toi-même le texte ET générer 3-5 exemples de phrases utilisant ce mot/expression dans les deux langues, puis appeler cet outil. Fonctionne pour TOUTES les langues.",
        inputSchema: z.object({
          text: z.string().describe("Le texte original"),
          source: z.string().describe("Code de langue source (fr, en, es, de, it, etc.)"),
          target: z.string().describe("Code de langue cible (fr, en, es, de, it, etc.)"),
          translations: z.array(z.string()).describe("Liste de 2-5 traductions alternatives que tu as générées"),
          examples: z.array(z.object({
            source: z.string().describe("Phrase d'exemple dans la langue source"),
            target: z.string().describe("Traduction de la phrase d'exemple"),
          })).optional().describe("3-5 exemples d'utilisation dans les deux langues que tu as générés"),
        }),
        // No execute - AI provides the data directly
      });

      // Synonyms tool - Hybrid: API for French, AI for other languages
      tools.afficher_synonymes = tool({
        description: "Affiche une liste visuelle de synonymes. FRANÇAIS: appelle l'outil avec synonyms vide, l'API sera utilisée automatiquement. AUTRES LANGUES: Tu dois GÉNÉRER toi-même 15-20 synonymes pertinents, puis appeler cet outil.",
        inputSchema: z.object({
          text: z.string().describe("Le mot original"),
          language: z.string().describe("Code de langue (fr, en, es, de, etc.)"),
          synonyms: z.array(z.object({
            id: z.number(),
            synonym: z.string(),
          })).optional().describe("Liste de synonymes (laisse vide/undefined pour français, génère pour autres langues)"),
        }),
        execute: async ({ text, language, synonyms }) => {
          // French - use API
          if (language === "fr" || language === "french") {
            console.log(`[Synonymes] Using API for French word: "${text}"`);
            try {
              const result = await getSynonyms(text, language);
              if (!result.ok) {
                return { error: result.message };
              }
              return {
                id: `synonyms-${Date.now()}`,
                text: result.text,
                source: result.source,
                synonyms: result.synonyms,
              };
            } catch (error: any) {
              console.error("[Synonymes] ❌ API error:", error);
              return { error: error.message };
            }
          }

          // Other languages - use AI-generated data
          console.log(`[Synonymes] Using AI-generated data for "${text}" in ${language}`);
          return {
            id: `synonyms-${Date.now()}`,
            text,
            source: language,
            synonyms: synonyms || [],
          };
        },
      });

      // Conjugation tool - AI generates for all languages
      tools.afficher_conjugaison = tool({
        description: "Affiche la conjugaison complète d'un verbe. IMPORTANT: Tu dois d'abord GÉNÉRER toi-même toutes les conjugaisons du verbe dans tous les temps/modes pertinents pour la langue, puis appeler cet outil pour les afficher. Fonctionne pour TOUTES les langues.",
        inputSchema: z.object({
          infinitive: z.string().describe("Le verbe à l'infinitif"),
          language: z.string().describe("Code de langue (fr, en, es, de, it, etc.)"),
          verbForms: z.array(z.object({
            id: z.number(),
            conjugation: z.string().describe("Nom du temps/mode (ex: Présent, Imparfait, Present Simple, etc.)"),
            verbs: z.array(z.string()).describe("Formes conjuguées pour ce temps"),
          })).describe("Liste complète des conjugaisons que tu as générées"),
        }),
        // No execute - AI provides the data directly
      });

      // Antonyms tool - Hybrid: API for French, AI for other languages
      tools.afficher_antonymes = tool({
        description: "Affiche une liste visuelle d'antonymes (contraires). FRANÇAIS: appelle l'outil avec antonyms vide, l'API sera utilisée automatiquement. AUTRES LANGUES: Tu dois GÉNÉRER toi-même 10-15 antonymes pertinents, puis appeler cet outil.",
        inputSchema: z.object({
          text: z.string().describe("Le mot original"),
          language: z.string().describe("Code de langue (fr, en, es, de, etc.)"),
          antonyms: z.array(z.object({
            id: z.number(),
            antonym: z.string(),
          })).optional().describe("Liste d'antonymes (laisse vide/undefined pour français, génère pour autres langues)"),
        }),
        execute: async ({ text, language, antonyms }) => {
          // French - use API
          if (language === "fr" || language === "french") {
            console.log(`[Antonymes] Using API for French word: "${text}"`);
            try {
              const result = await getAntonyms(text, language);
              if (!result.ok) {
                return { error: result.message };
              }
              return {
                id: `antonyms-${Date.now()}`,
                text: result.text,
                source: result.source,
                antonyms: result.antonyms,
              };
            } catch (error: any) {
              console.error("[Antonymes] ❌ API error:", error);
              return { error: error.message };
            }
          }

          // Other languages - use AI-generated data
          console.log(`[Antonymes] Using AI-generated data for "${text}" in ${language}`);
          return {
            id: `antonyms-${Date.now()}`,
            text,
            source: language,
            antonyms: antonyms || [],
          };
        },
      });

      console.log(`[Chat API] ✓ Added language tools (afficher_traduction, afficher_synonymes, afficher_conjugaison, afficher_antonymes)`);
    } else {
      console.log(`[Chat API] Reverso not available`);
    }

    // Select model based on whether we have images in the FULL conversation history
    // Check BEFORE optimization to ensure we detect images even if they were optimized out
    const containsImages = hasImages(messages);
    console.log(`[Chat API] Images detected: ${containsImages}`);

    // Optimize message context to reduce API usage
    console.log(`[Chat API] Optimizing message context...`);
    let optimizedMessages = optimizeMessageContext(messages);
    console.log(`[Chat API] ✓ Messages optimized: ${messages.length} → ${optimizedMessages.length}`);

    // Limit images to MAX_IMAGES (5) to prevent model errors
    if (containsImages) {
      console.log(`[Chat API] Limiting images to ${MAX_IMAGES}...`);
      optimizedMessages = limitImages(optimizedMessages);
    }

    const selectedModel = containsImages ? VISION_MODEL : MODELS[0];
    console.log(`[Chat API] Model selected: ${selectedModel}`);

    // Convert messages to model messages format
    console.log(`[Chat API] Converting to model messages format...`);
    let modelMessages = convertToModelMessages(optimizedMessages);

    // Remove reasoning only for vision model (not supported)
    if (containsImages) {
      console.log(`[Chat API] Removing reasoning (vision model)`);
      modelMessages = modelMessages.map(removeReasoning);
    }

    // Build system prompt with available tools
    const toolNames = Object.keys(tools);
    console.log(`[Chat API] Total tools: ${toolNames.length}`);
    console.log(`[Chat API] Tool names: ${toolNames.join(", ") || "none"}`);

    let systemPrompt = `
Tu es Aurora, IA d'aide scolaire pour lycéens. Français.

STYLE:
- Direct, concis, encourageant
- Adapté au niveau sans infantiliser
- Court si simple, structuré si complexe

FORMATAGE (auto, jamais expliqué):
Maths: \\(inline\\) ou $$block$$
Mermaid: guillemets OBLIGATOIRES A["Texte (date)"]
Images/vidéos: markdown ![](url) ou [lien](url)

OUTILS VISUELS (utilise-les activement et créativement):
- show_chart: graphiques barres/lignes (données numériques, statistiques, évolutions)
- show_table: tableaux triables (listes structurées, comparaisons)
- show_code: code avec coloration (exemples de programmation)
- show_media: images/vidéos/audio (médias)
- preview_link: aperçu de liens (URLs)
- show_options: liste de choix (questions à choix multiples)
- afficher_traduction: traduction avec exemples que TU génères (toutes langues)
- afficher_synonymes: synonymes (français=API auto, autres=tu génères)
- afficher_antonymes: antonymes (français=API auto, autres=tu génères)
- afficher_conjugaison: conjugaisons que TU génères (toutes langues)

USAGE CRÉATIF DES OUTILS:
Les outils visuels peuvent être utilisés MÊME si non demandés explicitement:
- Vocabulaire/définition → appelle afficher_synonymes
- Demande d'antonymes → appelle afficher_antonymes
- Question sur un verbe → génère conjugaisons + appelle afficher_conjugaison
- Texte en langue étrangère → génère traduction + appelle afficher_traduction
- Données/comparaison → affiche tableau ou graphique
- Code → utilise show_code au lieu de markdown
- Question à choix multiple → appelle show_options

IMPORTANT - GÉNÉRATION DE DONNÉES LINGUISTIQUES:
1. afficher_traduction: TOUJOURS générer 2-5 traductions + 3-5 exemples contextuels
2. afficher_synonymes:
   - FRANÇAIS (fr): appelle l'outil avec text + language="fr" + synonyms VIDE (API auto)
   - AUTRES LANGUES: génère 15-20 synonymes + appelle l'outil
3. afficher_antonymes:
   - FRANÇAIS (fr): appelle l'outil avec text + language="fr" + antonyms VIDE (API auto)
   - AUTRES LANGUES: génère 10-15 antonymes + appelle l'outil
4. afficher_conjugaison: TOUJOURS générer toutes conjugaisons (tous temps/modes)

RÈGLES CRITIQUES OUTILS VISUELS:
1. Les outils s'affichent AUTOMATIQUEMENT en haut du message
2. APRÈS avoir appelé un outil: réponds seulement avec du texte simple
3. INTERDIT après un outil:
   - Tableaux markdown (| col | col |)
   - Images markdown (![...](url))
   - Blocs de code (\`\`\`code\`\`\`)
   - Toute représentation visuelle du même contenu
4. BON exemple: [appel show_table] puis "Voici les données demandées."
5. MAUVAIS exemple: [appel show_table] puis "Voici le tableau:\n| A | B |..."
6. Outils multilingues: traduire, afficher_synonymes, afficher_antonymes, afficher_conjugaison
REGLE D'OR: lors de l'utilisation d'outils visuels, ne répéte JAMAIS le contenu.

RECHERCHE WEB:
- Si infos actuelles nécessaires uniquement
- Synthétise le contenu chargé (3 premiers sites)
- Cite sources brièvement en fin
- Max 2 recherches par message

ÉVITER:
- Intros/répétitions/conclusions bateau
- Détails non demandés
- Explications du formatage

───────────────

FICHIERS

create_file(data, persistent=True) → 1 fichier
generate_and_archive(files_data) → archive

RÈGLES:
- Archive SI demandé ("zip", "archive")
- Sinon: create_file par fichier
- PPTX/DOCX/PDF = 1 fichier

Data: {format:"pdf|docx|pptx|xlsx|csv|txt|json", filename, content, slides_data}

PPTX: {title, content:[], image_query, image_position, image_size}
DOCX: {type:"title|paragraph|list|image|table", text, items:[], query, data:[[]]}
PDF: ![](image_query: keyword)

───────────────

EDIT DOCUMENT

1. tool_full_context_document_post(file_id)
2. Review: tool_review_document_post(comments=[(index,"text")])
3. Edit: tool_edit_document_post({edits:[["sid:X/shid:Y",["text"]]], ops:[["insert_after",X,"n1"]]})

Jamais afficher contenu, juste appeler outil
`;

    console.log(`[Chat API] System prompt length: ${systemPrompt.length} chars`);
    console.log(`[Chat API] Starting stream with Groq...`);
    const streamStartTime = Date.now();

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: groq(selectedModel),
      system: systemPrompt,
      messages: modelMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(5),
      temperature: 0.7,
    });

    console.log(`[Chat API] Stream created, returning response...`);
    console.log(`[Chat API] Total setup time: ${Date.now() - requestStartTime.getTime()}ms`);

    // Return the UI message stream response
    return result.toUIMessageStreamResponse({
      originalMessages: optimizedMessages,
      onError: (error) => {
        console.error(`[Chat API] ❌ Stream error at ${new Date().toISOString()}:`, error);
        console.error(`[Chat API] Stream duration before error: ${Date.now() - streamStartTime}ms`);
        if (error == null) {
          return "Erreur inconnue";
        }
        if (typeof error === "string") {
          return error;
        }
        if (error instanceof Error) {
          return error.message;
        }
        return JSON.stringify(error);
      },
    });
  } catch (error: any) {
    console.error(`[Chat API] ❌ Fatal error at ${new Date().toISOString()}:`, error);
    console.error(`[Chat API] Stack:`, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}