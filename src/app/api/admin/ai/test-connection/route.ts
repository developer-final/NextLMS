import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { testProviderConnection } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { provider, apiKey, model, devMockEnabled } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const result = await testProviderConnection(
      provider,
      apiKey,
      model,
      devMockEnabled
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test connection" },
      { status: 500 }
    );
  }
}
