import OpenAI from "openai";

// Initialize OpenAI client with Groq base URL
console.log(`[Groq Naming] Initializing OpenAI client with Groq base URL`);
const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});
console.log(`[Groq Naming] ✓ Client initialized, API key present: ${!!process.env.GROQ_API_KEY}`);

// Models to try in order of preference
const TITLE_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

export async function generateConversationTitle(userMessage: string): Promise<string> {
  const startTime = Date.now();
  console.log(`[Groq Naming] generateConversationTitle called at ${new Date().toISOString()}`);
  console.log(`[Groq Naming] Input message length: ${userMessage.length} chars`);

  // Limit message length for analysis (100 chars is enough for title generation)
  const messagePreview = userMessage.slice(0, 100);
  console.log(`[Groq Naming] Preview: "${messagePreview}${userMessage.length > 100 ? '...' : ''}"`);

  for (const model of TITLE_MODELS) {
    console.log(`[Groq Naming] Trying model: ${model}...`);
    const modelStartTime = Date.now();

    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Generate a short and precise title (3-6 words maximum) to summarize this conversation. Reply ONLY with the title, without quotes, without final period. Must be in message language (French).",
          },
          {
            role: "user",
            content: messagePreview,
          },
        ],
        model,
        temperature: 0.3,
        max_tokens: 30,
      });

      const title = completion.choices[0]?.message?.content?.trim();
      console.log(`[Groq Naming] Model ${model} response: "${title}" (${Date.now() - modelStartTime}ms)`);

      if (title && title.length > 0) {
        // Clean the title: remove quotes, trailing periods
        const cleanTitle = title
          .replace(/^["'\`]+|["'\`]+$/g, "")
          .replace(/\.+$/, "")
          .slice(0, 60);

        console.log(`[Groq Naming] ✓ Title generated: "${cleanTitle}" in ${Date.now() - startTime}ms`);
        return cleanTitle || "Nouvelle conversation";
      }
    } catch (error: any) {
      console.error(`[Groq Naming] ❌ Error with model ${model}: ${error.message} (${Date.now() - modelStartTime}ms)`);
      continue;
    }
  }

  // Fallback: use first words of the message as title
  console.log(`[Groq Naming] All models failed, using fallback`);
  const words = userMessage.trim().split(/\s+/).slice(0, 5).join(" ");
  const fallbackTitle = words.slice(0, 40);
  const finalTitle = fallbackTitle + (userMessage.length > 40 ? "..." : "") || "Nouvelle conversation";
  console.log(`[Groq Naming] Fallback title: "${finalTitle}" (${Date.now() - startTime}ms)`);
  return finalTitle;
}