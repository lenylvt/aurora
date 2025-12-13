export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
  collections: {
    chats: process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID!,
    messages: process.env.NEXT_PUBLIC_MESSAGES_COLLECTION_ID!,
  },
};
