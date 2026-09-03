import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { sanitizePlainText } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Admin Categories GET Error:", error);
    return NextResponse.json({ error: "Error loading categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, icon, orderIndex, isActive } = body;

    const cleanName = sanitizePlainText(name, 100);
    if (!cleanName) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanDescription =
      description !== undefined && description !== null
        ? sanitizePlainText(description, 500) || null
        : null;

    const slug = slugify(cleanName);

    if (id) {
      // Update — keep existing slug stable to avoid breaking URLs
      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: cleanName,
          description: cleanDescription,
          icon: icon || "BookOpen",
          orderIndex: parseInt(orderIndex, 10) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Category updated successfully!",
        category: updated,
      });
    } else {
      // Create new
      const existing = await prisma.category.findUnique({
        where: { slug },
      });

      const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

      const created = await prisma.category.create({
        data: {
          name: cleanName,
          slug: finalSlug,
          description: cleanDescription,
          icon: icon || "BookOpen",
          orderIndex: parseInt(orderIndex, 10) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Category created successfully!",
        category: created,
      });
    }
  } catch (error: any) {
    console.error("Admin Category Save Error:", error);
    return NextResponse.json({ error: "Error saving category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully!",
    });
  } catch (error: any) {
    console.error("Admin Category DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
  }
}
