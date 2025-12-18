/**
 * Script pour initialiser la base de données Mini App Code
 *
 * Usage:
 * 1. Créer une API Key dans Appwrite Console avec les permissions Database
 * 2. Exporter la clé: export APPWRITE_API_KEY=your_key_here
 * 3. Lancer: npx tsx scripts/setup-miniapp-code.ts
 */

import { Client, Databases, ID, Permission, Role, IndexType } from "node-appwrite";

const PROJECT_ID = "693da1c50018f97338dc";
const ENDPOINT = "https://fra.cloud.appwrite.io/v1";

// Helper: wait for attributes to become available
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

            const allAvailable = attributeKeys.every((key) =>
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

            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch {
            // Continue waiting
        }
    }

    throw new Error("Timeout: Les attributs ne sont pas devenus disponibles");
}

async function setupMiniAppCode() {
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!apiKey) {
        console.error("❌ APPWRITE_API_KEY non définie!");
        console.log("\n📝 Pour obtenir une API Key:");
        console.log(
            "1. Aller sur https://fra.cloud.appwrite.io/console/project-693da1c50018f97338dc/settings"
        );
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
        console.log("   - documents.read");
        console.log("   - documents.write");
        console.log("4. Exporter la clé: export APPWRITE_API_KEY=your_key_here");
        console.log("5. Relancer ce script\n");
        process.exit(1);
    }

    const client = new Client()
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID)
        .setKey(apiKey);

    const databases = new Databases(client);

    console.log("🚀 Initialisation de la base de données Mini App Code...\n");

    try {
        // 1. Create database for Mini App Code
        console.log("📦 Création de la database 'miniapp-code-db'...");
        const database = await databases.create(
            ID.unique(),
            "miniapp-code-db",
            true // enabled
        );
        console.log(`✅ Database créée: ${database.$id}\n`);

        const databaseId = database.$id;

        // ============================================
        // 2. code_files collection
        // ============================================
        console.log("📁 Création de la collection 'code_files'...");
        const codeFilesCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            "code_files",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            false,
            true
        );
        console.log(`✅ Collection créée: ${codeFilesCollection.$id}`);

        console.log("  ➕ Ajout des attributs...");

        // userId - owner of the file
        await databases.createStringAttribute(
            databaseId,
            codeFilesCollection.$id,
            "userId",
            255,
            true
        );
        console.log("    ✓ userId");

        // name - file name (e.g., "main.py")
        await databases.createStringAttribute(
            databaseId,
            codeFilesCollection.$id,
            "name",
            255,
            true
        );
        console.log("    ✓ name");

        // content - file content (code)
        await databases.createStringAttribute(
            databaseId,
            codeFilesCollection.$id,
            "content",
            100000,  // 100KB max per file
            true
        );
        console.log("    ✓ content");

        // language - programming language
        await databases.createStringAttribute(
            databaseId,
            codeFilesCollection.$id,
            "language",
            50,
            true
        );
        console.log("    ✓ language");

        // updatedAt - last modification timestamp
        await databases.createDatetimeAttribute(
            databaseId,
            codeFilesCollection.$id,
            "updatedAt",
            true
        );
        console.log("    ✓ updatedAt");

        await waitForAttributes(databases, databaseId, codeFilesCollection.$id, [
            "userId",
            "name",
            "content",
            "language",
            "updatedAt",
        ]);

        console.log("  🔍 Création des indexes...");

        // Index for fetching user's files
        await databases.createIndex(
            databaseId,
            codeFilesCollection.$id,
            "userId_index",
            IndexType.Key,
            ["userId"],
            ["ASC"]
        );
        console.log("    ✓ userId_index");

        // Index for sorting by update time
        await databases.createIndex(
            databaseId,
            codeFilesCollection.$id,
            "userId_updatedAt_index",
            IndexType.Key,
            ["userId", "updatedAt"],
            ["ASC", "DESC"]
        );
        console.log("    ✓ userId_updatedAt_index\n");

        // ============================================
        // 3. Output .env values
        // ============================================
        console.log("🎉 Base de données Mini App Code configurée avec succès!\n");
        console.log("📋 IDs à ajouter dans votre fichier .env:\n");
        console.log(`NEXT_PUBLIC_MINIAPP_CODE_DATABASE_ID=${databaseId}`);
        console.log(`NEXT_PUBLIC_CODE_FILES_COLLECTION_ID=${codeFilesCollection.$id}`);
        console.log(
            "\n✨ Vous pouvez maintenant utiliser l'IDE Code dans l'application!\n"
        );
    } catch (error: any) {
        console.error("❌ Erreur:", error.message);
        if (error.response) {
            console.error("Détails:", error.response);
        }
        process.exit(1);
    }
}

setupMiniAppCode();
