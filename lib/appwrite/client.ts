import { Client, Account, Databases } from "appwrite";
import { appwriteConfig } from "./config";

// Client-side Appwrite client
export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);

// Get current user
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}

// JWT Cache - Appwrite JWTs are valid for 15 minutes, cache for 14 minutes
let cachedJWT: string | null = null;
let jwtExpiresAt: number = 0;
const JWT_CACHE_DURATION = 14 * 60 * 1000; // 14 minutes in ms

// Get current session JWT token with caching
export async function getSessionJWT() {
  // Return cached JWT if still valid
  if (cachedJWT && Date.now() < jwtExpiresAt) {
    return cachedJWT;
  }

  try {
    const jwt = await account.createJWT();
    cachedJWT = jwt.jwt;
    jwtExpiresAt = Date.now() + JWT_CACHE_DURATION;
    return cachedJWT;
  } catch (error) {
    console.error("Error creating JWT:", error);
    // Clear cache on error
    cachedJWT = null;
    jwtExpiresAt = 0;
    return null;
  }
}

// Clear JWT cache (call on logout)
export function clearJWTCache() {
  cachedJWT = null;
  jwtExpiresAt = 0;
}

// Sign in with email
export async function signIn(email: string, password: string) {
  try {
    // Vérifier si une session existe déjà
    try {
      const existingUser = await account.get();
      if (existingUser) {
        // Une session existe déjà
        if (existingUser.email === email) {
          // C'est le même utilisateur, pas besoin de recréer une session
          return { success: true, session: null, alreadyLoggedIn: true };
        } else {
          // C'est un utilisateur différent, déconnecter d'abord
          await account.deleteSession("current");
          clearJWTCache();
        }
      }
    } catch {
      // Pas de session active, c'est normal
    }

    const session = await account.createEmailPasswordSession(email, password);
    return { success: true, session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign up with email
export async function signUp(email: string, password: string, name: string) {
  try {
    const user = await account.create("unique()", email, password, name);
    // Auto sign in after registration
    await signIn(email, password);
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut() {
  try {
    // Clear JWT cache before signing out
    clearJWTCache();
    await account.deleteSession("current");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
