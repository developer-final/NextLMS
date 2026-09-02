import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";
import { verifyPayPalWebhookSignature } from "@/lib/paypal";

/**
 * PayPal Webhook Handler
 * Events: PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED
 */
export async function POST(req: Request) {
  try {
    const settings = await getSystemSettings();
    if (!settings.paymentPaypalEnabled) {
      return NextResponse.json(
        { error: "PayPal gateway is currently disabled" },
        { status: 403 }
      );
    }

    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Verify PayPal Webhook Signature if credentials are set
    if (settings.paypalClientId && settings.paypalSecret) {
      const isSignatureValid = await verifyPayPalWebhookSignature(
        req.headers,
        rawBody,
        process.env.PAYPAL_WEBHOOK_ID
      );

      // In production, reject if signature verification fails
      if (!isSignatureValid && process.env.NODE_ENV === "production") {
        console.warn("[PayPal Webhook] Invalid webhook signature from PayPal.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const eventType = body.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource;
      const customId =
        resource.custom_id ||
        resource.invoice_id ||
        resource.supplementary_data?.related_ids?.order_id ||
        "";
      const captureId = resource.id;
      const amountUsd = parseFloat(resource.amount?.value || "0");

      if (!customId) {
        console.warn(
          "[PayPal Webhook] No custom_id/orderCode found in capture event:",
          captureId
        );
        return NextResponse.json({
          success: true,
          message: "Ignored event without orderCode",
        });
      }

      // Convert USD to VND with exchange rate
      const exchangeRate = settings.usdExchangeRate || 25400;
      const amountVnd = Math.round(amountUsd * exchangeRate);

      const result = await completeOrderAndEnroll({
        orderCode: customId,
        gatewayRef: captureId,
        amount: amountVnd,
        bankCode: "PAYPAL",
        transferContent: `PayPal Webhook ${captureId} ($${amountUsd} USD)`,
        rawWebhookData: rawBody,
        paymentMethod: "PAYPAL",
      });

      if (!result.success && !result.alreadyCompleted) {
        console.error("[PayPal Webhook] Fulfillment error:", result.message);
        return NextResponse.json(
          { error: result.message },
          { status: result.status || 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PayPal Webhook Exception]:", error);
    return NextResponse.json({ error: "Webhook internal error" }, { status: 500 });
  }
}
