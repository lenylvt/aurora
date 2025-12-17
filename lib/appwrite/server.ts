import { Client, Account, Users } from "node-appwrite";
import { appwriteConfig } from "./config";
import { headers } from "next/headers";

// Client admin avec API Key
export function createAdminClient() {
  console.log(`[Appwrite Server] Creating admin client...`);
  console.log(`[Appwrite Server] Endpoint: ${appwriteConfig.endpoint}`);
  console.log(`[Appwrite Server] Project: ${appwriteConfig.projectId}`);

  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey!);

  console.log(`[Appwrite Server] ✓ Admin client created`);
  return {
    client,
    account: new Account(client),
    users: new Users(client),
  };
}

// ✅ Récupérer l'utilisateur via JWT (remplace l'ancienne version avec cookies)
export async function getCurrentUserServer() {
  const startTime = Date.now();
  console.log(`[Appwrite Server] getCurrentUserServer called at ${new Date().toISOString()}`);

  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");
    console.log(`[Appwrite Server] Authorization header present: ${!!authorization}`);

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log(`[Appwrite Server] ❌ No valid Authorization header`);
      return null;
    }

    const jwt = authorization.split("Bearer ")[1];
    console.log(`[Appwrite Server] JWT token length: ${jwt?.length || 0} chars`);

    if (!jwt) {
      console.log(`[Appwrite Server] ❌ No JWT token found`);
      return null;
    }

    // Créer un client avec le JWT
    console.log(`[Appwrite Server] Creating client with JWT...`);
    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setJWT(jwt);

    const account = new Account(client);
    console.log(`[Appwrite Server] Fetching user account...`);
    const user = await account.get();

    console.log(`[Appwrite Server] ✓ User authenticated: ${user.$id} (${user.email}) in ${Date.now() - startTime}ms`);
    return user;
  } catch (error: any) {
    console.log(`[Appwrite Server] ❌ Auth failed: ${error.message} (took ${Date.now() - startTime}ms)`);
    return null;
  }
}