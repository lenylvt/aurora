# MCP Integration avec Composio

Ce guide explique comment utiliser le système MCP (Multi-Connection Protocol) intégré avec Composio pour ajouter des outils externes à votre assistant AI.

## Vue d'ensemble

Le système MCP permet à votre assistant d'interagir avec des services externes comme GitHub, Slack, Gmail, Notion, etc. via l'API Composio. Chaque service est configuré comme un "serveur MCP" qui gère l'authentification OAuth et expose des outils spécifiques.

## Architecture

```
┌─────────────────┐
│  mcp-servers.json│  Configuration des serveurs disponibles
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Composio Client │  Gestion de l'auth et des outils
└────────┬────────┘
         │
         ├─────► OAuth Flow (via Composio)
         │
         └─────► Tool Execution (via API Composio)
                        │
                        ▼
                ┌───────────────┐
                │  Groq API     │  Chat avec tool calls
                └───────────────┘
```

## Configuration

### 1. Variables d'environnement

Ajoutez votre clé API Composio dans `.env`:

```bash
COMPOSIO_API_KEY=your_composio_api_key
```

### 2. Configuration des serveurs MCP

Les serveurs disponibles sont définis dans `mcp-servers.json`. Structure :

```json
{
  "servers": [
    {
      "id": "github-server",
      "name": "GitHub Integration",
      "description": "Access GitHub repositories, issues, and pull requests",
      "toolkit": "github",
      "requiresAuth": true,
      "authType": "oauth2",
      "icon": "Github",
      "allowedTools": [
        "GITHUB_CREATE_ISSUE",
        "GITHUB_LIST_ISSUES",
        "GITHUB_GET_ISSUE"
      ]
    }
  ]
}
```

#### Propriétés :

- `id` : Identifiant unique du serveur
- `name` : Nom affiché dans l'UI
- `description` : Description des capacités
- `toolkit` : Slug du toolkit Composio (ex: "github", "slack", "gmail")
- `requiresAuth` : Si l'authentification est requise
- `authType` : Type d'auth ("oauth2", "api_key", "basic")
- `icon` : Nom de l'icône Lucide (optionnel)
- `allowedTools` : Liste des outils autorisés (optionnel, tous par défaut)

### 3. Ajouter un nouveau serveur

Pour ajouter un nouveau service :

1. **Vérifiez la disponibilité** sur [Composio Apps](https://docs.composio.dev/apps)

2. **Ajoutez la configuration** dans `mcp-servers.json` :

```json
{
  "id": "linear-server",
  "name": "Linear Integration",
  "description": "Manage Linear issues and projects",
  "toolkit": "linear",
  "requiresAuth": true,
  "authType": "oauth2",
  "icon": "CircleDot",
  "allowedTools": [
    "LINEAR_CREATE_ISSUE",
    "LINEAR_UPDATE_ISSUE",
    "LINEAR_LIST_ISSUES"
  ]
}
```

3. **Redémarrez l'application** pour voir le nouveau serveur dans l'UI

## Utilisation

### Connecter un service (si nécessaire)

⚠️ **Note** : Certains services comme Gemini ne nécessitent **pas** de connexion (`requiresAuth: false`)

1. Allez sur `/connections`
2. Cliquez sur "Connect" pour le service désiré
3. Complétez le flux OAuth dans la popup
4. Le service apparaît comme "Connected"

### Utiliser les outils dans le chat

✨ **Nouveau** : Les outils sont maintenant **détectés automatiquement** !

#### Méthode recommandée : Auto-détection

```typescript
import { useChat } from "@/hooks/useChat";
import { MCPSuggestion } from "@/components/chat/mcp-suggestion";

function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat(chatId);

  return (
    <div>
      {/* Affiche les outils disponibles */}
      <MCPSuggestion />

      {/* Vos messages */}
      {messages.map((msg) => (
        <MessageComponent key={msg.$id} message={msg} />
      ))}
    </div>
  );
}
```

Le système charge automatiquement :
- ✅ Tous les MCP **connectés** (OAuth)
- ✅ Tous les MCP **sans auth** (comme Gemini)

#### Méthode manuelle (optionnelle)

Si vous voulez contrôler précisément les toolkits :

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: conversationHistory,
    enabledToolkits: ["github", "gemini"] // Optionnel
  })
});
```

### Afficher les outils disponibles

#### Composant MCPSuggestion

Affiche une carte avec les outils connectés et suggère les connexions :

```typescript
import { MCPSuggestion } from "@/components/chat/mcp-suggestion";

