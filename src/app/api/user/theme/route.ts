import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTheme, ThemeId } from "@/lib/theme";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/theme
 * Returns current user's saved theme preference from database
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });

    return NextResponse.json({
      success: true,
      theme: (user?.theme as ThemeId) || "emerald",
    });
  } catch (error) {
    console.error("GET /api/user/theme error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve theme preference" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/theme
 * Updates logged-in user's theme preference in the database
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { theme } = body;

    if (!isValidTheme(theme)) {
      return NextResponse.json(
        { error: "Invalid theme identifier" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
      select: { id: true, theme: true },
    });

    return NextResponse.json({
      success: true,
      theme: updatedUser.theme,
    });
  } catch (error) {
    console.error("PATCH /api/user/theme error:", error);
    return NextResponse.json(
      { error: "Failed to update theme preference" },
      { status: 500 }
    );
  }
}
