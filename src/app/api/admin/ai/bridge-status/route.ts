import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevEnvironment, getDevBridgeStats } from "@/lib/ai/dev-bridge";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN" &&
        user.role !== "INSTRUCTOR")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDevEnvironment()) {
      return NextResponse.json({
        isDev: false,
        running: false,
        pendingCount: 0,
        completedCount: 0,
        message: "Dev Bridge is disabled in production environment.",
      });
    }

    const stats = getDevBridgeStats();

    return NextResponse.json({
      isDev: true,
      ...stats,
    });
  } catch (error: any) {
    console.error("Dev Bridge status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Dev Bridge status" },
      { status: 500 }
    );
  }
}
