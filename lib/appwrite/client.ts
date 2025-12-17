import { Client, Account, Databases } from "appwrite";
import { appwriteConfig } from "./config";

// Client-side Appwrite client
console.log(`[Appwrite Client] Initializing client...`);
console.log(`[Appwrite Client] Endpoint: ${appwriteConfig.endpoint}`);
console.log(`[Appwrite Client] Project: ${appwriteConfig.projectId}`);

export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
console.log(`[Appwrite Client] ✓ Client initialized`);

// Get current user
export async function getCurrentUser() {
  const startTime = Date.now();
  console.log(`[Appwrite Client] getCurrentUser called at ${new Date().toISOString()}`);
  try {
    const user = await account.get();
    console.log(`[Appwrite Client] ✓ User found: ${user.$id} (${user.email}) in ${Date.now() - startTime}ms`);
    return user;
  } catch (error: any) {
    console.log(`[Appwrite Client] No user session: ${error.message} (${Date.now() - startTime}ms)`);
    return null;
  }
}

// JWT Cache - Appwrite JWTs are valid for 15 minutes, cache for 14 minutes
let cachedJWT: string | null = null;
let jwtExpiresAt: number = 0;
const JWT_CACHE_DURATION = 14 * 60 * 1000; // 14 minutes in ms

// Get current session JWT token with caching
export async function getSessionJWT() {
  const startTime = Date.now();
  console.log(`[Appwrite Client] getSessionJWT called at ${new Date().toISOString()}`);

  // Return cached JWT if still valid
  if (cachedJWT && Date.now() < jwtExpiresAt) {
    const remainingTime = Math.round((jwtExpiresAt - Date.now()) / 1000);
    console.log(`[Appwrite Client] ✓ Using cached JWT (expires in ${remainingTime}s)`);
    return cachedJWT;
  }
  console.log(`[Appwrite Client] Cache miss, creating new JWT...`);

  try {
    const jwt = await account.createJWT();
    cachedJWT = jwt.jwt;
    jwtExpiresAt = Date.now() + JWT_CACHE_DURATION;
    console.log(`[Appwrite Client] ✓ New JWT created in ${Date.now() - startTime}ms (valid for 14 min)`);
    return cachedJWT;
  } catch (error: any) {
    console.error(`[Appwrite Client] ❌ Error creating JWT: ${error.message}`);
    // Clear cache on error
    cachedJWT = null;
    jwtExpiresAt = 0;
    return null;
  }
}

// Clear JWT cache (call on logout)
export function clearJWTCache() {
  console.log(`[Appwrite Client] Clearing JWT cache at ${new Date().toISOString()}`);
  cachedJWT = null;
  jwtExpiresAt = 0;
  console.log(`[Appwrite Client] ✓ JWT cache cleared`);
}

// Sign in with email
export async function signIn(email: string, password: string) {
  const startTime = Date.now();
  console.log(`[Appwrite Client] signIn called for ${email} at ${new Date().toISOString()}`);

  try {
    // Vérifier si une session existe déjà
    try {
      console.log(`[Appwrite Client] Checking for existing session...`);
      const existingUser = await account.get();
      if (existingUser) {
        // Une session existe déjà
        if (existingUser.email === email) {
          // C'est le même utilisateur, pas besoin de recréer une session
          console.log(`[Appwrite Client] ✓ Already logged in as ${email} (${Date.now() - startTime}ms)`);
          return { success: true, session: null, alreadyLoggedIn: true };
        } else {
          // C'est un utilisateur différent, déconnecter d'abord
          console.log(`[Appwrite Client] Different user logged in (${existingUser.email}), signing out...`);
          await account.deleteSession("current");
          clearJWTCache();
        }
      }
    } catch {
      // Pas de session active, c'est normal
      console.log(`[Appwrite Client] No existing session`);
    }

    console.log(`[Appwrite Client] Creating new session...`);
    const session = await account.createEmailPasswordSession(email, password);
    console.log(`[Appwrite Client] ✓ Session created for ${email} in ${Date.now() - startTime}ms`);
    return { success: true, session };
  } catch (error: any) {
    console.log(`[Appwrite Client] ❌ Sign in failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

// Sign up with email
export async function signUp(email: string, password: string, name: string) {
  const startTime = Date.now();
  console.log(`[Appwrite Client] signUp called for ${email} (${name}) at ${new Date().toISOString()}`);

  try {
    console.log(`[Appwrite Client] Creating user account...`);
    const user = await account.create("unique()", email, password, name);
    console.log(`[Appwrite Client] ✓ User created: ${user.$id}`);

    // Auto sign in after registration
    console.log(`[Appwrite Client] Auto-signing in...`);
    await signIn(email, password);
    console.log(`[Appwrite Client] ✓ Sign up complete in ${Date.now() - startTime}ms`);
    return { success: true, user };
  } catch (error: any) {
    console.log(`[Appwrite Client] ❌ Sign up failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

// Sign out
export async function signOut() {
  const startTime = Date.now();
  console.log(`[Appwrite Client] signOut called at ${new Date().toISOString()}`);

  try {
    // Clear JWT cache before signing out
    clearJWTCache();
    console.log(`[Appwrite Client] Deleting session...`);
    await account.deleteSession("current");
    console.log(`[Appwrite Client] ✓ Signed out in ${Date.now() - startTime}ms`);
    return { success: true };
  } catch (error: any) {
    console.log(`[Appwrite Client] ❌ Sign out failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}
