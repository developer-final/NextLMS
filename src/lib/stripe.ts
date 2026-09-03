import Stripe from "stripe";
import { getSystemSettings } from "@/lib/config";

let stripeClient: Stripe | null = null;
let currentSecretKey: string | null = null;

/**
 * Initializes and returns a Stripe instance dynamically configured
 * from system settings or environment variables.
 */
export async function getStripeInstance(): Promise<Stripe> {
  const settings = await getSystemSettings();
  const secretKey =
    settings.stripeSecretKey?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    "";

  if (!secretKey) {
    throw new Error(
      "Stripe Secret Key is not configured in System Settings or .env"
    );
  }

  if (!stripeClient || currentSecretKey !== secretKey) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2024-11-20.acacia" as any,
      typescript: true,
    });
    currentSecretKey = secretKey;
  }

  return stripeClient;
}

export interface CreateStripeCheckoutSessionParams {
  orderCode: string;
  courseTitle: string;
  courseSlug?: string;
  amountVnd: number;
  customerEmail?: string;
  origin: string;
}

/**
 * Creates an official Stripe Checkout Session for PCI-DSS compliant credit card checkout
 */
export async function createStripeCheckoutSession({
  orderCode,
  courseTitle,
  courseSlug,
  amountVnd,
  customerEmail,
  origin,
}: CreateStripeCheckoutSessionParams): Promise<{ id: string; url: string }> {
  const stripe = await getStripeInstance();
  const settings = await getSystemSettings();

  // Determine whether to bill in VND (zero-decimal currency in Stripe) or USD
  // In Stripe, VND is a zero-decimal currency (1 VND = 1 unit)
  const isVndSupported = true; // Stripe supports VND natively for cards
  const lineItem = isVndSupported
    ? {
        price_data: {
          currency: "vnd",
          product_data: {
            name: courseTitle,
            description: `Online Course - Order #${orderCode}`,
          },
          unit_amount: Math.round(amountVnd),
        },
        quantity: 1,
      }
    : {
        price_data: {
          currency: "usd",
          product_data: {
            name: courseTitle,
            description: `E-Learning Course - Order #${orderCode}`,
          },
          unit_amount: Math.round(
            (amountVnd / (settings.usdExchangeRate || 25400)) * 100
          ), // cents
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: customerEmail || undefined,
    line_items: [lineItem],
    mode: "payment",
    client_reference_id: orderCode,
    metadata: {
      orderCode,
    },
    success_url: `${origin}/my-courses?session_id={CHECKOUT_SESSION_ID}&orderCode=${encodeURIComponent(orderCode)}`,
    cancel_url: courseSlug
      ? `${origin}/checkout/${courseSlug}?cancelled=true`
      : `${origin}/courses`,
  });

  if (!session.url) {
    throw new Error("Failed to generate Stripe Checkout URL.");
  }

  return {
    id: session.id,
    url: session.url,
  };
}
