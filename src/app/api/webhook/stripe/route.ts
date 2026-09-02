import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";
import { getStripeInstance } from "@/lib/stripe";

/**
 * Official Stripe Webhook Handler
 * Uses stripe.webhooks.constructEvent for cryptographically secure signature verification.
 */
export async function POST(req: Request) {
  try {
    const settings = await getSystemSettings();
    if (!settings.paymentStripeEnabled) {
      return NextResponse.json(
        { error: "Stripe gateway is currently disabled" },
        { status: 403 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    const webhookSecret =
      settings.stripeWebhookSecret?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      "";

    let event: any;

    // Cryptographic signature check if webhook secret is configured
    if (webhookSecret && signature) {
      try {
        const stripe = await getStripeInstance();
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error(
          "[Stripe Webhook] Signature verification failed:",
          err.message
        );
        return NextResponse.json(
          { error: `Webhook Signature Verification Failed: ${err.message}` },
          { status: 400 }
        );
      }
    } else {
      // In dev simulation without secret
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
    }

    const eventType = event.type;
    const dataObject = event.data?.object;

    if (
      eventType === "checkout.session.completed" ||
      eventType === "payment_intent.succeeded"
    ) {
      const orderCode =
        dataObject.metadata?.orderCode ||
        dataObject.client_reference_id ||
        "";
      const paymentIntentId = dataObject.id;
      const currency = String(dataObject.currency || "vnd").toLowerCase();
      const amountReceivedRaw = Number(
        dataObject.amount_total || dataObject.amount_received || 0
      );

      if (!orderCode) {
        console.warn(
          "[Stripe Webhook] No orderCode metadata found in event:",
          paymentIntentId
        );
        return NextResponse.json({
          success: true,
          message: "Ignored event without orderCode",
        });
      }

      let amountVnd = amountReceivedRaw;
      // If processed in USD cents
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
        rawWebhookData: rawBody,
        paymentMethod: "STRIPE",
      });

      if (!result.success && !result.alreadyCompleted) {
        console.error("[Stripe Webhook] Fulfillment error:", result.message);
        return NextResponse.json(
          { error: result.message },
          { status: result.status || 400 }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Exception]:", error);
    return NextResponse.json({ error: "Stripe webhook error" }, { status: 500 });
  }
}
