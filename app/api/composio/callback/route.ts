import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log(`[Composio Callback] GET request at ${new Date().toISOString()}`);

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const error = searchParams.get("error");
    console.log(`[Composio Callback] Status: ${status}, Error: ${error || 'none'}`);

    const redirectUrl = new URL("/chat", process.env.NEXT_PUBLIC_APP_URL);

    if (status === "success") {
      redirectUrl.searchParams.set("success", "true");
      console.log(`[Composio Callback] ✓ Success, redirecting to chat`);
    } else if (error) {
      redirectUrl.searchParams.set("error", error);
      console.log(`[Composio Callback] ❌ Error: ${error}`);
    }

    console.log(`[Composio Callback] Redirecting to: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error(`[Composio Callback] ❌ Error: ${error.message}`);
    return NextResponse.redirect(
      new URL("/chat?error=callback_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}