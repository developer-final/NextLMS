import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Admin Coupons GET Error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách mã giảm giá" }, { status: 500 });
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
    const {
      id,
      code,
      discountType,
      discountValue,
      maxUsage,
      minOrderValue,
      expiresAt,
      isActive,
    } = body;

    if (!code || !discountValue) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã giảm giá và mức giảm" },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();

    if (id) {
      // Update existing coupon
      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          code: cleanCode,
          discountType: discountType || "PERCENT",
          discountValue: parseFloat(discountValue),
          maxUsage: parseInt(maxUsage, 10) || 100,
          minOrderValue: parseFloat(minOrderValue) || 0,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Cập nhật mã giảm giá thành công!",
        coupon: updated,
      });
    } else {
      // Check if code already exists
      const existing = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Mã giảm giá này đã tồn tại trên hệ thống" },
          { status: 409 }
        );
      }

      const created = await prisma.coupon.create({
        data: {
          code: cleanCode,
          discountType: discountType || "PERCENT",
          discountValue: parseFloat(discountValue),
          maxUsage: parseInt(maxUsage, 10) || 100,
          minOrderValue: parseFloat(minOrderValue) || 0,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Tạo mã giảm giá mới thành công!",
        coupon: created,
      });
    }
  } catch (error: any) {
    console.error("Admin Coupon Save Error:", error);
    return NextResponse.json({ error: "Lỗi lưu mã giảm giá" }, { status: 500 });
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
      return NextResponse.json({ error: "Thiếu ID mã giảm giá" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa mã giảm giá thành công!",
    });
  } catch (error: any) {
    console.error("Admin Coupon DELETE Error:", error);
    return NextResponse.json({ error: "Lỗi xóa mã giảm giá" }, { status: 500 });
  }
}
