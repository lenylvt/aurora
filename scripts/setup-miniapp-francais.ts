/**
 * Script pour initialiser la base de données Mini App Français (Analyse Linéaire)
 *
 * Usage:
 * 1. Créer une API Key dans Appwrite Console avec les permissions Database
 * 2. Exporter la clé: export APPWRITE_API_KEY=your_key_here
 * 3. Lancer: npx tsx scripts/setup-miniapp-francais.ts
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

async function setupMiniAppFrancais() {
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

    console.log("🚀 Initialisation de la base de données Mini App Français (Analyse Linéaire)...\n");

    try {
        // 1. Create database for Mini App Français
        console.log("📦 Création de la database 'miniapp-francais-db'...");
        const database = await databases.create(
            ID.unique(),
            "miniapp-francais-db",
            true // enabled
        );
        console.log(`✅ Database créée: ${database.$id}\n`);

        const databaseId = database.$id;

        // ============================================
        // 2. poems collection
        // ============================================
        console.log("📁 Création de la collection 'poems'...");
        const poemsCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            "poems",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            false,
            true
        );
        console.log(`✅ Collection créée: ${poemsCollection.$id}`);

        console.log("  ➕ Ajout des attributs...");
        await databases.createStringAttribute(
            databaseId,
            poemsCollection.$id,
            "title",
            500,
            true
        );
        console.log("    ✓ title");

        await databases.createStringAttribute(
            databaseId,
            poemsCollection.$id,
            "author",
            255,
            true
        );
        console.log("    ✓ author");

        await databases.createStringAttribute(
            databaseId,
            poemsCollection.$id,
            "fullText",
            50000,
            true
        );
        console.log("    ✓ fullText");

        await databases.createStringAttribute(
            databaseId,
            poemsCollection.$id,
            "analyses",
            50000,
            false // optional - AI-provided analysis
        );
        console.log("    ✓ analyses");

        await waitForAttributes(databases, databaseId, poemsCollection.$id, [
            "title",
            "author",
            "fullText",
            "analyses",
        ]);

        console.log("  🔍 Création des indexes...");
        await databases.createIndex(
            databaseId,
            poemsCollection.$id,
            "title_index",
            IndexType.Key,
            ["title"],
            ["ASC"]
        );
        console.log("    ✓ title_index");

        await databases.createIndex(
            databaseId,
            poemsCollection.$id,
            "author_index",
            IndexType.Key,
            ["author"],
            ["ASC"]
        );
        console.log("    ✓ author_index\n");

        // ============================================
        // 3. user_analyses collection (in-progress analyses)
        // ============================================
        console.log("📁 Création de la collection 'user_analyses'...");
        const analysesCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            "user_analyses",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            false,
            true
        );
        console.log(`✅ Collection créée: ${analysesCollection.$id}`);

        console.log("  ➕ Ajout des attributs...");
        await databases.createStringAttribute(
            databaseId,
            analysesCollection.$id,
            "userId",
            255,
            true
        );
        console.log("    ✓ userId");

        await databases.createStringAttribute(
            databaseId,
            analysesCollection.$id,
            "poemId",
            255,
            true
        );
        console.log("    ✓ poemId");

        await databases.createStringAttribute(
            databaseId,
            analysesCollection.$id,
            "poemTitle",
            500,
            true
        );
        console.log("    ✓ poemTitle");

        await databases.createIntegerAttribute(
            databaseId,
            analysesCollection.$id,
            "stanzaId",
            true,
            0,
            1000
        );
        console.log("    ✓ stanzaId");

        // Store selected words as JSON array string
        await databases.createStringAttribute(
            databaseId,
            analysesCollection.$id,
            "selectedWords",
            10000,
            true
        );
        console.log("    ✓ selectedWords");

        await databases.createStringAttribute(
            databaseId,
            analysesCollection.$id,
            "analysis",
            20000,
            true
        );
        console.log("    ✓ analysis");

        await databases.createBooleanAttribute(
            databaseId,
            analysesCollection.$id,
            "completed",
            false, // optional
            false // default: not completed
        );
        console.log("    ✓ completed");

        await databases.createDatetimeAttribute(
            databaseId,
            analysesCollection.$id,
            "createdAt",
            true
        );
        console.log("    ✓ createdAt");

        await waitForAttributes(databases, databaseId, analysesCollection.$id, [
            "userId",
            "poemId",
            "poemTitle",
            "stanzaId",
            "selectedWords",
            "analysis",
            "completed",
            "createdAt",
        ]);

        console.log("  🔍 Création des indexes...");
        await databases.createIndex(
            databaseId,
            analysesCollection.$id,
            "userId_index",
            IndexType.Key,
            ["userId"],
            ["ASC"]
        );
        console.log("    ✓ userId_index");

        await databases.createIndex(
            databaseId,
            analysesCollection.$id,
            "userId_poemId_index",
            IndexType.Key,
            ["userId", "poemId"],
            ["ASC", "ASC"]
        );
        console.log("    ✓ userId_poemId_index");

        await databases.createIndex(
            databaseId,
            analysesCollection.$id,
            "completed_index",
            IndexType.Key,
            ["completed"],
            ["ASC"]
        );
        console.log("    ✓ completed_index\n");

        // ============================================
        // 4. user_results collection (AI evaluations)
        // ============================================
        console.log("📁 Création de la collection 'user_results'...");
        const resultsCollection = await databases.createCollection(
            databaseId,
            ID.unique(),
            "user_results",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            false,
            true
        );
        console.log(`✅ Collection créée: ${resultsCollection.$id}`);

        console.log("  ➕ Ajout des attributs...");
        await databases.createStringAttribute(
            databaseId,
            resultsCollection.$id,
            "userId",
            255,
            true
        );
        console.log("    ✓ userId");

        await databases.createStringAttribute(
            databaseId,
            resultsCollection.$id,
            "poemId",
            255,
            true
        );
        console.log("    ✓ poemId");

        await databases.createStringAttribute(
            databaseId,
            resultsCollection.$id,
            "poemTitle",
            500,
            true
        );
        console.log("    ✓ poemTitle");

        await databases.createStringAttribute(
            databaseId,
            resultsCollection.$id,
            "poemAuthor",
            255,
            true
        );
        console.log("    ✓ poemAuthor");

        await databases.createEnumAttribute(
            databaseId,
            resultsCollection.$id,
            "mode",
            ["complete", "quick"],
            true
        );
        console.log("    ✓ mode");

        await databases.createIntegerAttribute(
            databaseId,
            resultsCollection.$id,
            "totalStanzas",
            true,
            1,
            1000
        );
        console.log("    ✓ totalStanzas");

        await databases.createFloatAttribute(
            databaseId,
            resultsCollection.$id,
            "averageScore",
            true,
            0,
            20
        );
        console.log("    ✓ averageScore");

        // Store evaluations as JSON string
        await databases.createStringAttribute(
            databaseId,
            resultsCollection.$id,
            "evaluations",
            50000,
            true
        );
        console.log("    ✓ evaluations");

        await databases.createDatetimeAttribute(
            databaseId,
            resultsCollection.$id,
            "createdAt",
            true
        );
        console.log("    ✓ createdAt");

        await waitForAttributes(databases, databaseId, resultsCollection.$id, [
            "userId",
            "poemId",
            "poemTitle",
            "poemAuthor",
            "mode",
            "totalStanzas",
            "averageScore",
            "evaluations",
            "createdAt",
        ]);

        console.log("  🔍 Création des indexes...");
        await databases.createIndex(
            databaseId,
            resultsCollection.$id,
            "userId_index",
            IndexType.Key,
            ["userId"],
            ["ASC"]
        );
        console.log("    ✓ userId_index");

        await databases.createIndex(
            databaseId,
            resultsCollection.$id,
            "createdAt_index",
            IndexType.Key,
            ["createdAt"],
            ["DESC"]
        );
        console.log("    ✓ createdAt_index\n");

        // ============================================
        // 5. Output .env values
        // ============================================
        console.log("🎉 Base de données Mini App Français configurée avec succès!\n");
        console.log("📋 IDs à ajouter dans votre fichier .env:\n");
        console.log(`NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID=${databaseId}`);
        console.log(`NEXT_PUBLIC_POEMS_COLLECTION_ID=${poemsCollection.$id}`);
        console.log(`NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID=${analysesCollection.$id}`);
        console.log(`NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID=${resultsCollection.$id}`);
        console.log(
            "\n✨ Vous pouvez maintenant utiliser l'Analyse Linéaire dans l'application!\n"
        );
    } catch (error: any) {
        console.error("❌ Erreur:", error.message);
        if (error.response) {
            console.error("Détails:", error.response);
        }
        process.exit(1);
    }
}

setupMiniAppFrancais();
