import { NextRequest } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { xai } from "@ai-sdk/xai";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// AI Provider configuration
type ProviderType = "xai" | "groq";

interface ModelConfig {
  provider: ProviderType;
  model: string;
}

// Check if xAI is available
const isXAIAvailable = () => !!process.env.XAI_API_KEY;

// Model selection: prefer xAI Grok 4.1 Fast Non-Reasoning for code tutoring, fallback to Groq
const getModelConfig = (): ModelConfig => {
  if (isXAIAvailable()) {
    console.log("[Prof API] Using xAI Grok 4.1 Fast Non-Reasoning");
    return { provider: "xai", model: "grok-4-1-fast-non-reasoning" };
  }
  console.log("[Prof API] Using Groq gpt-oss-120b");
  return { provider: "groq", model: "openai/gpt-oss-120b" };
};

// Get provider instance
const getProviderInstance = (config: ModelConfig) => {
  switch (config.provider) {
    case "xai":
      return xai(config.model);
    case "groq":
      return groq(config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
};

interface SimpleMessage {
    role: "user" | "assistant";
    content: string;
}

interface ProfRequest {
    messages: SimpleMessage[];
    code: string;
    fileName: string;
    consoleOutput: string[];
}

export async function POST(req: NextRequest) {
    console.log(`[Prof API] ===== NEW REQUEST =====`);

    try {
        const user = await getCurrentUserServer();

        if (!user) {
            console.log(`[Prof API] ❌ Authentication failed`);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
        console.log(`[Prof API] ✓ User: ${user.$id}`);

        const { messages, code, fileName, consoleOutput }: ProfRequest = await req.json();

        if (!messages || !Array.isArray(messages)) {
            console.log(`[Prof API] ❌ Invalid messages:`, messages);
            return new Response(
                JSON.stringify({ error: "Messages are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log(`[Prof API] Code: ${code?.length || 0} chars, File: ${fileName}`);
        console.log(`[Prof API] Console: ${consoleOutput?.length || 0} entries`);
        console.log(`[Prof API] Messages: ${messages.length}`);

        // Build context for the Prof
        const codeContext = code
            ? `\n\n=== CODE ACTUEL (${fileName}) ===\n\`\`\`python\n${code}\n\`\`\`\n`
            : "";

        const consoleContext = consoleOutput && consoleOutput.length > 0
            ? `\n\n=== SORTIE CONSOLE ===\n${consoleOutput.slice(-20).join("\n")}\n`
            : "";

        const systemPrompt = `Tu es un professeur de programmation Python bienveillant et pédagogue pour lycéens français.

CONTEXTE ACTUEL:${codeContext}${consoleContext}

TON RÔLE:
- Explique les concepts de façon claire et accessible
- Aide à debugger les erreurs en guidant l'élève
- Propose des améliorations et bonnes pratiques
- Encourage et motive l'élève
- SURTOUT ne parle pas trop. Répond juste sans dire des choses inutiles (pas d'autre point, pas d'autre question, etc).

RÉPONSES:
- Courtes et ciblées
- Exemples concrets
- Pour montrer du code exemple, utilise \`\`\`python (sans :apply)
- Ne donne pas la solution complète directement, guide l'élève
- Utilise le markdown: **gras**, *italique*, listes. PAS DE TABLEAU.

MODIFICATIONS IMPORTANTES:
- SEULEMENT utiliser \`\`\`python:apply quand tu proposes UNE VERSION COMPLÈTE du fichier corrigée
- N'utilise apply que si l'élève demande explicitement de corriger/modifier son code
- Pour des exemples ou explications, utilise \`\`\`python normal (SANS :apply)
- Limite à 1 seul bloc :apply par réponse maximum
- corrige UNIQUEMENT les erreurs ou la modification demandée par l'élève, JAMAIS plus de choses (pas d'autre d'améliorations, etc)

Exemple CORRECT d'explication:
"Pour faire une boucle, tu peux utiliser:
\`\`\`python
for i in range(10):
    print(i)
\`\`\`"

Exemple CORRECT de modification (quand demandée):
"Voici ton code corrigé:
\`\`\`python:apply
[... tout le fichier corrigé ici ...]
\`\`\`"`;

        // Convert simple messages to CoreMessage format
        const coreMessages: CoreMessage[] = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        // Get model configuration (xAI if available, Groq as fallback)
        const modelConfig = getModelConfig();
        const modelInstance = getProviderInstance(modelConfig);

        console.log(`[Prof API] Provider: ${modelConfig.provider}, Model: ${modelConfig.model}`);

        // Stream the response
        const result = streamText({
            model: modelInstance,
            system: systemPrompt,
            messages: coreMessages,
            temperature: 0.7,
        });

        console.log(`[Prof API] Stream started`);

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error(`[Prof API] ❌ Fatal error:`, error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
