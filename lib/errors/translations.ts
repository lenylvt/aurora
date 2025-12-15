/**
 * Système de traduction des erreurs API en français
 * Supporte : Groq, Appwrite, Composio
 */

export type ApiProvider = 'groq' | 'appwrite' | 'composio' | 'unknown';

interface ErrorTranslation {
  code: number;
  type?: string;
  message: string;
  description?: string;
}

/**
 * Traductions des erreurs Groq
 */
const GROQ_ERRORS: Record<number, ErrorTranslation> = {
  // Success
  200: {
    code: 200,
    message: 'Requête réussie',
    description: 'La requête a été exécutée avec succès.',
  },

  // Client Errors
  400: {
    code: 400,
    message: 'Requête invalide',
    description: 'Le serveur n\'a pas pu comprendre la requête en raison d\'une syntaxe invalide. Vérifiez le format de votre requête.',
  },
  401: {
    code: 401,
    message: 'Non autorisé',
    description: 'La requête n\'a pas abouti car elle manque d\'informations d\'authentification valides. Vérifiez que votre clé API est valide.',
  },
  403: {
    code: 403,
    message: 'Accès interdit',
    description: 'La requête n\'est pas autorisée en raison de restrictions de permissions. Vérifiez vos autorisations.',
  },
  404: {
    code: 404,
    message: 'Ressource introuvable',
    description: 'La ressource demandée n\'a pas pu être trouvée. Vérifiez l\'URL de la requête.',
  },
  413: {
    code: 413,
    message: 'Requête trop volumineuse',
    description: 'Le corps de la requête est trop volumineux. Veuillez réduire la taille de votre requête.',
  },
  422: {
    code: 422,
    message: 'Entité non traitable',
    description: 'La requête est bien formée mais n\'a pas pu être traitée en raison d\'erreurs sémantiques. Vérifiez les données fournies.',
  },
  424: {
    code: 424,
    message: 'Dépendance échouée',
    description: 'La requête a échoué car une requête dépendante a échoué. Cela peut se produire en cas de problèmes d\'authentification.',
  },
  429: {
    code: 429,
    message: 'Trop de requêtes',
    description: 'Trop de requêtes ont été envoyées dans un laps de temps donné. Veuillez ralentir vos requêtes et respecter les limites.',
  },
  498: {
    code: 498,
    message: 'Capacité Flex Tier dépassée',
    description: 'Le niveau flexible est à pleine capacité et la requête ne sera pas traitée. Réessayez plus tard.',
  },
  499: {
    code: 499,
    message: 'Requête annulée',
    description: 'La requête a été annulée par l\'appelant.',
  },

  // Server Errors
  500: {
    code: 500,
    message: 'Erreur interne du serveur',
    description: 'Une erreur générique s\'est produite sur le serveur. Réessayez plus tard ou contactez le support.',
  },
  502: {
    code: 502,
    message: 'Passerelle incorrecte',
    description: 'Le serveur a reçu une réponse invalide d\'un serveur en amont. Cela peut être temporaire, réessayez.',
  },
  503: {
    code: 503,
    message: 'Service indisponible',
    description: 'Le serveur n\'est pas prêt à traiter la requête, souvent en raison de maintenance ou de surcharge. Attendez avant de réessayer.',
  },

  // Informational
  206: {
    code: 206,
    message: 'Contenu partiel',
    description: 'Seule une partie de la ressource est livrée, généralement en réponse aux en-têtes de plage envoyés par le client.',
  },
};

/**
 * Traductions des erreurs Appwrite
 */
