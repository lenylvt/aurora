/**
 * Script pour initialiser la structure de base de données Appwrite
 *
 * Usage:
 * 1. Créer une API Key dans Appwrite Console avec les permissions Database
 * 2. Exporter la clé: export APPWRITE_API_KEY=your_key_here
 * 3. Lancer: npx tsx scripts/setup-database.ts
 */

import { Client, Databases, ID, Permission, Role, IndexType } from "node-appwrite";

const PROJECT_ID = "693da1c50018f97338dc";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

// Fonction pour attendre que les attributs soient disponibles
async function waitForAttributes(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  attributeKeys: string[],
  maxRetries = 30
) {
  console.log("  ⏳ Attente que les attributs soient disponibles...");

  for (let i = 0; i < maxRetries; i++) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const availableAttributes = collection.attributes.map((attr: any) => attr.key);

      const allAvailable = attributeKeys.every(key =>
        availableAttributes.includes(key)
      );

      if (allAvailable) {
        const allReady = collection.attributes
          .filter((attr: any) => attributeKeys.includes(attr.key))
          .every((attr: any) => attr.status === "available");

        if (allReady) {
          console.log("  ✓ Tous les attributs sont disponibles!");
          return;
        }
      }

      // Attendre 2 secondes avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Continue à attendre
    }
  }

  throw new Error("Timeout: Les attributs ne sont pas devenus disponibles");
}

