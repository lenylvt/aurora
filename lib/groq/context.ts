import type { UIMessage } from "ai";

/**
 * Configuration pour la gestion du contexte
 */
export const CONTEXT_CONFIG = {
  // Nombre maximum de messages à envoyer à l'API
  MAX_MESSAGES: 20,

  // Garder toujours les N premiers messages (pour le contexte initial)
  KEEP_INITIAL_MESSAGES: 2,

  // Taille maximale estimée du contexte en tokens (approximatif)
  MAX_CONTEXT_TOKENS: 10000,

  // Estimation: ~4 caractères = 1 token
  CHARS_PER_TOKEN: 4,
};

/**
 * Estime le nombre de tokens à partir du nombre de caractères
 */
function estimateTokens(charCount: number): number {
  const tokens = Math.ceil(charCount / CONTEXT_CONFIG.CHARS_PER_TOKEN);
  return tokens;
}

/**
 * Calcule la taille totale d'un message en tokens
 */
function getMessageSize(message: UIMessage): number {
  let totalChars = 0;

  // UIMessage has different structure - check the actual content
  const content = (message as any).content;

  if (typeof content === 'string') {
    totalChars += content.length;
  } else if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'text' && 'text' in part) {
        totalChars += (part.text || '').length;
      }
    }
  }

  return estimateTokens(totalChars);
}

/**
 * Optimise le contexte des messages pour réduire la consommation API
 * Stratégie:
 * 1. Garde les N premiers messages (contexte initial important)
 * 2. Garde les M derniers messages (conversation récente)
 * 3. Limite le nombre total de tokens
 */
export function optimizeMessageContext(messages: UIMessage[]): UIMessage[] {
  const startTime = Date.now();
  console.log(`[Context] optimizeMessageContext called at ${new Date().toISOString()}`);
  console.log(`[Context] Input: ${messages.length} messages`);
  console.log(`[Context] Config: MAX_MESSAGES=${CONTEXT_CONFIG.MAX_MESSAGES}, KEEP_INITIAL=${CONTEXT_CONFIG.KEEP_INITIAL_MESSAGES}, MAX_TOKENS=${CONTEXT_CONFIG.MAX_CONTEXT_TOKENS}`);

  // Si peu de messages, retourner tous
  if (messages.length <= CONTEXT_CONFIG.MAX_MESSAGES) {
    console.log(`[Context] ✓ No optimization needed (${messages.length} <= ${CONTEXT_CONFIG.MAX_MESSAGES})`);
    return messages;
  }

  console.log(`[Context] Optimization required...`);
  const initialMessages = messages.slice(0, CONTEXT_CONFIG.KEEP_INITIAL_MESSAGES);
  const recentMessages = messages.slice(-CONTEXT_CONFIG.MAX_MESSAGES + CONTEXT_CONFIG.KEEP_INITIAL_MESSAGES);
  console.log(`[Context] Keeping ${initialMessages.length} initial + ${recentMessages.length} recent messages`);

  // Combine initial + récents
  const optimizedMessages = [
    ...initialMessages,
    ...recentMessages,
  ];

  // Vérifie la taille totale en tokens
  let totalTokens = 0;
  const finalMessages: UIMessage[] = [];

  // Commence par la fin (messages les plus récents sont les plus importants)
  for (let i = optimizedMessages.length - 1; i >= 0; i--) {
    const msg = optimizedMessages[i];
    const msgTokens = getMessageSize(msg);

    // Si ajouter ce message dépasse la limite, arrête
    if (totalTokens + msgTokens > CONTEXT_CONFIG.MAX_CONTEXT_TOKENS && finalMessages.length > 0) {
      console.log(`[Context] Token limit reached at message ${i} (${totalTokens} + ${msgTokens} > ${CONTEXT_CONFIG.MAX_CONTEXT_TOKENS})`);
      break;
    }

    finalMessages.unshift(msg);
    totalTokens += msgTokens;
  }

  console.log(`[Context] ✓ Optimized: ${messages.length} → ${finalMessages.length} messages (~${totalTokens} tokens) in ${Date.now() - startTime}ms`);

  return finalMessages;
}

/**
 * Résume l'historique en un message système pour garder le contexte
 * (Pour future implémentation si besoin)
 */
export function summarizeHistory(messages: UIMessage[]): string {
  console.log(`[Context] summarizeHistory called with ${messages.length} messages`);
  const userMessages = messages.filter(m => m.role === 'user');
  console.log(`[Context] Found ${userMessages.length} user messages`);
  const topics = new Set<string>();

  userMessages.forEach(msg => {
    const content = (msg as any).content;
    if (typeof content === 'string') {
      // Extrait les premiers mots comme "topics"
      const words = content.split(' ').slice(0, 5).join(' ');
      if (words.length > 10) {
        topics.add(words);
      }
    }
  });

  if (topics.size === 0) {
    console.log(`[Context] No topics extracted`);
    return '';
  }

  const summary = `Contexte de la conversation précédente: ${Array.from(topics).slice(0, 3).join(', ')}`;
  console.log(`[Context] Summary: "${summary}"`);
  return summary;
}
