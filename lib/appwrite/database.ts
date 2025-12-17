import { ID, Query } from "appwrite";
import { databases } from "./client";
import { appwriteConfig } from "./config";
import type { Chat, Message } from "@/types";

// Chat operations
export async function createChat(userId: string, chatId?: string, title: string = "Nouvelle conversation") {
  const startTime = Date.now();
  const finalChatId = chatId || ID.unique();
  console.log(`[Database] createChat called at ${new Date().toISOString()}`);
  console.log(`[Database] User: ${userId}, ChatId: ${finalChatId}, Title: "${title}"`);

  try {
    const chat = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      finalChatId,
      {
        userId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    console.log(`[Database] ✓ Chat created: ${chat.$id} in ${Date.now() - startTime}ms`);
    return { success: true, chat };
  } catch (error: any) {
    console.log(`[Database] ❌ createChat failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

export async function getUserChats(userId: string) {
  const startTime = Date.now();
  console.log(`[Database] getUserChats called for user: ${userId}`);

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
    console.log(`[Database] ✓ Found ${response.documents.length} chats in ${Date.now() - startTime}ms`);
    return { success: true, chats: response.documents as unknown as Chat[] };
  } catch (error: any) {
    console.log(`[Database] ❌ getUserChats failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message, chats: [] };
  }
}

export async function updateChatTitle(chatId: string, title: string) {
  const startTime = Date.now();
  console.log(`[Database] updateChatTitle called for chat: ${chatId}`);
  console.log(`[Database] New title: "${title}"`);

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
    console.log(`[Database] ✓ Chat title updated in ${Date.now() - startTime}ms`);
    return { success: true, chat };
  } catch (error: any) {
    console.log(`[Database] ❌ updateChatTitle failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

export async function deleteChat(chatId: string) {
  const startTime = Date.now();
  console.log(`[Database] deleteChat called for chat: ${chatId}`);

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.chats,
      chatId
    );
    console.log(`[Database] ✓ Chat deleted in ${Date.now() - startTime}ms`);
    return { success: true };
  } catch (error: any) {
    console.log(`[Database] ❌ deleteChat failed: ${error.message} (${Date.now() - startTime}ms)`);
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
  const startTime = Date.now();
  const finalMessageId = messageId || ID.unique();
  console.log(`[Database] createMessage called at ${new Date().toISOString()}`);
  console.log(`[Database] Chat: ${chatId}, Role: ${role}, MessageId: ${finalMessageId}`);
  console.log(`[Database] Content length: ${content.length} chars, Files: ${files?.length || 0}`);

  try {
    const message = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      finalMessageId,
      {
        chatId,
        role,
        content,
        files: files ? JSON.stringify(files) : null,
        createdAt: new Date().toISOString(),
      }
    );
    console.log(`[Database] ✓ Message created: ${message.$id} in ${Date.now() - startTime}ms`);
    return { success: true, message };
  } catch (error: any) {
    console.log(`[Database] ❌ createMessage failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

// Update an existing message's content
export async function updateMessage(
  messageId: string,
  content: string
) {
  const startTime = Date.now();
  console.log(`[Database] updateMessage called for message: ${messageId}`);
  console.log(`[Database] New content length: ${content.length} chars`);

  try {
    const message = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.messages,
      messageId,
      {
        content,
      }
    );
    console.log(`[Database] ✓ Message updated in ${Date.now() - startTime}ms`);
    return { success: true, message };
  } catch (error: any) {
    console.log(`[Database] ❌ updateMessage failed: ${error.message} (${Date.now() - startTime}ms)`);
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
  const startTime = Date.now();
  console.log(`[Database] createOrUpdateMessage called (upsert)`);
  console.log(`[Database] Chat: ${chatId}, MessageId: ${messageId}, Role: ${role}`);

  try {
    // First try to update
    console.log(`[Database] Attempting update first...`);
    const updateResult = await updateMessage(messageId, content);
    if (updateResult.success) {
      console.log(`[Database] ✓ Message updated (upsert) in ${Date.now() - startTime}ms`);
      return updateResult;
    }

    // If update failed (message doesn't exist), create it
    console.log(`[Database] Update failed, creating new message...`);
    const createResult = await createMessage(chatId, role, content, messageId, files);
    console.log(`[Database] ✓ Message created (upsert) in ${Date.now() - startTime}ms`);
    return createResult;
  } catch (error: any) {
    console.log(`[Database] ❌ createOrUpdateMessage failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message };
  }
}

export async function getChatMessages(chatId: string, limit: number = 50) {
  const startTime = Date.now();
  console.log(`[Database] getChatMessages called for chat: ${chatId} (limit: ${limit})`);

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
    console.log(`[Database] ✓ Found ${messages.length} messages in ${Date.now() - startTime}ms`);
    return {
      success: true,
      messages,
    };
  } catch (error: any) {
    console.log(`[Database] ❌ getChatMessages failed: ${error.message} (${Date.now() - startTime}ms)`);
    return { success: false, error: error.message, messages: [] };
  }
}
