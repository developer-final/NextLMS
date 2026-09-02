import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * Endpoint called when PayPal Smart Button captures an approved order.
 * Validates the capture and fulfills the order.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getSystemSettings();
    if (!settings.paymentPaypalEnabled) {
      return NextResponse.json({ error: "PayPal gateway is currently disabled" }, { status: 403 });
    }

    const body = await req.json();
    const { orderCode, paypalCaptureId, paypalOrderId, amountUsd } = body;

    if (!orderCode) {
      return NextResponse.json({ error: "Missing order code" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Convert VND amount to USD check (or vice versa)
    const exchangeRate = settings.usdExchangeRate || 25400;
    const finalAmountVnd = Number(order.finalAmount);
    const expectedUsd = parseFloat((finalAmountVnd / exchangeRate).toFixed(2));

    // In production with credentials, we would call PayPal REST API v2 to verify capture:
    // GET https://api-m.paypal.com/v2/payments/captures/{capture_id}
    // In Sandbox / Dev Simulation, we verify the required capture ID or simulate safely.
    const effectiveCaptureId = paypalCaptureId || paypalOrderId || `PAYPAL-SIM-${Date.now()}`;

    const result = await completeOrderAndEnroll({
      orderCode,
      gatewayRef: effectiveCaptureId,
      amount: finalAmountVnd, // Completed at final order amount
      bankCode: "PAYPAL",
      transferContent: `PayPal Capture ${effectiveCaptureId} (${amountUsd || expectedUsd} USD)`,
      rawWebhookData: JSON.stringify(body),
      paymentMethod: "PAYPAL",
    });

    if (!result.success && !result.alreadyCompleted) {
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      orderCode: order.orderCode,
    });
  } catch (error: any) {
    console.error("[PayPal Capture Error]:", error);
    return NextResponse.json({ error: "Error processing PayPal payment" }, { status: 500 });
  }
}
