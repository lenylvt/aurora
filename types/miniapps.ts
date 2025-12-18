// Mini Apps Types

// Registered Mini Apps
export type MiniAppId = "analyse-france" | "code";

export interface MiniApp {
    id: MiniAppId;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    color: string; // Tailwind color class
}

// User settings for a mini app
export interface MiniAppSettings {
    $id: string;
    userId: string;
    miniAppId: MiniAppId;
    enabled: boolean;
    showInSidebar: boolean;
    hasSeenWelcome: boolean;
}

// Poem structure
export interface Stanza {
    lines: string[];
}

export interface Poem {
    $id: string;
    title: string;
    author: string;
    fullText: string;
    analyses?: string; // AI-provided analysis markdown
    stanzas: Stanza[]; // Parsed from fullText
}

// Raw poem document from DB
export interface PoemDocument {
    $id: string;
    title: string;
    author: string;
    fullText: string;
    analyses?: string;
}

// User analysis (in-progress)
export interface UserAnalysis {
    $id: string;
    userId: string;
    poemId: string;
    poemTitle: string;
    stanzaId: number;
    selectedWords: string[]; // Parsed from JSON
    analysis: string;
    completed: boolean;
    createdAt: string;
}

// Raw document from DB
export interface UserAnalysisDocument {
    $id: string;
    $createdAt: string;
    userId: string;
    poemId: string;
    poemTitle: string;
    stanzaId: number;
    selectedWords: string; // JSON string
    analysis: string;
    completed: boolean;
    createdAt: string;
}

// AI Evaluation for a single analysis
export interface AIEvaluation {
    score: number; // 0-20
    feedback: string;
    strengths: string[];
    missedPoints: string[];
    analysis?: string; // Full AI analysis markdown
    studentInput?: {
        selectedWords: string[];
        analysis: string;
    } | null;
}

// User's answer for a stanza
export interface UserAnswer {
    selectedWords: string[];
    analysis: string;
}

// Complete result of an evaluation session
export interface UserResult {
    $id: string;
    userId: string;
    poemId: string;
    poemTitle: string;
    poemAuthor: string;
    mode: "complete" | "quick";
    totalStanzas: number;
    averageScore: number;
    evaluations: AIEvaluation[]; // Parsed from JSON
    createdAt: string;
}

// Raw document from DB
export interface UserResultDocument {
    $id: string;
    $createdAt: string;
    userId: string;
    poemId: string;
    poemTitle: string;
    poemAuthor: string;
    mode: "complete" | "quick";
    totalStanzas: number;
    averageScore: number;
    evaluations: string; // JSON string
    createdAt: string;
}

// Mini Apps Registry
export const MINI_APPS: Record<MiniAppId, MiniApp> = {
    "analyse-france": {
        id: "analyse-france",
        name: "Analyse Linéaire",
        description: "Analyse linéaire de poèmes pour le BAC Français",
        icon: "BookOpen",
        color: "text-blue-500",
    },
    "code": {
        id: "code",
        name: "Code",
        description: "IDE en ligne avec exécution Python",
        icon: "Code2",
        color: "text-emerald-500",
    },
};
