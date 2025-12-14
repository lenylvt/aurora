import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

    // Return credentials to client for client-side session creation
    return NextResponse.json({
      success: true,
      email,
      password
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
