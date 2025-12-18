// Mini Apps Database Configuration
export const miniappsConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPPS_DATABASE_ID!,
    collections: {
        settings: process.env.NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID!,
        poems: process.env.NEXT_PUBLIC_POEMS_COLLECTION_ID!,
        analyses: process.env.NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID!,
        results: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID!,
    },
};