const APPWRITE_ERRORS: Record<string, ErrorTranslation> = {
  // Platform errors
  'general_mock': {
    code: 400,
    type: 'general_mock',
    message: 'Erreur de test',
    description: 'Erreurs générales lancées par le contrôleur de simulation utilisé pour les tests.',
  },
  'general_argument_invalid': {
    code: 400,
    type: 'general_argument_invalid',
    message: 'Arguments invalides',
    description: 'La requête contient un ou plusieurs arguments invalides. Consultez la documentation de l\'endpoint.',
  },
  'general_query_limit_exceeded': {
    code: 400,
    type: 'general_query_limit_exceeded',
    message: 'Limite de requête dépassée',
    description: 'La limite de requête a été dépassée pour la colonne actuelle. L\'utilisation de plus de 100 valeurs de requête sur une seule colonne est interdite.',
  },
  'general_query_invalid': {
    code: 400,
    type: 'general_query_invalid',
    message: 'Requête invalide',
    description: 'La syntaxe de la requête est invalide. Vérifiez la requête et réessayez.',
  },
  'general_cursor_not_found': {
    code: 400,
    type: 'general_cursor_not_found',
    message: 'Curseur invalide',
    description: 'Le curseur est invalide. Cela peut se produire si l\'élément représenté par le curseur a été supprimé.',
  },
  'general_provider_failure': {
    code: 400,
    type: 'general_provider_failure',
    message: 'Échec du fournisseur VCS',
    description: 'Le fournisseur VCS (système de contrôle de version) n\'a pas pu traiter la requête. Réessayez ou contactez le support.',
  },
  'project_unknown': {
    code: 400,
    type: 'project_unknown',
    message: 'Projet inconnu',
    description: 'L\'ID du projet est manquant ou invalide. Vérifiez la valeur de l\'en-tête X-Appwrite-Project.',
  },
  'project_key_expired': {
    code: 401,
    type: 'project_key_expired',
    message: 'Clé de projet expirée',
    description: 'La clé du projet a expiré. Générez une nouvelle clé via la console Appwrite.',
  },
  'general_unknown_origin': {
    code: 403,
    type: 'general_unknown_origin',
    message: 'Origine inconnue',
    description: 'La requête provient d\'une origine inconnue. Si vous faites confiance à ce domaine, ajoutez-le comme plateforme de confiance dans la console Appwrite.',
  },
  'general_access_forbidden': {
    code: 401,
    type: 'general_access_forbidden',
    message: 'Accès interdit',
    description: 'L\'accès à cette API est interdit.',
  },
  'general_unauthorized_scope': {
    code: 401,
    type: 'general_unauthorized_scope',
    message: 'Portée non autorisée',
    description: 'L\'utilisateur actuel ou la clé API n\'a pas les portées requises pour accéder à la ressource demandée.',
  },
  'general_route_not_found': {
    code: 404,
    type: 'general_route_not_found',
    message: 'Route introuvable',
    description: 'La route demandée n\'a pas été trouvée. Consultez la documentation de l\'API et réessayez.',
  },
  'general_not_implemented': {
    code: 405,
    type: 'general_not_implemented',
    message: 'Non implémenté',
    description: 'Cette méthode n\'a pas encore été entièrement implémentée. Mettez à jour votre serveur Appwrite si vous pensez qu\'il s\'agit d\'une erreur.',
  },
  'general_rate_limit_exceeded': {
    code: 429,
    type: 'general_rate_limit_exceeded',
    message: 'Limite de débit dépassée',
    description: 'La limite de débit pour l\'endpoint actuel a été dépassée. Réessayez après un moment.',
  },
  'general_unknown': {
    code: 500,
    type: 'general_unknown',
    message: 'Erreur inconnue',
    description: 'Une erreur inconnue s\'est produite. Consultez les logs pour plus d\'informations.',
  },
  'general_server_error': {
    code: 500,
    type: 'general_server_error',
    message: 'Erreur serveur interne',
    description: 'Une erreur interne du serveur s\'est produite.',
  },
  'general_service_disabled': {
    code: 503,
    type: 'general_service_disabled',
    message: 'Service désactivé',
    description: 'Le service demandé est désactivé. Vous pouvez activer le service depuis la console Appwrite.',
  },

  // Authentication errors
  'user_password_mismatch': {
    code: 400,
    type: 'user_password_mismatch',
    message: 'Mots de passe incompatibles',
    description: 'Les mots de passe ne correspondent pas. Vérifiez le mot de passe et la confirmation.',
  },
  'user_invalid_credentials': {
    code: 401,
    type: 'user_invalid_credentials',
    message: 'Identifiants invalides',
    description: 'Identifiants invalides. Vérifiez l\'email et le mot de passe.',
  },
  'user_blocked': {
    code: 401,
    type: 'user_blocked',
    message: 'Utilisateur bloqué',
    description: 'L\'utilisateur actuel a été bloqué. Vous pouvez débloquer l\'utilisateur depuis la console Appwrite.',
  },
  'user_invalid_token': {
    code: 401,
    type: 'user_invalid_token',
    message: 'Token invalide',
    description: 'Le token fourni dans la requête est invalide.',
  },
  'user_not_found': {
    code: 404,
    type: 'user_not_found',
    message: 'Utilisateur introuvable',
    description: 'L\'utilisateur avec l\'ID demandé n\'a pas pu être trouvé.',
  },
  'user_session_not_found': {
    code: 404,
    type: 'user_session_not_found',
    message: 'Session introuvable',
    description: 'La session utilisateur actuelle n\'a pas pu être trouvée.',
  },
  'user_already_exists': {
    code: 409,
    type: 'user_already_exists',
    message: 'Utilisateur existant',
    description: 'Un utilisateur avec le même ID, email ou téléphone existe déjà dans ce projet.',
  },

  // Database errors
  'database_not_found': {
    code: 404,
    type: 'database_not_found',
    message: 'Base de données introuvable',
    description: 'La base de données demandée n\'a pas été trouvée.',
  },
  'table_not_found': {
    code: 404,
    type: 'table_not_found',
    message: 'Table introuvable',
    description: 'La table avec l\'ID demandé n\'a pas pu être trouvée.',
  },
  'row_not_found': {
    code: 404,
    type: 'row_not_found',
    message: 'Ligne introuvable',
    description: 'La ligne avec l\'ID demandé n\'a pas pu être trouvée.',
  },
  'column_not_found': {
    code: 404,
    type: 'column_not_found',
    message: 'Colonne introuvable',
    description: 'La colonne avec l\'ID demandé n\'a pas pu être trouvée.',
  },

  // Storage errors
  'storage_file_not_found': {
    code: 404,
    type: 'storage_file_not_found',
    message: 'Fichier introuvable',
    description: 'Le fichier demandé n\'a pas pu être trouvé.',
  },
  'storage_file_empty': {
    code: 400,
    type: 'storage_file_empty',
    message: 'Fichier vide',
    description: 'Un fichier vide a été transmis à l\'endpoint.',
  },
  'storage_file_type_unsupported': {
    code: 400,
    type: 'storage_file_type_unsupported',
    message: 'Type de fichier non supporté',
    description: 'L\'extension de fichier donnée n\'est pas supportée.',
  },
  'storage_invalid_file_size': {
    code: 400,
    type: 'storage_invalid_file_size',
    message: 'Taille de fichier invalide',
    description: 'La taille du fichier n\'est pas valide ou dépasse la taille maximale autorisée.',
  },
  'storage_file_already_exists': {
    code: 409,
    type: 'storage_file_already_exists',
    message: 'Fichier existant',
    description: 'Un fichier de stockage avec l\'ID demandé existe déjà.',
  },
};

