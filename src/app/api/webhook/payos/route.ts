import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * PayOS Webhook Handler
 * Standard: https://payos.vn/docs/webhook/
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = await getSystemSettings();

    // Check if VietQR Auto with PayOS is enabled
    if (!settings.paymentVietqrAutoEnabled || settings.paymentVietqrProvider !== "PAYOS") {
      return NextResponse.json(
        { error: "PayOS gateway is currently disabled" },
        { status: 403 }
      );
    }

    const { data, signature } = body;

    if (!data) {
      return NextResponse.json({ error: "Invalid PayOS webhook payload" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature if checksum key is set and signature is provided
    if (settings.payosChecksumKey && signature) {
      // PayOS sorts data keys alphabetically
      const sortedKeys = Object.keys(data).sort();
      const signData = sortedKeys
        .map((k) => `${k}=${data[k] !== null && data[k] !== undefined ? data[k] : ""}`)
        .join("&");

      const computedSig = crypto
        .createHmac("sha256", settings.payosChecksumKey)
        .update(signData)
        .digest("hex");

      if (computedSig !== signature) {
        console.warn("[PayOS Webhook] Invalid signature detected.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Extract Order Code: either numeric orderCode or from transfer description
    let targetOrderCode = String(data.orderCode || "");
    const description = String(data.description || "");

    // If orderCode in data doesn't match standard format, search in description
    if (!targetOrderCode || targetOrderCode.length < 6) {
      const match = description.match(/(?:WTL|EL)[A-Z0-9]+/i);
      if (match) {
        targetOrderCode = match[0].toUpperCase();
      }
    }

    const receivedAmount = Number(data.amount || 0);

    const result = await completeOrderAndEnroll({
      orderCode: targetOrderCode,
      gatewayRef: String(data.reference || data.paymentLinkId || `PAYOS-${Date.now()}`),
      amount: receivedAmount,
      bankCode: String(data.counterAccountBankId || "VIETQR"),
      transferContent: description,
      rawWebhookData: JSON.stringify(body),
      paymentMethod: "PAYOS",
    });

    if (!result.success && !result.alreadyCompleted) {
      console.error("[PayOS Webhook] Payment completion error:", result.message);
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[PayOS Webhook] Exception:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
