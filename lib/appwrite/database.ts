import { ID, Query } from "appwrite";
import { databases } from "./client";
import { appwriteConfig } from "./config";
import type { Chat, Message } from "@/types";

// Chat operations
export async function createChat(userId: string, title: string) {
  try {
    const chat = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      ID.unique(),
      {
        userId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    return { success: true, chat };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserChats(userId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      [
        Query.equal("userId", userId),
        Query.orderDesc("updatedAt"),
        Query.limit(100),
      ]
    );
    return { success: true, chats: response.documents as unknown as Chat[] };
  } catch (error: any) {
    return { success: false, error: error.message, chats: [] };
  }
}

export async function updateChatTitle(chatId: string, title: string) {
  try {
    const chat = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      chatId,
      {
        title,
        updatedAt: new Date().toISOString(),
      }
    );
    return { success: true, chat };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChat(chatId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      chatId
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Message operations
export async function createMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  files?: any[]
) {
  try {
    const message = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      ID.unique(),
      {
        chatId,
        role,
        content,
        files: files ? JSON.stringify(files) : null,
        createdAt: new Date().toISOString(),
      }
    );
    return { success: true, message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getChatMessages(chatId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      [
        Query.equal("chatId", chatId),
        Query.orderAsc("createdAt"),
        Query.limit(1000),
      ]
    );
    return {
      success: true,
      messages: response.documents as unknown as Message[],
    };
  } catch (error: any) {
    return { success: false, error: error.message, messages: [] };
  }
}
