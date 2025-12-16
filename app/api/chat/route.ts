import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { getCurrentUserServer } from "@/lib/appwrite/server";
import { getComposioTools, isComposioAvailable } from "@/lib/composio/client";
import { getEnabledToolkitSlugs } from "@/lib/composio/config";
import { getMCPTools, isMCPAvailable } from "@/lib/mcp/client";
import { optimizeMessageContext } from "@/lib/groq/context";
import { searchWeb, formatSearchResults, isGoogleSearchAvailable } from "@/lib/search/google";

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

// Helper to check if messages contain images (AI SDK v5 format)
function hasImages(messages: any[]): boolean {
  return messages.some((msg) => {
    // AI SDK v5: images are in 'parts' array with type 'file' and mediaType starting with 'image/'
    if (msg.parts && Array.isArray(msg.parts)) {
      const hasImagePart = msg.parts.some((part: any) =>
        (part.type === "file" && part.mediaType?.startsWith("image/")) ||
        part.type === "image"
      );
      if (hasImagePart) {
        return true;
      }
    }
    // Legacy format: images in 'content' array
    if (msg.content && Array.isArray(msg.content)) {
      const hasImageContent = msg.content.some((c: any) =>
        c.type === "image" ||
        c.type === "image_url" ||
        (c.type === "file" && c.mediaType?.startsWith("image/"))
      );
      if (hasImageContent) {
        return true;
      }
    }
    return false;
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get tools from all sources
    let tools: Record<string, any> = {};

    // 1. Get Composio tools for connected toolkits
    if (isComposioAvailable()) {
      try {
        const enabledToolkits = getEnabledToolkitSlugs();

        if (enabledToolkits.length > 0) {
          const composioTools = await getComposioTools(user.$id, {
            toolkits: enabledToolkits,
            limit: 50,
          });
          tools = { ...tools, ...composioTools };
        }
      } catch (toolError) {
        console.warn("[Chat API] Composio tools not available:", toolError);
      }
    }

    // 2. Get MCP HTTP server tools
    if (isMCPAvailable()) {
      try {
        const mcpTools = await getMCPTools();
        tools = { ...tools, ...mcpTools };
        console.log(`[Chat API] Loaded ${Object.keys(mcpTools).length} MCP tools`);
      } catch (mcpError) {
        console.warn("[Chat API] MCP tools not available:", mcpError);
      }
    }

    // Add web search tool if configured
    if (isGoogleSearchAvailable()) {
      tools.recherche_internet = tool({
        description: "Recherche sur internet pour obtenir des informations actuelles, récentes ou en temps réel. Utilise cet outil quand l'utilisateur demande des informations que tu ne connais pas ou qui nécessitent des données actualisées.",
        inputSchema: z.object({
          q: z.string().describe("La requête de recherche"),
        }),
        execute: async ({ q }) => {
          console.log("[Web Search] Query:", q);
          if (!q) {
            return "Erreur: aucune requête de recherche fournie";
          }
          try {
            const response = await searchWeb(q, 5);
            return formatSearchResults(response);
          } catch (error: any) {
            console.error("[Web Search] Error:", error);
            return `Erreur lors de la recherche: ${error.message}`;
          }
        },
      });
    }

    // Select model based on whether we have images in the FULL conversation history
    // Check BEFORE optimization to ensure we detect images even if they were optimized out
    const containsImages = hasImages(messages);

    // Optimize message context to reduce API usage
    const optimizedMessages = optimizeMessageContext(messages);
    const selectedModel = containsImages ? VISION_MODEL : MODELS[0];

    // Convert messages to model messages format
    let modelMessages = convertToModelMessages(optimizedMessages);

    // Remove reasoning only for vision model (not supported)
    if (containsImages) {
      modelMessages = modelMessages.map(removeReasoning);
    }

    // Build system prompt with available tools
    const toolNames = Object.keys(tools);
    let systemPrompt = `Tu es Aurora, une IA sympa qui aide les lycéens dans leurs études. Tu parles français.

🎯 TON STYLE
- Va droit au but, pas de blabla
- Réponds de façon claire et concise
- Sois encourageant mais pas niais
- Adapte-toi à leur niveau sans les prendre pour des idiots
- Si c'est simple, fais court. Si c'est complexe, structure bien

📝 FORMATAGE (utilisé automatiquement, jamais expliqué)

Maths → LaTeX:
- Inline: \\(x^2 + 1\\)
- Block: $$\\int_0^1 x\\,dx$$

Schémas → Mermaid (quand ça aide vraiment):
\`\`\`mermaid
graph TD
A["Concept"] --> B["Sous-concept"]
\`\`\`
⚠️ Guillemets obligatoires si caractères spéciaux: A["Texte (date)"]

Images/vidéos: TOUJOURS formater en markdown pour affichage automatique.
- Image: ![description](url)
- Vidéo: [Voir la vidéo](url)

Recherche sur internet:
- Utilise l'outil recherche_internet UNIQUEMENT quand tu as besoin d'infos actuelles/récentes
- L'outil charge automatiquement le contenu des 3 premiers sites
- UTILISE CE CONTENU pour répondre de façon détaillée et précise
- NE LISTE PAS les URLs comme réponse - synthétise l'information
- Cite tes sources brièvement en fin de réponse
- N'essaye pas d'autres outils

🚫 À ÉVITER
- Les intros du genre "Excellente question !"
- Répéter leur question
- Expliquer comment lire un schéma
- Les conclusions bateau "N'hésite pas si..."
- Trop de détails non demandés

Donne la réponse, point.`;

    if (toolNames.length > 0) {
      const toolDescriptions = toolNames.slice(0, 20).map((name) => {
        const t = tools[name] as any;
        return `- **${name}**: ${t.description || "Outil disponible"}`;
      }).join("\n");

      systemPrompt += `

## Tes outils disponibles

Tu as accès aux outils suivants que tu peux utiliser pour aider l'utilisateur:

${toolDescriptions}
${toolNames.length > 20 ? `\n...(et ${toolNames.length - 20} autres outils)` : ''}

Utilise ces outils quand c'est pertinent pour répondre aux demandes de l'utilisateur.`;
    }

    // Stream the response using Vercel AI SDK
    const result = streamText({
      model: groq(selectedModel),
      system: systemPrompt,
      messages: modelMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(5),
      temperature: 0.7,
    });

    // Return the UI message stream response
    return result.toUIMessageStreamResponse({
      originalMessages: optimizedMessages,
      onError: (error) => {
        console.error("[Chat API] Stream error:", error);
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
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}