import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * PayPal Webhook Handler
 * Events: PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED
 */
export async function POST(req: Request) {
  try {
    const settings = await getSystemSettings();
    if (!settings.paymentPaypalEnabled) {
      return NextResponse.json({ error: "PayPal gateway is currently disabled" }, { status: 403 });
    }

    const body = await req.json();
    const eventType = body.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource;
      const customId = resource.custom_id || resource.invoice_id || "";
      const captureId = resource.id;
      const amountUsd = parseFloat(resource.amount?.value || "0");

      if (!customId) {
        console.warn("[PayPal Webhook] No custom_id/orderCode in capture event:", captureId);
        return NextResponse.json({ success: true, message: "Ignored event without orderCode" });
      }

      // Convert USD to VND
      const exchangeRate = settings.usdExchangeRate || 25400;
      const amountVnd = Math.round(amountUsd * exchangeRate);

      const result = await completeOrderAndEnroll({
        orderCode: customId,
        gatewayRef: captureId,
        amount: amountVnd,
        bankCode: "PAYPAL",
        transferContent: `PayPal Webhook ${captureId} ($${amountUsd} USD)`,
        rawWebhookData: JSON.stringify(body),
        paymentMethod: "PAYPAL",
      });

      if (!result.success && !result.alreadyCompleted) {
        console.error("[PayPal Webhook] Fulfillment error:", result.message);
        return NextResponse.json({ error: result.message }, { status: result.status || 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PayPal Webhook Exception]:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