async function setupDatabase() {
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!apiKey) {
    console.error("❌ APPWRITE_API_KEY non définie!");
    console.log("\n📝 Pour obtenir une API Key:");
    console.log("1. Aller sur https://fra.cloud.appwrite.io/console/project-693da1c50018f97338dc/settings");
    console.log("2. Aller dans 'Settings' → 'View API Keys'");
    console.log("3. Créer une nouvelle clé avec les scopes:");
    console.log("   - databases.read");
    console.log("   - databases.write");
    console.log("   - collections.read");
    console.log("   - collections.write");
    console.log("   - attributes.read");
    console.log("   - attributes.write");
    console.log("   - indexes.read");
    console.log("   - indexes.write");
    console.log("4. Exporter la clé: export APPWRITE_API_KEY=your_key_here");
    console.log("5. Relancer ce script\n");
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(apiKey);

  const databases = new Databases(client);

  console.log("🚀 Initialisation de la base de données Aurora...\n");

  try {
    // 1. Créer la database
    console.log("📦 Création de la database 'aurora-db'...");
    const database = await databases.create(
      ID.unique(),
      "aurora-db",
      true // enabled
    );
    console.log(`✅ Database créée: ${database.$id}\n`);

    const databaseId = database.$id;

    // 2. Créer la collection 'chats'
    console.log("📁 Création de la collection 'chats'...");
    const chatsCollection = await databases.createCollection(
      databaseId,
      ID.unique(),
      "chats",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false, // document security disabled (using collection permissions)
      true // enabled
    );
    console.log(`✅ Collection 'chats' créée: ${chatsCollection.$id}`);

    // Attributs pour 'chats'
    console.log("  ➕ Ajout des attributs...");
    await databases.createStringAttribute(
      databaseId,
      chatsCollection.$id,
      "userId",
      255,
      true // required
    );
    console.log("    ✓ userId");

    await databases.createStringAttribute(
      databaseId,
      chatsCollection.$id,
      "title",
      500,
      true
    );
    console.log("    ✓ title");

    await databases.createDatetimeAttribute(
      databaseId,
      chatsCollection.$id,
      "createdAt",
      true
    );
    console.log("    ✓ createdAt");

    await databases.createDatetimeAttribute(
      databaseId,
      chatsCollection.$id,
      "updatedAt",
      true
    );
    console.log("    ✓ updatedAt");

    // Attendre que tous les attributs soient disponibles
    await waitForAttributes(
      databases,
      databaseId,
      chatsCollection.$id,
      ["userId", "title", "createdAt", "updatedAt"]
    );

    // Indexes pour 'chats'
    console.log("  🔍 Création des indexes...");
    await databases.createIndex(
      databaseId,
      chatsCollection.$id,
      "userId_index",
      IndexType.Key,
      ["userId"],
      ["ASC"]
    );
    console.log("    ✓ userId_index");

    await databases.createIndex(
      databaseId,
      chatsCollection.$id,
      "updatedAt_index",
      IndexType.Key,
      ["updatedAt"],
      ["DESC"]
    );
    console.log("    ✓ updatedAt_index\n");

    // 3. Créer la collection 'messages'
    console.log("📁 Création de la collection 'messages'...");
    const messagesCollection = await databases.createCollection(
      databaseId,
      ID.unique(),
      "messages",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true
    );
    console.log(`✅ Collection 'messages' créée: ${messagesCollection.$id}`);

    // Attributs pour 'messages'
    console.log("  ➕ Ajout des attributs...");
    await databases.createStringAttribute(
      databaseId,
      messagesCollection.$id,
      "chatId",
      255,
      true
    );
    console.log("    ✓ chatId");

    await databases.createEnumAttribute(
      databaseId,
      messagesCollection.$id,
      "role",
      ["user", "assistant"],
      true
    );
    console.log("    ✓ role");

    await databases.createStringAttribute(
      databaseId,
      messagesCollection.$id,
      "content",
      50000,
      true
    );
    console.log("    ✓ content");

    await databases.createStringAttribute(
      databaseId,
      messagesCollection.$id,
      "files",
      5000,
      false // optional
    );
    console.log("    ✓ files");

    await databases.createDatetimeAttribute(
      databaseId,
      messagesCollection.$id,
      "createdAt",
      true
    );
    console.log("    ✓ createdAt");

    // Attendre que tous les attributs soient disponibles
    await waitForAttributes(
      databases,
      databaseId,
      messagesCollection.$id,
      ["chatId", "role", "content", "files", "createdAt"]
    );

    // Indexes pour 'messages'
    console.log("  🔍 Création des indexes...");
    await databases.createIndex(
      databaseId,
      messagesCollection.$id,
      "chatId_index",
      IndexType.Key,
      ["chatId"],
      ["ASC"]
    );
    console.log("    ✓ chatId_index");

    await databases.createIndex(
      databaseId,
      messagesCollection.$id,
      "createdAt_index",
      IndexType.Key,
      ["createdAt"],
      ["ASC"]
    );
    console.log("    ✓ createdAt_index\n");

    // 4. Créer la collection 'mini_apps_settings'
    console.log("📁 Création de la collection 'mini_apps_settings'...");
    const settingsCollection = await databases.createCollection(
      databaseId,
      ID.unique(),
      "mini_apps_settings",
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true
    );
    console.log(`✅ Collection 'mini_apps_settings' créée: ${settingsCollection.$id}`);

    // Attributs pour 'mini_apps_settings'
    console.log("  ➕ Ajout des attributs...");
    await databases.createStringAttribute(
      databaseId,
      settingsCollection.$id,
      "userId",
      255,
      true
    );
    console.log("    ✓ userId");

    await databases.createStringAttribute(
      databaseId,
      settingsCollection.$id,
      "miniAppId",
      100,
      true
    );
    console.log("    ✓ miniAppId");

    await databases.createBooleanAttribute(
      databaseId,
      settingsCollection.$id,
      "enabled",
      false,
      true // default: true
    );
    console.log("    ✓ enabled");

    await databases.createBooleanAttribute(
      databaseId,
      settingsCollection.$id,
      "showInSidebar",
      false,
      true // default: true
    );
    console.log("    ✓ showInSidebar");

    await databases.createBooleanAttribute(
      databaseId,
      settingsCollection.$id,
      "hasSeenWelcome",
      false,
      false // default: false
    );
    console.log("    ✓ hasSeenWelcome");

    // Attendre que tous les attributs soient disponibles
    await waitForAttributes(
      databases,
      databaseId,
      settingsCollection.$id,
      ["userId", "miniAppId", "enabled", "showInSidebar", "hasSeenWelcome"]
    );

    // Indexes pour 'mini_apps_settings'
    console.log("  🔍 Création des indexes...");
    await databases.createIndex(
      databaseId,
      settingsCollection.$id,
      "userId_index",
      IndexType.Key,
      ["userId"],
      ["ASC"]
    );
    console.log("    ✓ userId_index");

    await databases.createIndex(
      databaseId,
      settingsCollection.$id,
      "userId_miniAppId_index",
      IndexType.Key,
      ["userId", "miniAppId"],
      ["ASC", "ASC"]
    );
    console.log("    ✓ userId_miniAppId_index\n");

    // 5. Afficher les IDs pour .env
    console.log("🎉 Base de données configurée avec succès!\n");
    console.log("📋 IDs à ajouter dans votre fichier .env:\n");
    console.log(`NEXT_PUBLIC_DATABASE_ID=${databaseId}`);
    console.log(`NEXT_PUBLIC_CHATS_COLLECTION_ID=${chatsCollection.$id}`);
    console.log(`NEXT_PUBLIC_MESSAGES_COLLECTION_ID=${messagesCollection.$id}`);
    console.log(`NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID=${settingsCollection.$id}`);
    console.log("\n✨ Vous pouvez maintenant lancer l'application!\n");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    if (error.response) {
      console.error("Détails:", error.response);
    }
    process.exit(1);
  }
}

setupDatabase();

