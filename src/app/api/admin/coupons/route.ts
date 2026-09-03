import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCouponInput } from "@/lib/validation";

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

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Admin Coupons GET Error:", error);
    return NextResponse.json({ error: "Error loading coupons" }, { status: 500 });
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
    const validation = validateCouponInput(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

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
        message: "Coupon updated successfully!",
        coupon: updated,
      });
    } else {
      // Check if code already exists
      const existing = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This coupon code already exists" },
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
        message: "Coupon created successfully!",
        coupon: created,
      });
    }
  } catch (error: any) {
    console.error("Admin Coupon Save Error:", error);
    return NextResponse.json({ error: "Error saving coupon" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully!",
    });
  } catch (error: any) {
    console.error("Admin Coupon DELETE Error:", error);
    return NextResponse.json({ error: "Error deleting coupon" }, { status: 500 });
  }
}
