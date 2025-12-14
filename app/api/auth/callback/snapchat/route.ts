import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/lib/snapchat/oauth";
import { createAdminClient } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=snapchat_${error}`, request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=missing_parameters", request.url)
    );
  }

  try {
    // Verify state parameter and get code_verifier
    const cookieStore = await cookies();
    const savedState = cookieStore.get("snapchat_oauth_state")?.value;
    const codeVerifier = cookieStore.get("snapchat_code_verifier")?.value;

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL("/login?error=missing_verifier", request.url)
      );
    }

    // Clear state and code_verifier cookies
    cookieStore.delete("snapchat_oauth_state");
    cookieStore.delete("snapchat_code_verifier");

    // Exchange code for tokens
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!;
    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);

    // Get user info from Snapchat
    const userInfo = await getUserInfo(tokens.access_token);
    const snapchatUser = userInfo.data.me;

    // Initialize Appwrite server client
    const { users } = createAdminClient();

    // Create a unique email based on Snapchat external ID
    const email = `snapchat_${snapchatUser.externalId}@aurora.app`;

    // Generate a secure random password
    const password = crypto.randomBytes(32).toString("hex");

    let userId: string;

    try {
      // Try to find existing user by searching for label
      const existingUsers = await users.list([
        Query.equal("email", email),
      ]);

      if (existingUsers.users.length > 0) {
        userId = existingUsers.users[0].$id;

        // Update user password in case we need to auto-login
        await users.updatePassword(userId, password);
      } else {
        // Create new user
        const newUser = await users.create(
          ID.unique(),
          email,
          undefined, // phone
          password,
          snapchatUser.displayName
        );

        userId = newUser.$id;

        // Add Snapchat metadata as labels or preferences
        await users.updateLabels(userId, ["snapchat"]);

        // Store Snapchat data in prefs
        await users.updatePrefs(userId, {
          snapchatExternalId: snapchatUser.externalId,
          snapchatAvatar: snapchatUser.bitmoji?.avatar,
          authProvider: "snapchat",
        });
      }

      // Create a session token by setting credentials in cookie
      // This will be used by the client to auto-login
      cookieStore.set("snapchat_login_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60, // 1 minute
        path: "/",
      });

      cookieStore.set("snapchat_login_password", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60, // 1 minute
        path: "/",
      });

      // Redirect to login page which will auto-login
      return NextResponse.redirect(new URL("/login?snapchat_auth=success", request.url));
    } catch (error: any) {
      console.error("Appwrite user creation/update error:", error);
      return NextResponse.redirect(
        new URL("/login?error=user_creation_failed", request.url)
      );
    }
  } catch (error) {
    console.error("Snapchat OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_callback_failed", request.url)
    );
  }
}