/**
 * Traductions des erreurs Composio (codes HTTP basiques)
 */
const COMPOSIO_ERRORS: Record<number, ErrorTranslation> = {
  400: {
    code: 400,
    message: 'Requête invalide',
    description: 'La requête est mal formée ou contient des paramètres invalides.',
  },
  401: {
    code: 401,
    message: 'Non autorisé',
    description: 'L\'authentification a échoué ou les informations d\'identification sont manquantes.',
  },
  403: {
    code: 403,
    message: 'Accès interdit',
    description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
  },
  404: {
    code: 404,
    message: 'Ressource introuvable',
    description: 'La ressource demandée n\'existe pas.',
  },
  429: {
    code: 429,
    message: 'Trop de requêtes',
    description: 'Vous avez dépassé la limite de taux. Veuillez ralentir vos requêtes.',
  },
  500: {
    code: 500,
    message: 'Erreur serveur interne',
    description: 'Une erreur s\'est produite côté serveur. Réessayez plus tard.',
  },
  502: {
    code: 502,
    message: 'Passerelle incorrecte',
    description: 'Le serveur a reçu une réponse invalide. Réessayez dans quelques instants.',
  },
  503: {
    code: 503,
    message: 'Service indisponible',
    description: 'Le service est temporairement indisponible. Veuillez réessayer plus tard.',
  },
};

