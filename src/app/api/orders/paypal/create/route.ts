import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to proceed with PayPal payment" },
        { status: 401 }
      );
    }

    const settings = await getSystemSettings();
    if (!settings.paymentPaypalEnabled) {
      return NextResponse.json(
        { error: "PayPal payment gateway is currently disabled" },
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
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Security check: Only the order owner can initiate payment
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

    // Convert VND to USD based on admin settings
    const exchangeRate = settings.usdExchangeRate || 25400;
    const finalAmountVnd = Number(order.finalAmount);
    const amountUsd = parseFloat((finalAmountVnd / exchangeRate).toFixed(2));

    const courseTitle =
      order.orderItems[0]?.course?.title || "Online Trading Course";

    const paypalOrder = await createPayPalOrder({
      orderCode: order.orderCode,
      amountUsd,
      courseTitle,
    });

    return NextResponse.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      amountUsd,
    });
  } catch (error: any) {
    console.error("[PayPal API Create Order Error]:", error);
    return NextResponse.json(
      {
        error:
          error?.message || "Failed to initialize transaction with PayPal gateway.",
      },
      { status: 500 }
    );
  }
}
