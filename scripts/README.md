# Scripts Aurora

## 🗄️ Setup Database - Initialiser Appwrite

Ce script crée automatiquement toute la structure de base de données Appwrite pour Aurora.

### 📋 Ce qui sera créé

1. **Database** `aurora-db`
2. **Collection** `chats`
   - Attributs: userId, title, createdAt, updatedAt
   - Indexes: userId_index, updatedAt_index
3. **Collection** `messages`
   - Attributs: chatId, role, content, files, createdAt
   - Indexes: chatId_index, createdAt_index
4. **Permissions** configurées pour tous les utilisateurs authentifiés

### 🔑 Étape 1: Créer une API Key Appwrite

1. Aller sur votre console Appwrite:
   ```
   https://fra.cloud.appwrite.io/console/project-693da1c50018f97338dc/settings
   ```

2. Cliquer sur **"View API Keys"** ou **"Voir les clés API"**

3. Cliquer sur **"Create API Key"** / **"Créer une clé API"**

4. **Nom de la clé**: `Aurora Setup`

5. **Scopes** à sélectionner (IMPORTANT - cocher toutes ces permissions):
   - ✅ `databases.read`
   - ✅ `databases.write`
   - ✅ `collections.read`
   - ✅ `collections.write`
   - ✅ `attributes.read`
   - ✅ `attributes.write`
   - ✅ `indexes.read`
   - ✅ `indexes.write`

6. Cliquer sur **"Create"** et **copier la clé** (elle ne sera affichée qu'une fois!)

### ▶️ Étape 2: Exécuter le script

Dans votre terminal:

```bash
# Option 1: Exporter la clé (recommandé)
export APPWRITE_API_KEY=your_api_key_here
npx tsx scripts/setup-database.ts

# Option 2: En une ligne
APPWRITE_API_KEY=your_api_key_here npx tsx scripts/setup-database.ts
```

### ✅ Étape 3: Copier les IDs dans .env

Le script va afficher les IDs créés:

```
NEXT_PUBLIC_DATABASE_ID=xxx
NEXT_PUBLIC_CHATS_COLLECTION_ID=yyy
NEXT_PUBLIC_MESSAGES_COLLECTION_ID=zzz
```

Copier ces valeurs dans votre fichier `.env`!

### 🔧 En cas d'erreur

**"APPWRITE_API_KEY non définie"**
- Vérifier que vous avez bien exporté la variable
- Vérifier qu'il n'y a pas d'espace avant/après la clé

**"Invalid API key"**
- Vérifier que la clé est correcte
- Vérifier que tous les scopes sont bien cochés

**"Collection already exists"**
- Une collection avec ce nom existe déjà
- Soit la supprimer dans la console Appwrite
- Soit modifier le script pour utiliser un nom différent

### 🗑️ Réinitialiser la base de données

Pour tout supprimer et recommencer:

1. Aller dans la console Appwrite
2. Databases → Sélectionner `aurora-db`
3. Cliquer sur "Delete Database"
4. Relancer le script

---

## 📚 Setup Mini Apps Database - Analyse France

Ce script crée une **base de données séparée** pour les Mini Apps (Analyse France, etc.).

### 📋 Ce qui sera créé

1. **Database** `miniapps-db`
2. **Collection** `mini_apps_settings` - Préférences utilisateur par mini app
3. **Collection** `poems` - Poèmes pour l'analyse
4. **Collection** `user_analyses` - Analyses en cours
5. **Collection** `user_results` - Résultats des évaluations IA

### ▶️ Exécuter le script

```bash
export APPWRITE_API_KEY=your_api_key_here
npx tsx scripts/setup-miniapps-database.ts
```

### ✅ Copier les IDs dans .env

```
NEXT_PUBLIC_MINIAPPS_DATABASE_ID=xxx
NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID=xxx
NEXT_PUBLIC_POEMS_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID=xxx
NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID=xxx
```

### 📝 Importer des poèmes

Après l'exécution du script, ajouter des poèmes via la console Appwrite:
- `title`: Titre du poème
- `author`: Nom de l'auteur
- `fullText`: Texte complet (strophes séparées par double saut de ligne)
- `analyses`: (optionnel) Analyse markdown pré-remplie

---

## 📖 Plus d'infos

- [Appwrite Databases](https://appwrite.io/docs/products/databases)
- [Appwrite Permissions](https://appwrite.io/docs/products/databases/permissions)
- [Appwrite CLI](https://appwrite.io/docs/tooling/command-line)
