import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/composio/client";
import { getCurrentUser } from "@/lib/appwrite/client";

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolkit } = await req.json();

    if (!toolkit) {
      return NextResponse.json(
        { error: "Toolkit is required" },
        { status: 400 }
      );
    }

    // Get the authentication URL
    const authUrl = await getAuthUrl(user.$id, toolkit);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error initiating OAuth:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}
