import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    const redirectUrl = new URL("/connections", process.env.NEXT_PUBLIC_APP_URL);

    if (status === "success") {
      redirectUrl.searchParams.set("success", "true");
    } else if (error) {
      redirectUrl.searchParams.set("error", error);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/connections?error=callback_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}