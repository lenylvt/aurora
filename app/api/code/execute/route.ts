import { NextRequest, NextResponse } from "next/server";

const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

interface ExecuteRequest {
    language: string;
    code: string;
}

interface PistonResponse {
    run: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
    compile?: {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
    };
}

// Language version mapping
const LANGUAGE_VERSIONS: Record<string, string> = {
    python: "3.10.0",
    javascript: "18.15.0",
    typescript: "5.0.3",
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ExecuteRequest;
        const { language, code } = body;

        if (!code || !language) {
            return NextResponse.json(
                { error: "Code et langage requis" },
                { status: 400 }
            );
        }

        const version = LANGUAGE_VERSIONS[language] || "3.10.0";

        // Call Piston API
        const response = await fetch(PISTON_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                version,
                files: [
                    {
                        name: language === "python" ? "main.py" : "main.js",
                        content: code,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Code Execute] Piston API error:", errorText);
            return NextResponse.json(
                { error: "Erreur lors de l'exécution du code" },
                { status: 500 }
            );
        }

        const result = (await response.json()) as PistonResponse;

        // Check for compilation errors
        if (result.compile?.stderr) {
            return NextResponse.json({
                stdout: result.compile.stdout || "",
                stderr: result.compile.stderr,
                exitCode: result.compile.code,
            });
        }

        return NextResponse.json({
            stdout: result.run.stdout || "",
            stderr: result.run.stderr || "",
            exitCode: result.run.code,
        });
    } catch (error) {
        console.error("[Code Execute] Error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Erreur inconnue",
            },
            { status: 500 }
        );
    }
}
