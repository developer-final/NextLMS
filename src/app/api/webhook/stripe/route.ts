import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * Stripe Webhook Handler
 * Events: checkout.session.completed, payment_intent.succeeded
 */
export async function POST(req: Request) {
  try {
    const settings = await getSystemSettings();
    if (!settings.paymentStripeEnabled) {
      return NextResponse.json({ error: "Stripe gateway is currently disabled" }, { status: 403 });
    }

    const body = await req.json();
    const eventType = body.type;
    const dataObject = body.data?.object;

    if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
      const orderCode =
        dataObject.metadata?.orderCode ||
        dataObject.client_reference_id ||
        "";
      const paymentIntentId = dataObject.id;
      const currency = String(dataObject.currency || "vnd").toLowerCase();
      const amountReceivedRaw = Number(dataObject.amount_received || dataObject.amount_total || 0);

      if (!orderCode) {
        console.warn("[Stripe Webhook] No orderCode metadata found in event:", paymentIntentId);
        return NextResponse.json({ success: true, message: "Ignored event without orderCode" });
      }

      let amountVnd = amountReceivedRaw;
      // If Stripe was processed in USD (cents)
      if (currency === "usd") {
        const amountUsd = amountReceivedRaw / 100;
        const exchangeRate = settings.usdExchangeRate || 25400;
        amountVnd = Math.round(amountUsd * exchangeRate);
      }

      const result = await completeOrderAndEnroll({
        orderCode,
        gatewayRef: paymentIntentId,
        amount: amountVnd,
        bankCode: "STRIPE",
        transferContent: `Stripe Payment ${paymentIntentId}`,
        rawWebhookData: JSON.stringify(body),
        paymentMethod: "STRIPE",
      });

      if (!result.success && !result.alreadyCompleted) {
        console.error("[Stripe Webhook] Fulfillment error:", result.message);
        return NextResponse.json({ error: result.message }, { status: result.status || 400 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Exception]:", error);
    return NextResponse.json({ error: "Stripe webhook error" }, { status: 500 });
  }
}
