import { ID, Query } from "appwrite";
import { databases } from "./client";
import { appwriteConfig } from "./config";
import type { Chat, Message } from "@/types";

// Chat operations
export async function createChat(userId: string, chatId?: string, title: string = "Nouvelle conversation") {
  try {
    const chat = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      chatId || ID.unique(),
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
  messageId?: string,
  files?: any[]
) {
  try {
    const message = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      messageId || ID.unique(),
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

// Update an existing message's content
export async function updateMessage(
  messageId: string,
  content: string
) {
  try {
    const message = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      messageId,
      {
        content,
      }
    );
    return { success: true, message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create or update a message (upsert)
export async function createOrUpdateMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  messageId: string,
  files?: any[]
) {
  try {
    // First try to update
    const updateResult = await updateMessage(messageId, content);
    if (updateResult.success) {
      return updateResult;
    }

    // If update failed (message doesn't exist), create it
    return await createMessage(chatId, role, content, messageId, files);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getChatMessages(chatId: string, limit: number = 50) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      [
        Query.equal("chatId", chatId),
        Query.orderDesc("createdAt"), // Récupère les plus récents d'abord
        Query.limit(limit),
      ]
    );
    // Inverse l'ordre pour avoir chronologique (ancien -> récent)
    const messages = (response.documents as unknown as Message[]).reverse();
    return {
      success: true,
      messages,
    };
  } catch (error: any) {
    return { success: false, error: error.message, messages: [] };
  }
}
