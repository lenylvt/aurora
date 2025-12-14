import { NextRequest, NextResponse } from "next/server";
import { getUserConnections, disconnectAccount } from "@/lib/composio/client";
import { getCurrentUserServer } from "@/lib/appwrite/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await getUserConnections(user.$id);

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("Error getting connections:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get connections" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await req.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    await disconnectAccount(user.$id, connectionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error disconnecting account:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}