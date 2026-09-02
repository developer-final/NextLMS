import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
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
    return NextResponse.json({ error: "Lỗi tải danh mục" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, icon, orderIndex, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên danh mục là bắt buộc" }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = slugify(cleanName);

    if (id) {
      // Update
      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: cleanName,
          slug,
          description: description?.trim() || null,
          icon: icon || "BookOpen",
          orderIndex: parseInt(orderIndex, 10) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Cập nhật danh mục thành công!",
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
          description: description?.trim() || null,
          icon: icon || "BookOpen",
          orderIndex: parseInt(orderIndex, 10) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Tạo danh mục mới thành công!",
        category: created,
      });
    }
  } catch (error: any) {
    console.error("Admin Category Save Error:", error);
    return NextResponse.json({ error: "Lỗi lưu danh mục" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID danh mục" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa danh mục thành công!",
    });
  } catch (error: any) {
    console.error("Admin Category DELETE Error:", error);
    return NextResponse.json({ error: "Lỗi xóa danh mục" }, { status: 500 });
  }
}
