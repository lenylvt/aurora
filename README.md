# Aurora - Assistant IA Ultra-Rapide ⚡

Aurora est un assistant IA moderne, rapide et sans friction, conçu pour les jeunes. L'application prioritise la **vitesse** et la **simplicité** avec une interface instantanée et fluide.

## 🚀 Fonctionnalités

### ✅ Implémenté

- **Authentication** - Connexion/Inscription avec email/mot de passe via Appwrite
- **Chat en temps réel** - Streaming des réponses IA avec Groq
- **Fallback intelligent** - 3 modèles Groq en cascade pour maximum de fiabilité
- **UI optimiste** - Affichage instantané des messages sans latence
- **Design moderne** - Interface rapide avec Shadcn UI et Tailwind CSS
- **Responsive** - Mobile-first, fonctionne parfaitement sur tous les écrans

### 🚧 À implémenter

- **Multi-chat** - Sidebar avec historique des conversations
- **Upload de fichiers** - Support images, PDF, documents
- **Snapchat Login** - OAuth avec Snapchat Login Kit
- **Génération d'images** - Via Composio + Gemini
- **MCP Tools** - Intégration Composio pour tools additionnels
- **Realtime sync** - Synchronisation en temps réel avec Appwrite Realtime

## 📦 Stack Technique

- **Framework**: Next.js 16 (App Router)
- **UI**: Shadcn UI + Tailwind CSS 4
- **IA**: Groq API (3 modèles en fallback)
- **Backend**: Appwrite (Auth + Database + Realtime)
- **Tools**: Composio (MCP integration)
- **TypeScript**: Type-safe partout
- **Deployment**: Optimisé pour Vercel

## 🛠️ Setup

### 1. Prérequis

- Node.js 18+
- npm ou pnpm
- Compte Appwrite
- Clé API Groq

### 2. Installation

```bash
# Cloner le projet
cd friendai

# Installer les dépendances
npm install

# Copier l'exemple d'environnement
cp .env.example .env
```

### 3. Configuration Appwrite

1. Créer un projet sur [cloud.appwrite.io](https://cloud.appwrite.io)
2. Créer une base de données
3. Créer 3 collections:

**Collection `users`** (optionnelle, pour profils étendus)
- Aucun attribut nécessaire pour le moment

**Collection `chats`**
- `userId` (string, required)
- `title` (string, required)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

**Collection `messages`**
- `chatId` (string, required)
- `role` (enum: user, assistant, required)
- `content` (string, required)
- `files` (string, optional) - JSON stringifié
- `createdAt` (datetime, required)

4. Configurer les permissions:
   - Lire: Role:user
   - Créer: Role:user
   - Update: Owner
   - Delete: Owner

### 4. Variables d'environnement

Éditer `.env`:

```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=<votre_project_id>
APPWRITE_API_KEY=<optionnel_pour_server_actions>

# Collections Appwrite
NEXT_PUBLIC_DATABASE_ID=<votre_database_id>
NEXT_PUBLIC_USERS_COLLECTION_ID=users
NEXT_PUBLIC_CHATS_COLLECTION_ID=chats
NEXT_PUBLIC_MESSAGES_COLLECTION_ID=messages

# Groq API
GROQ_API_KEY=<votre_groq_api_key>

# Snapchat OAuth (optionnel)
SNAPCHAT_CLIENT_ID=<votre_client_id>
SNAPCHAT_CLIENT_SECRET=<votre_client_secret>

# Composio (optionnel)
COMPOSIO_API_KEY=<votre_composio_key>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Obtenir les clés API

**Groq**:
1. Aller sur [console.groq.com](https://console.groq.com)
2. Créer une clé API
3. Copier dans `GROQ_API_KEY`

**Appwrite**:
1. Projet créé → Settings → View API Keys
2. Copier Project ID dans `NEXT_PUBLIC_APPWRITE_PROJECT`

**Composio** (optionnel):
1. Aller sur [composio.dev](https://composio.dev)
2. Créer un compte et générer une clé API

### 6. Lancer l'app

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
/app
  /(auth)           # Pages authentification
    /login
    /signup
  /(dashboard)      # Pages protégées
    /chat
  /api
    /chat          # API route pour streaming
  layout.tsx
  page.tsx
  globals.css

/components
  /ui              # Composants Shadcn UI
  /chat            # Composants chat
  /auth            # Composants auth

/lib
  /appwrite        # Client et utilities Appwrite
  /groq            # Client Groq avec fallback
  /composio        # Integration Composio (à venir)
  utils.ts         # Helpers

/hooks
  useChat.ts       # Hook pour gestion du chat

/types
  index.ts         # Types TypeScript
```

## 🎯 Modèles Groq (Fallback Chain)

Aurora utilise 3 modèles en cascade pour garantir une disponibilité maximale:

1. **openai/gpt-oss-120b** - Modèle principal (le plus puissant)
2. **qwen/qwen3-32b** - Fallback 1
3. **openai/gpt-oss-20b** - Fallback 2

Si un modèle échoue, Aurora essaie automatiquement le suivant.

## ⚡ Performance

- **Streaming** des réponses IA (pas d'attente)
- **Optimistic UI** pour affichage instantané
- **Server Components** pour data fetching rapide
- **Code splitting** automatique avec Next.js
- **Edge Runtime** pour API routes ultra-rapides
- **Suspense boundaries** partout

## 🔒 Sécurité

- Variables d'environnement pour secrets
- Validation inputs côté serveur
- Session management sécurisé (Appwrite)
- Rate limiting (à implémenter)
- Sanitization des messages

## 📝 Prochaines Étapes

### Court terme
- [ ] Persistance des messages dans Appwrite
- [ ] Sidebar multi-chat avec historique
- [ ] Upload et preview de fichiers
- [ ] Toast notifications pour erreurs
- [ ] Dark mode toggle

### Moyen terme
- [ ] Snapchat OAuth integration
- [ ] Génération d'images (Composio)
- [ ] Support PDF parsing
- [ ] Recherche dans l'historique
- [ ] Paramètres utilisateur

### Long terme
- [ ] Voice input
- [ ] Conversations partagées
- [ ] Export de conversations
- [ ] Analytics et usage stats
- [ ] Mobile app (React Native)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 License

MIT

## 🙏 Remerciements

- [Next.js](https://nextjs.org)
- [Shadcn UI](https://ui.shadcn.com)
- [Groq](https://groq.com)
- [Appwrite](https://appwrite.io)
- [Composio](https://composio.dev)

---

**Aurora** - Propulsé par Claude Code 🚀
