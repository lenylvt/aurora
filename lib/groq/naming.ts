import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Modèles à essayer dans l'ordre de préférence
const TITLE_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

export async function generateConversationTitle(userMessage: string): Promise<string> {
  // Limiter la longueur du message pour l'analyse
  const messagePreview = userMessage.slice(0, 200);

  for (const model of TITLE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Génère un titre court et précis (3-6 mots maximum) pour résumer cette conversation. Réponds UNIQUEMENT avec le titre, sans guillemets, sans point final.",
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

      if (title && title.length > 0) {
        // Nettoyer le titre : enlever guillemets, points finaux
        const cleanTitle = title
          .replace(/^["'\`]+|["'\`]+$/g, "")
          .replace(/\.+$/, "")
          .slice(0, 60);

        return cleanTitle || "Nouvelle conversation";
      }
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
      // Continuer avec le modèle suivant
      continue;
    }
  }

  // Fallback : utiliser les premiers mots du message
  const words = userMessage.split(" ").slice(0, 6).join(" ");
  return words.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
}
