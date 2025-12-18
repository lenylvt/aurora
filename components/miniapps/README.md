# 📦 Guide de création de Mini Apps

Ce guide explique comment créer une nouvelle Mini App pour Aurora.

## 🏗️ Architecture

```
components/miniapps/
├── index.ts                    # Export central
├── miniapps-provider.tsx       # Context provider (état global)
├── welcome-popup.tsx           # Popup de bienvenue
└── [mini-app-name]/            # Dossier de la mini app
    ├── index.tsx               # Point d'entrée principal
    └── [composants].tsx        # Composants spécifiques

lib/appwrite/miniapps/
├── config.ts                   # Configuration DB (2 databases)
├── settings.ts                 # CRUD settings (aurora-db)
├── [resource].ts               # CRUD client-side (miniapp-xxx-db)
└── [resource]-server.ts        # CRUD server-side (API routes)

types/miniapps.ts               # Types et registry
```

---

## 🗄️ Structure des bases de données

### Nouvelle architecture (2 DBs)

| Database | Description | Collections |
|----------|-------------|-------------|
| **aurora-db** | DB principale | chats, messages, **mini_apps_settings** |
| **miniapp-xxx-db** | DB par mini app | Collections spécifiques à l'app |

### Configuration

**Fichier:** `.env`

```env
# Aurora DB (principale)
NEXT_PUBLIC_DATABASE_ID=xxx
NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID=xxx

# Mini App Français (Analyse Linéaire)
NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID=xxx
NEXT_PUBLIC_POEMS_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID=xxx
```

**Fichier:** `lib/appwrite/miniapps/config.ts`

```typescript
// Settings dans aurora-db
export const auroraConfig = {
    databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
    collections: {
        settings: process.env.NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID!,
    },
};

// Mini App Français dans sa propre DB
export const miniappFrancaisConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID!,
    collections: {
        poems: process.env.NEXT_PUBLIC_POEMS_COLLECTION_ID!,
        analyses: process.env.NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID!,
        results: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID!,
    },
};

// Legacy (backward compatibility)
export const miniappsConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID!,
    settingsDatabaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
    collections: { ... },
};
```

---

## 📝 Étapes de création

### 1. Définir la Mini App dans le registry

**Fichier:** `types/miniapps.ts`

```typescript
export type MiniAppId = "analyse-france" | "ma-nouvelle-app";

export const MINI_APPS: Record<MiniAppId, MiniApp> = {
    "ma-nouvelle-app": {
        id: "ma-nouvelle-app",
        name: "Ma Nouvelle App",
        description: "Description courte",
        icon: "IconName",
        color: "text-blue-500",
    },
};
```

### 2. Créer le composant principal

**Fichier:** `components/miniapps/ma-nouvelle-app/index.tsx`

```tsx
"use client";

import { useState } from "react";
import { useMiniApps } from "../miniapps-provider";
import { useSidebar } from "@/components/ui/sidebar";

export default function MaNouvelleApp() {
    const { closeMiniApp, currentView } = useMiniApps();
    const { setOpen } = useSidebar();
    
    if (currentView === "progress") return <ProgressView />;
    
    return (
        <div className="flex h-full flex-col bg-background">
            {/* Contenu */}
        </div>
    );
}
```

### 3. Exporter et intégrer

**Fichier:** `components/miniapps/index.ts`
```typescript
export { default as MaNouvelleApp } from "./ma-nouvelle-app";
```

**Fichier:** `app/(dashboard)/home/page.tsx`
```tsx
{activeMiniApp === "ma-nouvelle-app" && <MaNouvelleApp />}
```

---

## 🗃️ Fonctions CRUD

### Client-side (settings - aurora-db)

```typescript
import { databases } from "../client";
import { miniappsConfig } from "./config";

// IMPORTANT: Utiliser settingsDatabaseId pour les settings!
const doc = await databases.createDocument(
    miniappsConfig.settingsDatabaseId,  // aurora-db
    miniappsConfig.collections.settings,
    ID.unique(),
    data
);
```

### Client-side (données - miniapp-xxx-db)

```typescript
const doc = await databases.createDocument(
    miniappsConfig.databaseId,  // miniapp-francais-db
    miniappsConfig.collections.poems,
    ID.unique(),
    data
);
```

### Server-side (API routes)

```typescript
import { Client, Databases, ID } from "node-appwrite";

function getAdminDatabases() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setKey(process.env.APPWRITE_API_KEY!);
    return new Databases(client);
}
```

---

## ⌨️ Accès via ⌘K

Automatique ! Toute app dans `MINI_APPS` apparaît dans le menu ⌘K.

---

## 🎯 Bonnes pratiques

- **Settings** → `settingsDatabaseId` (aurora-db)
- **Données app** → `databaseId` (miniapp-xxx-db)
- **Server-side** → Créer fichier `-server.ts` avec `node-appwrite`
- **UI** → Classes cohérentes: `rounded-2xl`, `bg-muted/50`

---

## 📋 Checklist

- [ ] Ajouter ID dans `MiniAppId` type
- [ ] Ajouter au registry `MINI_APPS`
- [ ] Créer dossier `components/miniapps/[name]/`
- [ ] Créer script `scripts/setup-miniapp-[name].ts`
- [ ] Ajouter variables `.env`
- [ ] Créer fonctions CRUD
- [ ] Intégrer dans `home/page.tsx`
- [ ] Tester sidebar + ⌘K

---

## 🔗 Fichiers de référence

| Fichier | Description |
|---------|-------------|
| `types/miniapps.ts` | Registry et types |
| `lib/appwrite/miniapps/config.ts` | Config 2 DBs |
| `components/miniapps/analyse-france/` | Exemple complet |
| `scripts/setup-miniapp-francais.ts` | Script DB exemple |
