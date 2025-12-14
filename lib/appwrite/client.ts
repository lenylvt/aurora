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

// Get current session JWT token
export async function getSessionJWT() {
  try {
    const jwt = await account.createJWT();
    return jwt.jwt;
  } catch (error) {
    console.error("Error creating JWT:", error);
    return null;
  }
}

// Sign in with email
export async function signIn(email: string, password: string) {
  try {
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
    await account.deleteSession("current");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
