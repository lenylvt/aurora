// Mini Apps Database Configuration
// Settings are stored in aurora-db (main database)
// Mini App Français data is stored in miniapp-francais-db
// Mini App Code data is stored in miniapp-code-db

// Aurora DB (main) - includes mini apps settings
export const auroraConfig = {
    databaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
    collections: {
        settings: process.env.NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID!,
    },
};

// Mini App Français DB - Analyse Linéaire specific data
export const miniappFrancaisConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID!,
    collections: {
        poems: process.env.NEXT_PUBLIC_POEMS_COLLECTION_ID!,
        analyses: process.env.NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID!,
        results: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID!,
    },
};

// Mini App Code DB - IDE code files
export const miniappCodeConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_CODE_DATABASE_ID!,
    collections: {
        codeFiles: process.env.NEXT_PUBLIC_CODE_FILES_COLLECTION_ID!,
    },
};

// Legacy alias for backward compatibility
export const miniappsConfig = {
    databaseId: process.env.NEXT_PUBLIC_MINIAPP_FRANCAIS_DATABASE_ID!,
    settingsDatabaseId: process.env.NEXT_PUBLIC_DATABASE_ID!,
    collections: {
        settings: process.env.NEXT_PUBLIC_MINIAPPS_SETTINGS_COLLECTION_ID!,
        poems: process.env.NEXT_PUBLIC_POEMS_COLLECTION_ID!,
        analyses: process.env.NEXT_PUBLIC_USER_ANALYSES_COLLECTION_ID!,
        results: process.env.NEXT_PUBLIC_USER_RESULTS_COLLECTION_ID!,
    },
};

