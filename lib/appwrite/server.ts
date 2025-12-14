import { Client, Account, Users } from "node-appwrite";
import { appwriteConfig } from "./config";
import { headers } from "next/headers";

// Client admin avec API Key
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey!);

  return {
    client,
    account: new Account(client),
    users: new Users(client),
  };
}

// ✅ Récupérer l'utilisateur via JWT (remplace l'ancienne version avec cookies)
export async function getCurrentUserServer() {
  try {
    const headersList = await headers();
    const authorization = headersList.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return null;
    }

    const jwt = authorization.split("Bearer ")[1];

    if (!jwt) {
      return null;
    }

    // Créer un client avec le JWT
    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
      .setJWT(jwt);

    const account = new Account(client);
    const user = await account.get();

    return user;
  } catch (error) {
    return null;
  }
}