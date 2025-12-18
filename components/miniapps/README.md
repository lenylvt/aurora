# 📦 Guide de création de Mini Apps

Ce guide explique comment créer une nouvelle Mini App pour Aurora.

## 🏗️ Architecture

```
components/miniapps/
├── index.ts                    # Export central
├── miniapps-provider.tsx       # Context provider (état global)
├── welcome-popup.tsx           # Popup de bienvenue dynamique
└── [mini-app-name]/            # Dossier de la mini app
    ├── index.tsx               # Point d'entrée principal
    ├── sidebar.tsx             # Sidebar spécifique
    └── [composants].tsx        # Composants spécifiques

lib/appwrite/miniapps/
├── config.ts                   # Configuration DBs (aurora + mini apps)
├── settings.ts                 # CRUD settings (aurora-db)
├── [resource].ts               # CRUD client-side (miniapp-xxx-db)
└── [resource]-server.ts        # CRUD server-side (API routes)

types/miniapps.ts               # Types et registry
```

---

## 🗄️ Structure des bases de données

### Architecture multi-DB

| Database | Description | Collections |
|----------|-------------|-------------|
| **aurora-db** | DB principale | chats, messages, **mini_apps_settings** |
| **miniapp-francais-db** | Analyse Linéaire | poems, user_analyses, user_results |
| **miniapp-code-db** | IDE Code | code_files |

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

# Mini App Code (IDE)
NEXT_PUBLIC_MINIAPP_CODE_DATABASE_ID=xxx
NEXT_PUBLIC_CODE_FILES_COLLECTION_ID=xxx
```

**Fichier:** `lib/appwrite/miniapps/config.ts`

```typescript
// Settings dans aurora-db
export const auroraConfig = { ... };

// Mini App Français
export const miniappFrancaisConfig = { ... };

// Mini App Code
export const miniappCodeConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_CODE_DATABASE_ID!,
    collections: {
        codeFiles: process.env.NEXT_PUBLIC_CODE_FILES_COLLECTION_ID!,
    },
};
```

---

## 📁 Sidebar spécifique

Chaque mini app doit avoir sa propre sidebar!

**Fichier:** `components/miniapps/[name]/sidebar.tsx`

```tsx
"use client";

import { SidebarGroup, SidebarGroupLabel, ... } from "@/components/ui/sidebar";
import { useMiniApps } from "../miniapps-provider";

export function MaNouvelleAppSidebar() {
    // État et actions spécifiques
    return (
        <SidebarGroup>
            <SidebarGroupLabel>...</SidebarGroupLabel>
            {/* Contenu de la sidebar */}
        </SidebarGroup>
    );
}
```

**Puis dans:** `components/app-sidebar.tsx`

```tsx
import { MaNouvelleAppSidebar } from "@/components/miniapps";

// Dans le render:
{activeMiniApp === "ma-nouvelle-app" && <MaNouvelleAppSidebar />}
```

---

## 📝 Étapes de création

### 1. Définir la Mini App dans le registry

**Fichier:** `types/miniapps.ts`

```typescript
export type MiniAppId = "analyse-france" | "code" | "ma-nouvelle-app";

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

### 2. Créer la base de données

Créer `scripts/setup-miniapp-[name].ts` (voir exemples existants).

### 3. Créer les composants

```
components/miniapps/ma-nouvelle-app/
├── index.tsx          # Composant principal
├── sidebar.tsx        # Sidebar dédiée
└── [autres].tsx       # Composants additionnels
```

### 4. Exporter et intégrer

**Fichier:** `components/miniapps/index.ts`
```typescript
export { default as MaNouvelleApp } from "./ma-nouvelle-app";
export { MaNouvelleAppSidebar } from "./ma-nouvelle-app/sidebar";
```

**Fichier:** `app/(dashboard)/home/page.tsx`
```tsx
{activeMiniApp === "ma-nouvelle-app" && <MaNouvelleApp />}
```

**Fichier:** `components/app-sidebar.tsx`
```tsx
{activeMiniApp === "ma-nouvelle-app" && <MaNouvelleAppSidebar />}
```

---

## 🎯 Bonnes pratiques

- **Settings** → `auroraConfig.databaseId`
- **Données app** → `miniappXxxConfig.databaseId`
- **Sidebar** → Créer un composant dédié `sidebar.tsx`
- **Auto-save** → Utiliser un debounce (3s recommandé)
- **UI** → Classes cohérentes: `rounded-2xl`, `bg-muted/50`

---

## 📋 Checklist

- [ ] Ajouter ID dans `MiniAppId` type
- [ ] Ajouter au registry `MINI_APPS`
- [ ] Créer script `scripts/setup-miniapp-[name].ts`
- [ ] Ajouter config dans `lib/appwrite/miniapps/config.ts`
- [ ] Ajouter variables `.env`
- [ ] Créer dossier `components/miniapps/[name]/`
- [ ] Créer `sidebar.tsx` dédié
- [ ] Créer fonctions CRUD
- [ ] Mettre à jour `components/miniapps/index.ts`
- [ ] Intégrer dans `home/page.tsx`
- [ ] Intégrer sidebar dans `app-sidebar.tsx`
- [ ] Mettre à jour `welcome-popup.tsx` si besoin

---

## 🔗 Fichiers de référence

| Fichier | Description |
|---------|-------------|
| `types/miniapps.ts` | Registry et types |
| `lib/appwrite/miniapps/config.ts` | Config multi-DBs |
| `components/miniapps/analyse-france/` | Exemple Analyse Linéaire |
| `components/miniapps/code/` | Exemple IDE Code |
| `scripts/setup-miniapp-francais.ts` | Script DB Français |
| `scripts/setup-miniapp-code.ts` | Script DB Code |
