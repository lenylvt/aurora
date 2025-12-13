import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/appwrite/server";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("snapchat_login_email")?.value;
    const password = cookieStore.get("snapchat_login_password")?.value;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { status: 400 }
      );
    }

    // Clear the temporary cookies
    cookieStore.delete("snapchat_login_email");
    cookieStore.delete("snapchat_login_password");

    // Create session using Appwrite server SDK
    const { account } = createServerClient();

    try {
      const session = await account.createEmailPasswordSession(email, password);

      // Set the session cookie
      cookieStore.set(
        `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`,
        session.secret,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: session.expire ? new Date(session.expire).getTime() - Date.now() : 86400000,
          path: "/",
        }
      );

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Session creation error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
