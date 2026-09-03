import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const whereClause: any = {};
    if (q) {
      whereClause.name = { contains: q, mode: "insensitive" };
    }

    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { posts: true, courses: true },
        },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error("Tags API Error:", error);
    return NextResponse.json({ error: "Error loading tags" }, { status: 500 });
  }
}
