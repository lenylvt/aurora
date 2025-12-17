import { Client, Account, Users, Databases, Query } from "node-appwrite";
import { appwriteConfig } from "./config";

// Create admin client with API key
function createAdminClient() {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpoint)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.apiKey!);

    return {
        client,
        account: new Account(client),
        users: new Users(client),
        databases: new Databases(client),
    };
}

// Verify admin access by checking JWT and admin label
export async function verifyAdminAccess(jwt: string) {
    try {
        // Create client with JWT to get the user
        const client = new Client()
            .setEndpoint(appwriteConfig.endpoint)
            .setProject(appwriteConfig.projectId)
            .setJWT(jwt);

        const account = new Account(client);
        const user = await account.get();

        // Check if user has admin label
        if (!user.labels || !user.labels.includes("admin")) {
            return null;
        }

        return user;
    } catch (error) {
        return null;
    }
}

// ============================================
// User Management Functions
// ============================================

export async function listAllUsers(options?: {
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const { users } = createAdminClient();
    const queries: string[] = [];

    if (options?.limit) {
        queries.push(Query.limit(options.limit));
    }
    if (options?.offset) {
        queries.push(Query.offset(options.offset));
    }

    const result = await users.list({
        queries: queries.length > 0 ? queries : undefined,
        search: options?.search || undefined,
    });

    return result;
}

export async function getUserById(userId: string) {
    const { users } = createAdminClient();
    const user = await users.get({ userId });
    return user;
}

export async function updateUser(
    userId: string,
    data: {
        name?: string;
        email?: string;
        labels?: string[];
        status?: boolean;
    }
) {
    const { users } = createAdminClient();

    if (data.name !== undefined) {
        await users.updateName({ userId, name: data.name });
    }

    if (data.email !== undefined) {
        await users.updateEmail({ userId, email: data.email });
    }

    if (data.labels !== undefined) {
        await users.updateLabels({ userId, labels: data.labels });
    }

    if (data.status !== undefined) {
        await users.updateStatus({ userId, status: data.status });
    }

    // Return updated user
    return await users.get({ userId });
}

export async function deleteUser(userId: string) {
    const { users } = createAdminClient();
    await users.delete({ userId });
}

// ============================================
// Chat/Conversation Management Functions
// ============================================

export async function listAllChats(options?: {
    search?: string;
    userId?: string;
    limit?: number;
    offset?: number;
}) {
    const { databases } = createAdminClient();
    const queries: string[] = [];

    if (options?.userId) {
        queries.push(Query.equal("userId", options.userId));
    }
    if (options?.search) {
        queries.push(Query.search("title", options.search));
    }
    if (options?.limit) {
        queries.push(Query.limit(options.limit));
    }
    if (options?.offset) {
        queries.push(Query.offset(options.offset));
    }

    queries.push(Query.orderDesc("updatedAt"));

    const result = await databases.listDocuments({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.chats,
        queries,
    });

    return result;
}

export async function getChatById(chatId: string) {
    const { databases } = createAdminClient();
    const chat = await databases.getDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.chats,
        documentId: chatId,
    });
    return chat;
}

export async function getChatWithMessages(chatId: string) {
    const { databases } = createAdminClient();

    // Get the chat
    const chat = await databases.getDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.chats,
        documentId: chatId,
    });

    // Get all messages for this chat
    const messages = await databases.listDocuments({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.messages,
        queries: [
            Query.equal("chatId", chatId),
            Query.orderAsc("createdAt"),
            Query.limit(1000), // Get all messages
        ],
    });

    return {
        chat,
        messages: messages.documents,
    };
}

export async function deleteChat(chatId: string) {
    const { databases } = createAdminClient();

    // First delete all messages in this chat
    const messages = await databases.listDocuments({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.messages,
        queries: [Query.equal("chatId", chatId), Query.limit(1000)],
    });

    // Delete each message
    for (const message of messages.documents) {
        await databases.deleteDocument({
            databaseId: appwriteConfig.databaseId,
            collectionId: appwriteConfig.collections.messages,
            documentId: message.$id,
        });
    }

    // Then delete the chat itself
    await databases.deleteDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.chats,
        documentId: chatId,
    });
}

// ============================================
// Message Management Functions
// ============================================

export async function deleteMessage(messageId: string) {
    const { databases } = createAdminClient();
    await databases.deleteDocument({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.messages,
        documentId: messageId,
    });
}

// ============================================
// Stats Functions
// ============================================

export async function getAdminStats() {
    const { users, databases } = createAdminClient();

    const [usersResult, chatsResult, messagesResult] = await Promise.all([
        users.list({ queries: [Query.limit(1)] }),
        databases.listDocuments({
            databaseId: appwriteConfig.databaseId,
            collectionId: appwriteConfig.collections.chats,
            queries: [Query.limit(1)],
        }),
        databases.listDocuments({
            databaseId: appwriteConfig.databaseId,
            collectionId: appwriteConfig.collections.messages,
            queries: [Query.limit(1)],
        }),
    ]);

    return {
        totalUsers: usersResult.total,
        totalChats: chatsResult.total,
        totalMessages: messagesResult.total,
    };
}
