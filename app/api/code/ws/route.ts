import { NextRequest } from "next/server";

// WebSocket endpoint for Piston (self-hosted only)
// This enables real-time interactive execution with stdin/stdout streaming
//
// Usage:
// 1. Self-host Piston with Docker
// 2. Set PISTON_WS_URL in .env (e.g., ws://localhost:2000/api/v2/connect)
// 3. Client connects to this endpoint and proxies to Piston WebSocket

const PISTON_WS_URL = process.env.PISTON_WS_URL;

export async function GET(request: NextRequest) {
    // This endpoint is for documentation purposes
    // WebSocket connections in Next.js require custom server setup or Edge runtime
    // For now, return the Piston WebSocket URL for direct client connection

    if (!PISTON_WS_URL) {
        return new Response(
            JSON.stringify({
                error: "WebSocket non disponible",
                message: "PISTON_WS_URL non configuré. Utilisez l'API REST pour l'exécution.",
                hint: "Pour activer l'exécution interactive, configurez PISTON_WS_URL dans .env",
            }),
            {
                status: 501,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return new Response(
        JSON.stringify({
            pistonWsUrl: PISTON_WS_URL,
            message: "Connectez-vous directement à l'URL WebSocket Piston",
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
}
