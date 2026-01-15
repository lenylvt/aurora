import OpenAI from "openai";

// Check if xAI is available
const isXAIAvailable = () => !!process.env.XAI_API_KEY;

// Initialize OpenAI clients
let xaiClient: OpenAI | null = null;
let groqClient: OpenAI | null = null;

if (isXAIAvailable()) {
  console.log(`[AI Naming] Initializing xAI client`);
  xaiClient = new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
  });
  console.log(`[AI Naming] ✓ xAI client initialized`);
}

console.log(`[AI Naming] Initializing Groq client`);
groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});
console.log(`[AI Naming] ✓ Groq client initialized, API key present: ${!!process.env.GROQ_API_KEY}`);

// Models to try in order of preference (xAI first if available, then Groq)
interface TitleModelConfig {
  client: OpenAI;
  model: string;
  provider: string;
}

const getTitleModels = (): TitleModelConfig[] => {
  const models: TitleModelConfig[] = [];

  // Add xAI models first (if available)
  if (xaiClient && isXAIAvailable()) {
    models.push(
      { client: xaiClient, model: "grok-4-1-fast-non-reasoning-mini", provider: "xAI" }, // Lightweight, fast
    );
  }

  // Add Groq models as fallback
  if (groqClient) {
    models.push(
      { client: groqClient, model: "llama-3.1-8b-instant", provider: "Groq" }
    );
  }

  return models;
};

export async function generateConversationTitle(userMessage: string): Promise<string> {
  const startTime = Date.now();
  console.log(`[AI Naming] generateConversationTitle called at ${new Date().toISOString()}`);
  console.log(`[AI Naming] Input message length: ${userMessage.length} chars`);

  // Limit message length for analysis (100 chars is enough for title generation)
  const messagePreview = userMessage.slice(0, 100);
  console.log(`[AI Naming] Preview: "${messagePreview}${userMessage.length > 100 ? '...' : ''}"`);

  // Get available models (xAI first if available, then Groq)
  const titleModels = getTitleModels();
  console.log(`[AI Naming] Available models: ${titleModels.map(m => `${m.provider}/${m.model}`).join(", ")}`);

  for (const modelConfig of titleModels) {
    console.log(`[AI Naming] Trying ${modelConfig.provider}/${modelConfig.model}...`);
    const modelStartTime = Date.now();

    try {
      const completion = await modelConfig.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Create a title of this message in 3-6 words maximum. Reply ONLY with the title, without quotes, without final period. Must be in message language (French). Your not creating a response, just a title, don't try to create a response. Summarize what the user said in 3-6 words maximum.",
          },
          {
            role: "user",
            content: messagePreview,
          },
        ],
        model: modelConfig.model,
        temperature: 0.3,
        max_tokens: 30,
      });

      const title = completion.choices[0]?.message?.content?.trim();
      console.log(`[AI Naming] ${modelConfig.provider}/${modelConfig.model} response: "${title}" (${Date.now() - modelStartTime}ms)`);

      if (title && title.length > 0) {
        // Clean the title: remove quotes, trailing periods
        const cleanTitle = title
          .replace(/^["'\`]+|["'\`]+$/g, "")
          .replace(/\.+$/, "")
          .slice(0, 60);

        console.log(`[AI Naming] ✓ Title generated: "${cleanTitle}" in ${Date.now() - startTime}ms`);
        return cleanTitle || "Nouvelle conversation";
      }
    } catch (error: any) {
      console.error(`[AI Naming] ❌ Error with ${modelConfig.provider}/${modelConfig.model}: ${error.message} (${Date.now() - modelStartTime}ms)`);
      continue;
    }
  }

  // Fallback: use first words of the message as title
  console.log(`[AI Naming] All models failed, using fallback`);
  const words = userMessage.trim().split(/\s+/).slice(0, 5).join(" ");
  const fallbackTitle = words.slice(0, 40);
  const finalTitle = fallbackTitle + (userMessage.length > 40 ? "..." : "") || "Nouvelle conversation";
  console.log(`[AI Naming] Fallback title: "${finalTitle}" (${Date.now() - startTime}ms)`);
  return finalTitle;
}