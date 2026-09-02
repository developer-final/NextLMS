import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, courseId } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { error: "Mã giảm giá không tồn tại hoặc đã hết hiệu lực" },
        { status: 404 }
      );
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn sử dụng" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json(
        { error: "Mã giảm giá đã đạt giới hạn số lượt sử dụng" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error: any) {
    console.error("Coupon Error:", error);
    return NextResponse.json({ error: "Không thể áp dụng mã giảm giá" }, { status: 500 });
  }
}
