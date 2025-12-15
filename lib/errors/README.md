# Système de Traduction des Erreurs API

Ce module fournit des traductions françaises pour les codes d'erreur des APIs suivantes :
- **Groq** - Codes 200-503
- **Appwrite** - Codes d'erreur spécifiques (platform, auth, database, storage)
- **Composio** - Codes HTTP 400-503

## Installation

Le système est déjà intégré dans `hooks/useChat.ts` pour la gestion des erreurs de chat.

## Utilisation

### Import

```typescript
import { translateError, getErrorTranslation } from '@/lib/errors';
```

### Exemple 1 : Traduction simple d'une erreur HTTP

```typescript
try {
  const response = await fetch('https://api.groq.com/...');
  if (!response.ok) {
    const errorMessage = translateError(response.status);
    throw new Error(errorMessage);
  }
} catch (error) {
  console.error(error.message); // "Requête invalide: Le serveur n'a pas pu..."
}
```

### Exemple 2 : Avec détection automatique du provider

```typescript
try {
  const response = await fetch('https://api.groq.com/v1/chat/completions');
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    // La fonction détecte automatiquement "groq" depuis l'URL
    const translatedError = translateError(
      response.status,
      errorData?.type,
      errorData?.message,
      undefined,
      response.url
    );

    throw new Error(translatedError);
  }
} catch (error) {
  toast.error(error.message); // Message en français
}
```

### Exemple 3 : Avec Appwrite (erreurs typées)

```typescript
try {
  const response = await fetch('https://cloud.appwrite.io/v1/databases/...');
  if (!response.ok) {
    const errorData = await response.json();

    // Appwrite retourne un "type" d'erreur spécifique
    const translatedError = translateError(
      response.status,
      errorData.type,           // Ex: "database_not_found"
      errorData.message,
      'appwrite'
    );

    throw new Error(translatedError);
  }
} catch (error) {
  console.error(error.message); // "Base de données introuvable: La base de données..."
}
```

### Exemple 4 : Récupérer l'objet de traduction complet

```typescript
const errorInfo = getErrorTranslation(404, undefined, 'groq');

if (errorInfo) {
  console.log(errorInfo.code);        // 404
  console.log(errorInfo.message);     // "Ressource introuvable"
  console.log(errorInfo.description); // "La ressource demandée n'a pas pu être trouvée..."
}
```

## API

### `translateError()`

Traduit une erreur en français avec description complète.

**Paramètres :**
- `statusCode` (number) - Code HTTP de l'erreur (ex: 404, 500)
- `errorType?` (string) - Type d'erreur spécifique (pour Appwrite)
- `originalMessage?` (string) - Message d'erreur original
- `provider?` (ApiProvider) - Provider API : 'groq' | 'appwrite' | 'composio' | 'unknown'
- `url?` (string) - URL de la requête (aide à détecter le provider)

**Retourne :** `string` - Message d'erreur traduit en français

### `getErrorTranslation()`

Récupère l'objet de traduction structuré.

**Paramètres :**
- `statusCode` (number) - Code HTTP de l'erreur
- `errorType?` (string) - Type d'erreur spécifique (pour Appwrite)
- `provider?` (ApiProvider) - Provider API
- `url?` (string) - URL de la requête

**Retourne :** `ErrorTranslation | null` - Objet contenant code, message et description

## Codes d'erreur supportés

### Groq
- **200** - Requête réussie
- **400** - Requête invalide
- **401** - Non autorisé
- **403** - Accès interdit
- **404** - Ressource introuvable
- **413** - Requête trop volumineuse
- **422** - Entité non traitable
- **424** - Dépendance échouée
- **429** - Trop de requêtes
- **498** - Capacité Flex Tier dépassée
- **499** - Requête annulée
- **500** - Erreur interne du serveur
- **502** - Passerelle incorrecte
- **503** - Service indisponible
- **206** - Contenu partiel

### Appwrite
Plus de 40 codes d'erreur spécifiques couvrant :
- Erreurs de plateforme (`general_*`, `project_*`)
- Erreurs d'authentification (`user_*`, `team_*`)
- Erreurs de base de données (`database_*`, `table_*`, `row_*`)
- Erreurs de stockage (`storage_*`)

Exemples :
- `user_invalid_credentials` - Identifiants invalides
- `database_not_found` - Base de données introuvable
- `storage_file_type_unsupported` - Type de fichier non supporté

### Composio
Codes HTTP basiques :
- **400** - Requête invalide
- **401** - Non autorisé
- **403** - Accès interdit
- **404** - Ressource introuvable
- **429** - Trop de requêtes
- **500** - Erreur serveur interne
- **502** - Passerelle incorrecte
- **503** - Service indisponible

## Détection automatique du provider

Le système peut détecter automatiquement le provider API à partir de :
1. L'URL de la requête (recommandé)
2. Le message d'erreur

Exemples de détection :
```typescript
// Depuis l'URL
translateError(404, undefined, undefined, undefined, 'https://api.groq.com/...')
// → Détecte "groq"

translateError(404, undefined, undefined, undefined, 'https://cloud.appwrite.io/...')
// → Détecte "appwrite"

// Depuis le message
translateError(404, undefined, 'Groq API error: not found')
// → Détecte "groq"
```

## Intégration dans l'application

Le système est déjà intégré dans `hooks/useChat.ts` ligne 161-167 :

```typescript
const translatedError = translateError(
  response.status,
  errorData?.type,
  errorMessage,
  undefined,
  response.url
);

throw new Error(translatedError);
```

Toutes les erreurs de l'API de chat sont automatiquement traduites en français.

## Ajouter de nouvelles traductions

Pour ajouter de nouvelles traductions, éditez `/lib/errors/translations.ts` :

```typescript
// Ajouter dans GROQ_ERRORS, APPWRITE_ERRORS ou COMPOSIO_ERRORS
const GROQ_ERRORS: Record<number, ErrorTranslation> = {
  // Vos nouvelles traductions ici
  418: {
    code: 418,
    message: 'Je suis une théière',
    description: 'Le serveur refuse de préparer du café car c\'est une théière.',
  },
};
```
