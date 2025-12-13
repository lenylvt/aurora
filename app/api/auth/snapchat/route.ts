import { NextRequest, NextResponse } from "next/server";
import {
  generateState,
  generatePKCEPair,
  getAuthorizationUrl,
} from "@/lib/snapchat/oauth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!;
    const state = generateState();
    const { codeVerifier, codeChallenge } = generatePKCEPair();

    // Store state and code_verifier in cookies for verification in callback
    const cookieStore = await cookies();
    cookieStore.set("snapchat_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set("snapchat_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    const authUrl = getAuthorizationUrl(redirectUri, state, codeChallenge);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Snapchat OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