<MCPSuggestion onDismiss={() => {}} />
```

#### Composant MCPToolkitsList

Liste compacte pour la sidebar :

```typescript
import { MCPToolkitsList } from "@/components/chat/mcp-suggestion";

<MCPToolkitsList />
```

## API Routes

### POST `/api/composio/auth`

Initie le flux OAuth pour un toolkit.

**Request:**
```json
{
  "toolkit": "github"
}
```

**Response:**
```json
{
  "authUrl": "https://composio.dev/oauth/..."
}
```

### GET `/api/composio/callback`

Callback OAuth - redirige automatiquement vers `/connections`.

### GET `/api/composio/connections`

Liste les connexions de l'utilisateur.

**Response:**
```json
{
  "connections": [
    {
      "id": "conn_xyz",
      "appUniqueId": "github",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### DELETE `/api/composio/connections`

Déconnecte un service.

**Request:**
```json
{
  "connectionId": "conn_xyz"
}
```

### POST `/api/chat-with-tools`

Endpoint de chat avec support des tools.

**Request:**
```json
{
  "messages": [...],
  "enabledToolkits": ["github", "slack"]
}
```

**Response:**
```json
{
  "content": "I've created the issue!",
  "model": "openai/gpt-oss-120b",
  "toolCalls": [...],
  "toolResults": [...]
}
```

## Exemples d'utilisation

### Créer une issue GitHub

```
User: Crée une issue sur mon repo avec le titre "Bug fix" et la description "Fix login error"
AI: [Appelle GITHUB_CREATE_ISSUE]
AI: J'ai créé l'issue #42 sur votre repo !
```

### Envoyer un message Slack

```
User: Envoie un message dans #general pour dire que le deploy est terminé
AI: [Appelle SLACK_SEND_MESSAGE]
AI: Message envoyé dans #general !
```

### Chercher dans Gmail

```
User: Trouve mes emails non lus de cette semaine
AI: [Appelle GMAIL_LIST_EMAILS]
AI: Voici vos 5 emails non lus...
```

## Développement

### Structure des fichiers

```
friendai/
├── mcp-servers.json              # Configuration des serveurs
├── types/mcp-server.ts           # Types TypeScript
├── lib/composio/
│   └── client.ts                 # Client Composio serveur
├── app/api/composio/
│   ├── auth/route.ts            # Initiation OAuth
│   ├── callback/route.ts        # Callback OAuth
│   └── connections/route.ts     # Gestion connexions
├── app/api/chat-with-tools/
│   └── route.ts                 # Chat avec tools
├── app/(dashboard)/connections/
│   └── page.tsx                 # UI de gestion
├── hooks/
│   └── useChatWithTools.ts      # Hook React pour tools
└── components/chat/
    └── tool-calls-display.tsx   # Affichage des tool calls
```

### Ajouter un outil custom

Vous pouvez créer des outils personnalisés avec Composio :

```typescript
import { composio } from "@/lib/composio/client";
import { z } from "zod";

const customTool = await composio.tools.createCustomTool({
  slug: "MY_CUSTOM_TOOL",
  name: "My Custom Tool",
  description: "Does something custom",
  inputParams: z.object({
    param1: z.string().describe("First parameter"),
  }),
  execute: async (input) => {
    // Votre logique ici
    return {
      data: { result: "success" },
      error: null,
      successful: true,
    };
  },
});
```

## Dépannage

### L'OAuth ne fonctionne pas

1. Vérifiez que `COMPOSIO_API_KEY` est définie
2. Vérifiez que `NEXT_PUBLIC_APP_URL` pointe vers votre domaine
3. Consultez les logs Composio : https://app.composio.dev

### Les outils ne s'affichent pas

1. Vérifiez que l'utilisateur est connecté au service
2. Vérifiez les `allowedTools` dans `mcp-servers.json`
3. Consultez la console pour les erreurs

### Erreur "Tool execution failed"

1. Vérifiez que la connexion est toujours active
2. Vérifiez les permissions OAuth du service
3. Vérifiez les logs de l'API route `/api/chat-with-tools`

## Limites

- **Edge Runtime** : L'API `/api/chat` streaming ne supporte pas les tools (edge runtime)
- **Timeout** : L'API `/api/chat-with-tools` a un timeout de 60 secondes
- **Rate Limits** : Respectez les rate limits de Composio et des services tiers

## Ressources

- [Documentation Composio](https://docs.composio.dev)
- [Apps disponibles](https://docs.composio.dev/apps)
- [API Reference](https://docs.composio.dev/rest-api)
- [Groq + Composio](https://console.groq.com/docs/composio)