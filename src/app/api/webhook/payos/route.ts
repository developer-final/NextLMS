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
    if (
      !settings.paymentVietqrAutoEnabled ||
      settings.paymentVietqrProvider !== "PAYOS"
    ) {
      return NextResponse.json(
        { error: "PayOS payment gateway is currently disabled" },
        { status: 403 }
      );
    }

    const { data, signature } = body;

    if (!data) {
      return NextResponse.json(
        { error: "Invalid PayOS webhook payload" },
        { status: 400 }
      );
    }

    // Strict HMAC-SHA256 signature verification
    const checksumKey = settings.payosChecksumKey?.trim();

    if (checksumKey) {
      if (!signature) {
        console.warn("[PayOS Webhook] Missing signature in incoming payload.");
        return NextResponse.json(
          { error: "Missing required webhook signature" },
          { status: 401 }
        );
      }

      // PayOS signs the data object with keys sorted alphabetically
      const sortedKeys = Object.keys(data).sort();
      const signData = sortedKeys
        .map(
          (k) => `${k}=${data[k] !== null && data[k] !== undefined ? data[k] : ""}`
        )
        .join("&");

      const computedSig = crypto
        .createHmac("sha256", checksumKey)
        .update(signData)
        .digest("hex");

      if (computedSig !== signature) {
        console.warn("[PayOS Webhook] Invalid signature detected.");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error(
        "[PayOS Webhook] PayOS Checksum Key is not configured in production!"
      );
      return NextResponse.json(
        { error: "PayOS Checksum Key is not configured in system settings" },
        { status: 500 }
      );
    }

    // Extract Order Code: either numeric orderCode or from transfer description
    let targetOrderCode = String(data.orderCode || "");
    const description = String(data.description || "");

    if (!targetOrderCode || targetOrderCode.length < 6) {
      const match = description.match(/(?:WTL|EL)-?[A-Z0-9]+(?:-[A-Z0-9]+)*/i);
      if (match) {
        targetOrderCode = match[0].toUpperCase();
      }
    }

    const receivedAmount = Number(data.amount || 0);

    const result = await completeOrderAndEnroll({
      orderCode: targetOrderCode,
      gatewayRef: String(
        data.reference || data.paymentLinkId || `PAYOS-${Date.now()}`
      ),
      amount: receivedAmount,
      bankCode: String(data.counterAccountBankId || "VIETQR"),
      transferContent: description,
      rawWebhookData: JSON.stringify(body),
      paymentMethod: "PAYOS",
    });

    if (!result.success && !result.alreadyCompleted) {
      console.error(
        "[PayOS Webhook] Payment completion error:",
        result.message
      );
      return NextResponse.json(
        { error: result.message },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[PayOS Webhook] Exception:", error);
    return NextResponse.json(
      { error: "Internal PayOS webhook processing error" },
      { status: 500 }
    );
  }
}
