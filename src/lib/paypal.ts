import { getSystemSettings } from "@/lib/config";

/**
 * Returns the PayPal API base URL based on mode (sandbox or live)
 */
function getPayPalBaseUrl(mode: "sandbox" | "live"): string {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/**
 * Obtains an OAuth2 Bearer Access Token from PayPal API v1
 */
export async function getPayPalAccessToken(): Promise<{
  accessToken: string;
  baseUrl: string;
}> {
  const settings = await getSystemSettings();
  const clientId = settings.paypalClientId?.trim();
  const secret = settings.paypalSecret?.trim();
  const mode = settings.paypalMode || "sandbox";
  const baseUrl = getPayPalBaseUrl(mode);

  if (!clientId || !secret) {
    throw new Error(
      "PayPal Client ID or Secret is not configured in System Settings."
    );
  }

  const authHeader = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[PayPal SDK] Failed to fetch access token:", errorData);
    throw new Error("Unable to authenticate with PayPal API.");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    baseUrl,
  };
}

export interface CreatePayPalOrderParams {
  orderCode: string;
  amountUsd: number;
  courseTitle: string;
}

/**
 * Creates an official PayPal Order via REST API v2
 */
export async function createPayPalOrder({
  orderCode,
  amountUsd,
  courseTitle,
}: CreatePayPalOrderParams): Promise<{ id: string; status: string }> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const formattedAmount = Number(amountUsd).toFixed(2);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderCode,
        custom_id: orderCode,
        description: `Order #${orderCode} - ${courseTitle}`.slice(0, 127),
        amount: {
          currency_code: "USD",
          value: formattedAmount,
        },
      },
    ],
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("[PayPal SDK] Create order failed:", errorDetails);
    throw new Error(`PayPal Create Order Error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    status: data.status,
  };
}

export interface CapturePayPalOrderResult {
  captureId: string;
  status: string;
  amountReceivedUsd: number;
  customId?: string;
  rawResponse: any;
}

/**
 * Captures an approved PayPal Order via REST API v2
 */
export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<CapturePayPalOrderResult> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    }
  );

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("[PayPal SDK] Capture order failed:", errorDetails);
    throw new Error(`PayPal Capture Error: ${response.statusText}`);
  }

  const data = await response.json();
  const captureUnit =
    data.purchase_units?.[0]?.payments?.captures?.[0] || {};

  return {
    captureId: captureUnit.id || data.id,
    status: data.status, // Expected "COMPLETED"
    amountReceivedUsd: parseFloat(captureUnit.amount?.value || "0"),
    customId:
      data.purchase_units?.[0]?.custom_id ||
      data.purchase_units?.[0]?.reference_id,
    rawResponse: data,
  };
}

/**
 * Verifies webhook signature against PayPal API
 */
export async function verifyPayPalWebhookSignature(
  reqHeaders: Headers,
  rawBody: string,
  webhookId?: string
): Promise<boolean> {
  try {
    const { accessToken, baseUrl } = await getPayPalAccessToken();

    const transmissionId = reqHeaders.get("paypal-transmission-id");
    const transmissionTime = reqHeaders.get("paypal-transmission-time");
    const certUrl = reqHeaders.get("paypal-cert-url");
    const authAlgo = reqHeaders.get("paypal-auth-algo");
    const transmissionSig = reqHeaders.get("paypal-transmission-sig");

    if (
      !transmissionId ||
      !transmissionTime ||
      !certUrl ||
      !authAlgo ||
      !transmissionSig
    ) {
      console.warn("[PayPal Webhook] Missing required PayPal headers");
      return false;
    }

    const payload = {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId || "WEBHOOK_VERIFY",
      webhook_event: JSON.parse(rawBody),
    };

    const response = await fetch(
      `${baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) return false;
    const result = await response.json();
    return result.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal Webhook] Verification error:", err);
    return false;
  }
}
