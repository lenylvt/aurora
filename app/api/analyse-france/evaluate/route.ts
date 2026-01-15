import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createResultServer } from "@/lib/appwrite/miniapps/results-server";
import type { AIEvaluation } from "@/types/miniapps";

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

interface StudentAnalysis {
    selectedWords: string[];
    analysis: string;
}

interface EvaluateRequest {
    userId: string;
    poem: {
        id: string;
        title: string;
        author: string;
        fullText: string;
    };
    analyses: StudentAnalysis[];
    mode: "complete" | "quick";
}

const EVALUATION_PROMPT = `Tu es un professeur de français expert en analyse littéraire pour le BAC français. 
Tu dois évaluer les analyses d'un élève sur un poème.

Pour chaque analyse:
1. Donne une note sur 20 (sois exigeant mais juste)
2. Donne un feedback constructif et encourageant
3. Liste les points forts (max 3)
4. Liste les points à améliorer (max 3)

Réponds en JSON avec ce format exact:
{
  "evaluations": [
    {
      "score": <number 0-20>,
      "feedback": "<feedback constructif>",
      "strengths": ["<point fort 1>", "<point fort 2>"],
      "missedPoints": ["<point à améliorer 1>", "<point à améliorer 2>"]
    }
  ],
  "globalAnalysis": "<analyse globale et conseils pour progresser>"
}`;

export async function POST(request: Request) {
    try {
        const body: EvaluateRequest = await request.json();
        const { userId, poem, analyses, mode } = body;

        if (!userId || !poem || !analyses || analyses.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        console.log("[Evaluate] Starting evaluation for user:", userId);
        console.log("[Evaluate] Poem:", poem.title, "with", analyses.length, "analyses");

        // Build the prompt with poem and analyses
        const userContent = `
POÈME: "${poem.title}" de ${poem.author}

TEXTE DU POÈME:
${poem.fullText}

ANALYSES DE L'ÉLÈVE:
${analyses
                .map(
                    (a, i) => `
--- Analyse ${i + 1} ---
Mots sélectionnés: ${a.selectedWords.length > 0 ? a.selectedWords.join(", ") : "(analyse générale)"}
Analyse: ${a.analysis}
`
                )
                .join("\n")}

Évalue chaque analyse et donne un feedback global.`;

        // Call OpenRouter via Vercel AI SDK
        const result = await generateText({
            model: openrouter("tngtech/deepseek-r1t2-chimera:free") as any,
            system: EVALUATION_PROMPT,
            prompt: userContent,
            temperature: 0.3,
        });

        console.log("[Evaluate] AI response received");

        // Parse the AI response
        let parsedResponse: {
            evaluations: AIEvaluation[];
            globalAnalysis: string;
        };

        try {
            // Try to extract JSON from the response
            const text = result.text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log("[Evaluate] Parsed", parsedResponse.evaluations.length, "evaluations");
        } catch (parseError) {
            console.error("[Evaluate] Error parsing AI response:", parseError);
            console.error("[Evaluate] Raw response:", result.text);

            // Fallback: create default evaluations
            parsedResponse = {
                evaluations: analyses.map(() => ({
                    score: 10,
                    feedback: "Évaluation non disponible. Réessayez plus tard.",
                    strengths: [],
                    missedPoints: [],
                })),
                globalAnalysis: "Une erreur s'est produite lors de l'évaluation.",
            };
        }

        // Add global analysis to first evaluation
        if (parsedResponse.evaluations.length > 0 && parsedResponse.globalAnalysis) {
            parsedResponse.evaluations[0].analysis = parsedResponse.globalAnalysis;
        }

        // Calculate average score
        const averageScore =
            parsedResponse.evaluations.reduce((sum, e) => sum + e.score, 0) /
            parsedResponse.evaluations.length;

        // Parse stanzas count from fullText
        const stanzaCount = poem.fullText.split(/\n\s*\n/).filter((s) => s.trim()).length;

        // Save result to database (server-side with admin privileges)
        console.log("[Evaluate] Saving result to database...");
        const savedResult = await createResultServer({
            userId,
            poemId: poem.id,
            poemTitle: poem.title,
            poemAuthor: poem.author,
            mode,
            totalStanzas: stanzaCount,
            averageScore: Math.round(averageScore * 10) / 10,
            evaluations: parsedResponse.evaluations,
            studentAnalyses: analyses, // Include student input
        });

        if (!savedResult) {
            console.error("[Evaluate] Failed to save result to DB");
        } else {
            console.log("[Evaluate] ✓ Result saved:", savedResult.$id);
        }

        // Merge student input into evaluations for response
        const evaluationsWithStudentInput = parsedResponse.evaluations.map((evaluation, index) => ({
            ...evaluation,
            studentInput: analyses[index] || null,
        }));

        return NextResponse.json({
            $id: savedResult?.$id || "temp",
            userId,
            poemId: poem.id,
            poemTitle: poem.title,
            poemAuthor: poem.author,
            mode,
            totalStanzas: stanzaCount,
            averageScore: Math.round(averageScore * 10) / 10,
            evaluations: evaluationsWithStudentInput,
            createdAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("[Evaluate] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
