# Scripts Aurora

## 🗄️ Setup Database - Base de données principale

Ce script crée la structure de base de données Appwrite principale pour Aurora.

### 📋 Ce qui sera créé

1. **Database** `aurora-db`
2. **Collection** `chats` - Conversations
3. **Collection** `messages` - Messages des conversations
4. **Collection** `mini_apps_settings` - Préférences utilisateur Mini Apps

### ▶️ Exécution

```bash
export APPWRITE_API_KEY=your_api_key_here
npx tsx scripts/setup-database.ts
```

### ✅ Variables .env

```
NEXT_PUBLIC_DATABASE_ID=xxx
NEXT_PUBLIC_CHATS_COLLECTION_ID=xxx
NEXT_PUBLIC_MESSAGES_COLLECTION_ID=xxx
NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID=xxx
```

---

## 📚 Setup Mini App Français - Analyse Linéaire

Ce script crée une **base de données dédiée** pour le Mini App Français (Analyse Linéaire).

### 📋 Ce qui sera créé

1. **Database** `miniapp-francais-db`
2. **Collection** `poems` - Poèmes à analyser
3. **Collection** `user_analyses` - Analyses en cours des utilisateurs
4. **Collection** `user_results` - Résultats des évaluations IA

### ▶️ Exécution

```bash
export APPWRITE_API_KEY=your_api_key_here
npx tsx scripts/setup-miniapp-francais.ts
```

### ✅ Variables .env

```
NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID=xxx
NEXT_PUBLIC_POEMS_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID=xxx
```

### 📝 Importer des poèmes

Ajouter des poèmes via la console Appwrite:
- `title`: Titre du poème
- `author`: Nom de l'auteur
- `fullText`: Texte complet (strophes séparées par double saut de ligne)
- `analyses`: (optionnel) Analyse markdown de référence

---

## 🔑 Créer une API Key Appwrite

1. Console Appwrite → Settings → View API Keys
2. Create API Key avec les scopes:
   - ✅ `databases.*`
   - ✅ `collections.*`
   - ✅ `attributes.*`
   - ✅ `indexes.*`
   - ✅ `documents.*`

---

## 📖 Plus d'infos

- [Appwrite Databases](https://appwrite.io/docs/products/databases)
- [Appwrite Permissions](https://appwrite.io/docs/products/databases/permissions)
