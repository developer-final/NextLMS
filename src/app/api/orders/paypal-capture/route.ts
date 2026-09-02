import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { capturePayPalOrder } from "@/lib/paypal";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * Validates and captures an approved PayPal Order using official PayPal REST API v2.
 * Prevents mock / simulated bypassing and ensures funds are actually captured.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to complete payment" },
        { status: 401 }
      );
    }

    const settings = await getSystemSettings();
    if (!settings.paymentPaypalEnabled) {
      return NextResponse.json(
        { error: "PayPal gateway is currently disabled" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderCode, paypalOrderId } = body;

    if (!orderCode || !paypalOrderId) {
      return NextResponse.json(
        { error: "Missing required orderCode or paypalOrderId" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderCode: String(orderCode).trim() },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Security check 1: User ownership verification
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to process this order" },
        { status: 403 }
      );
    }

    // Idempotency: Already completed
    if (order.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: "Order has already been completed and processed.",
        orderCode: order.orderCode,
      });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order has been cancelled and cannot be paid" },
        { status: 400 }
      );
    }

    // Call official PayPal REST API v2 to capture the order
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: `PayPal transaction not completed (Status: ${captureResult.status}). Please check your PayPal account.`,
        },
        { status: 400 }
      );
    }

    const finalAmountVnd = Number(order.finalAmount);

    // Complete order and activate enrollment atomically
    const result = await completeOrderAndEnroll({
      orderCode: order.orderCode,
      gatewayRef: captureResult.captureId,
      amount: finalAmountVnd,
      bankCode: "PAYPAL",
      transferContent: `PayPal Capture ${captureResult.captureId} ($${captureResult.amountReceivedUsd} USD)`,
      rawWebhookData: JSON.stringify(captureResult.rawResponse),
      paymentMethod: "PAYPAL",
    });

    if (!result.success && !result.alreadyCompleted) {
      console.error("[PayPal Capture Fulfillment Error]:", result.message);
      return NextResponse.json(
        { error: result.message },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PayPal payment successful. Course access has been granted.",
      orderCode: order.orderCode,
      captureId: captureResult.captureId,
    });
  } catch (error: any) {
    console.error("[PayPal Capture Error]:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to verify PayPal transaction. Please contact support.",
      },
      { status: 500 }
    );
  }
}
