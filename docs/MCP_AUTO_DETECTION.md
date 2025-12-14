# Détection automatique des MCP

Le système MCP utilise maintenant une **détection automatique** des outils disponibles. Plus besoin de spécifier manuellement les toolkits à activer !

## Comment ça fonctionne

### 1. Auto-détection au niveau de l'API

L'API `/api/chat` (et `/api/chat-with-tools`) détecte automatiquement :

- ✅ Tous les MCP **connectés** par l'utilisateur
- ✅ Tous les MCP **sans authentification** (comme Gemini)

```typescript
// Ancien système (manuel)
const response = await fetch("/api/chat-with-tools", {
  method: "POST",
  body: JSON.stringify({
    messages: [...],
    enabledToolkits: ["github", "slack"] // ❌ Manual
  })
});

// Nouveau système (automatique)
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [...] // ✅ Auto-détection !
  })
});
```

### 2. Système de priorité

Le système utilise cet ordre de priorité :

1. **Toolkits spécifiés manuellement** (si fournis)
2. **Auto-détection** via `getAvailableToolkits(userId)`
   - Récupère tous les comptes connectés
   - Ajoute les MCP sans auth (`requiresAuth: false`)

## Configuration JSON

Les serveurs MCP sont définis dans `mcp-servers.json`:

```json
{
  "servers": [
    {
      "id": "gemini",
      "name": "Gemini",
      "description": "Create images and videos",
      "toolkit": "gemini",
      "requiresAuth": false,  // ✅ Disponible sans connexion
      "authType": "basic",
      "icon": "Sparkles",
      "allowedTools": []
    },
    {
      "id": "github-server",
      "name": "GitHub Integration",
      "toolkit": "github",
      "requiresAuth": true,  // ❌ Nécessite OAuth
      "authType": "oauth2",
      "allowedTools": [...]
    }
  ]
}
```

## Utilisation dans le chat

### Avec le hook useChat

Le hook `useChat` utilise maintenant automatiquement tous les outils disponibles :

```typescript
import { useChat } from "@/hooks/useChat";

function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat(chatId);

  // Les outils sont automatiquement chargés !
  // Pas besoin de gérer les toolkits manuellement
}
```

### Avec useChatWithTools (déprécié)

Le hook `useChatWithTools` existe toujours mais n'est plus nécessaire :

```typescript
// ❌ Ancienne méthode (toujours fonctionnelle)
const { messages, toolCalls } = useChatWithTools(
  chatId,
  ["github", "slack"] // Manual
);

// ✅ Nouvelle méthode (recommandée)
const { messages } = useChat(chatId); // Auto !
```

## Afficher les outils disponibles

### Composant MCPSuggestion

Affiche une alerte avec les outils connectés et suggère de connecter les autres :

```typescript
import { MCPSuggestion } from "@/components/chat/mcp-suggestion";

function ChatPage() {
  return (
    <div>
      <MCPSuggestion />
      {/* Votre chat ici */}
    </div>
  );
}
```

Le composant affiche :
- ✅ Liste des outils **connectés**
- 📋 Liste des outils **disponibles** (non connectés)
- 🔗 Bouton pour gérer les connexions

### Composant MCPToolkitsList

Liste compacte des outils actifs dans la sidebar :

```typescript
import { MCPToolkitsList } from "@/components/chat/mcp-suggestion";

function ChatSidebar() {
  return (
    <aside>
      <MCPToolkitsList />
    </aside>
  );
}
```

## API Endpoints

### GET `/api/composio/toolkits`

Récupère tous les toolkits configurés avec leur statut de connexion :

```json
{
  "toolkits": [
    {
      "id": "gemini",
      "name": "Gemini",
      "toolkit": "gemini",
      "requiresAuth": false,
      "isConnected": true,  // Toujours true si requiresAuth = false
      "allowedTools": []
    },
    {
      "id": "github-server",
      "name": "GitHub",
      "toolkit": "github",
      "requiresAuth": true,
      "isConnected": false,  // Dépend de la connexion OAuth
      "connectionId": null
    }
  ],
  "connectedToolkitSlugs": ["gemini"],
  "totalConfigured": 2,
  "totalConnected": 1
}
```

## Prompt système enrichi

Le système ajoute automatiquement une description des outils disponibles dans le prompt système :

```
Vous êtes un assistant IA serviable.

Vous avez accès aux outils suivants pour aider l'utilisateur :

- GEMINI_CREATE_IMAGE: Generate an image using Gemini
- GEMINI_CREATE_VIDEO: Generate a video using Gemini
- GITHUB_CREATE_ISSUE: Create a new issue in a repository

Utilisez ces outils quand c'est pertinent pour répondre aux demandes de l'utilisateur.
```

## Exemple complet

```typescript
// app/(dashboard)/chat/page.tsx
"use client";

import { useChat } from "@/hooks/useChat";
import { MCPSuggestion } from "@/components/chat/mcp-suggestion";
import { ToolCallsDisplay } from "@/components/chat/tool-calls-display";

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat(null);

  return (
    <div className="container max-w-4xl p-4">
      {/* Suggestion de connexion MCP */}
      <MCPSuggestion />

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <MessageComponent key={msg.$id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
```

## Avantages

✅ **Automatique** : Plus besoin de gérer manuellement les toolkits
✅ **Intelligent** : Détecte les connexions OAuth et les outils sans auth
✅ **Transparent** : L'utilisateur voit quels outils sont disponibles
✅ **Flexible** : Possibilité de spécifier manuellement si nécessaire
✅ **Évolutif** : Ajoutez des serveurs via JSON, ils sont auto-détectés

## Ajout d'un nouvel outil sans auth

Pour ajouter un outil comme Gemini qui ne nécessite pas d'authentification :

1. **Ajoutez-le dans `mcp-servers.json`** :

```json
{
  "id": "gemini",
  "name": "Gemini",
  "description": "Create images and videos with AI",
  "toolkit": "gemini",
  "requiresAuth": false,  // ⚠️ Important !
  "authType": "basic",
  "allowedTools": []
}
```

2. **C'est tout !** 🎉

L'outil sera automatiquement :
- Détecté par `getAvailableToolkits()`
- Chargé dans l'API chat
- Listé dans les composants MCP
- Utilisable par Groq

## Débug

Pour voir quels outils sont chargés, vérifiez la réponse de l'API :

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ messages })
});

const data = await response.json();
console.log("Available toolkits:", data.availableToolkits);
// ["gemini", "github", "slack"]
```
