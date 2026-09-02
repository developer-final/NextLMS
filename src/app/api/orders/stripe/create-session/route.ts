import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { createStripeCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to proceed with Stripe checkout" },
        { status: 401 }
      );
    }

    const settings = await getSystemSettings();
    if (!settings.paymentStripeEnabled) {
      return NextResponse.json(
        { error: "Stripe payment gateway is currently disabled" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderCode } = body;

    if (!orderCode) {
      return NextResponse.json(
        { error: "Missing required order code" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderCode: String(orderCode).trim() },
      include: {
        orderItems: {
          include: { course: true },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Security check: Order ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to process this order" },
        { status: 403 }
      );
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json(
        { error: "This order has already been completed" },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order has been cancelled" },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer") ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const courseTitle =
      order.orderItems[0]?.course?.title || "Trading Course";

    const stripeSession = await createStripeCheckoutSession({
      orderCode: order.orderCode,
      courseTitle,
      amountVnd: Number(order.finalAmount),
      customerEmail: order.user?.email || undefined,
      origin: origin.replace(/\/$/, ""),
    });

    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error: any) {
    console.error("[Stripe Create Session Error]:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to create Stripe Checkout Session. Please try again.",
      },
      { status: 500 }
    );
  }
}
