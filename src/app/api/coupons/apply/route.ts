import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCoupon, calculateOrderPricing } from "@/lib/billing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to use a discount coupon" },
        { status: 401 }
      );
    }

    const { code, courseId } = await req.json();

    if (!code?.trim()) {
      return NextResponse.json(
        { error: "Please enter a coupon code" },
        { status: 400 }
      );
    }

    let coursePrice = 0;
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (course) {
        coursePrice = Number(
          course.salePrice !== null ? course.salePrice : course.price
        );
      }
    }

    const cleanCouponCode = code.toUpperCase().trim();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCouponCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon does not exist or has been disabled" },
        { status: 404 }
      );
    }

    const couponData = {
      ...coupon,
      discountValue: Number(coupon.discountValue),
      minOrderValue: Number(coupon.minOrderValue),
    };

    const validation = validateCoupon(couponData, coursePrice);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid coupon code" },
        { status: 400 }
      );
    }

    const pricing = calculateOrderPricing(coursePrice, couponData);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderValue: Number(coupon.minOrderValue),
        calculatedDiscount: pricing.discountAmount,
        finalPrice: pricing.finalAmount,
      },
    });
  } catch (error: any) {
    console.error("Coupon Error:", error);
    return NextResponse.json(
      { error: "Failed to apply coupon. Please try again." },
      { status: 500 }
    );
  }
}