/**
 * Détecter le provider API à partir du message d'erreur ou du contexte
 */
function detectProvider(errorMessage: string, url?: string): ApiProvider {
  const message = errorMessage.toLowerCase();
  const urlLower = url?.toLowerCase() || '';

  if (message.includes('groq') || urlLower.includes('groq')) {
    return 'groq';
  }
  if (message.includes('appwrite') || urlLower.includes('appwrite')) {
    return 'appwrite';
  }
  if (message.includes('composio') || urlLower.includes('composio')) {
    return 'composio';
  }

  return 'unknown';
}

/**
 * Traduire une erreur en français
 *
 * @param statusCode - Code HTTP de l'erreur
 * @param errorType - Type d'erreur spécifique (pour Appwrite)
 * @param originalMessage - Message d'erreur original
 * @param provider - Provider API (groq, appwrite, composio) ou détecté automatiquement
 * @param url - URL de la requête (optionnel, aide à détecter le provider)
 * @returns Message d'erreur traduit en français
 */
export function translateError(
  statusCode: number,
  errorType?: string,
  originalMessage?: string,
  provider?: ApiProvider,
  url?: string
): string {
  // Détecter le provider si non fourni
  const detectedProvider = provider || detectProvider(originalMessage || '', url);

  let translation: ErrorTranslation | undefined;

  // Chercher la traduction selon le provider
  switch (detectedProvider) {
    case 'groq':
      translation = GROQ_ERRORS[statusCode];
      break;

    case 'appwrite':
      // Chercher d'abord par type d'erreur si disponible
      if (errorType && APPWRITE_ERRORS[errorType]) {
        translation = APPWRITE_ERRORS[errorType];
      } else {
        // Sinon chercher dans les erreurs génériques par code
        translation = Object.values(APPWRITE_ERRORS).find(
          (err) => err.code === statusCode
        );
      }
      break;

    case 'composio':
      translation = COMPOSIO_ERRORS[statusCode];
      break;

    default:
      // Fallback sur Groq qui a les codes HTTP les plus complets
      translation = GROQ_ERRORS[statusCode];
      break;
  }

  // Si traduction trouvée, retourner le message complet
  if (translation) {
    return translation.description
      ? `${translation.message}: ${translation.description}`
      : translation.message;
  }

  // Fallback : retourner le message original ou un message générique
  return originalMessage || `Erreur ${statusCode}: Une erreur s'est produite.`;
}

/**
 * Obtenir une traduction d'erreur structurée
 */
export function getErrorTranslation(
  statusCode: number,
  errorType?: string,
  provider?: ApiProvider,
  url?: string
): ErrorTranslation | null {
  const detectedProvider = provider || detectProvider('', url);

  switch (detectedProvider) {
    case 'groq':
      return GROQ_ERRORS[statusCode] || null;

    case 'appwrite':
      if (errorType && APPWRITE_ERRORS[errorType]) {
        return APPWRITE_ERRORS[errorType];
      }
      return Object.values(APPWRITE_ERRORS).find(
        (err) => err.code === statusCode
      ) || null;

    case 'composio':
      return COMPOSIO_ERRORS[statusCode] || null;

    default:
      return GROQ_ERRORS[statusCode] || null;
  }
}

/**
 * Exemple d'utilisation avec fetch
 *
 * ```typescript
 * try {
 *   const response = await fetch('https://api.groq.com/...');
 *   if (!response.ok) {
 *     const errorData = await response.json();
 *     const translatedError = translateError(
 *       response.status,
 *       errorData.type,
 *       errorData.message,
 *       'groq'
 *     );
 *     throw new Error(translatedError);
 *   }
 * } catch (error) {
 *   console.error(error.message); // Message en français
 * }
 * ```
 */
