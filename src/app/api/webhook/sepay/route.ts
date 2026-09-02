import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSystemSettings } from "@/lib/config";
import { completeOrderAndEnroll } from "@/lib/payment-service";

/**
 * SePay Webhook Handler
 * Standard: https://sepay.vn/docs/webhook
 */
export async function POST(req: Request) {
  try {
    const settings = await getSystemSettings();

    // Check if VietQR Auto with SePay is enabled
    if (
      !settings.paymentVietqrAutoEnabled ||
      settings.paymentVietqrProvider !== "SEPAY"
    ) {
      return NextResponse.json(
        { error: "SePay gateway is currently disabled" },
        { status: 403 }
      );
    }

    // Verify SePay API Key in Authorization header
    const expectedApiKey = settings.sepayApiKey?.trim();

    if (expectedApiKey) {
      const authHeader = req.headers.get("Authorization") || "";
      const apiKeyInHeader = authHeader.replace(/^Apikey\s+/i, "").trim();

      if (!apiKeyInHeader) {
        return NextResponse.json(
          { error: "Missing Authorization header in SePay request" },
          { status: 401 }
        );
      }

      // Timing-safe comparison to prevent side-channel timing attacks
      const bufA = Buffer.from(apiKeyInHeader);
      const bufB = Buffer.from(expectedApiKey);

      if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
        console.warn("[SePay Webhook] Unauthorized request: API Key mismatch.");
        return NextResponse.json(
          { error: "Unauthorized: Invalid SePay API Key" },
          { status: 401 }
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error(
        "[SePay Webhook] SePay API Key is not configured in production settings!"
      );
      return NextResponse.json(
        { error: "SePay API Key is not configured in system settings" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Only process incoming credit transfers
    if (body.transferType && body.transferType !== "in") {
      return NextResponse.json({
        success: true,
        message: "Ignored outgoing transfer",
      });
    }

    const content = String(body.content || body.description || "");
    const receivedAmount = Number(body.transferAmount || body.amount || 0);

    // Extract order code from content (pattern: ELxxx, WTLxxx, EL-xxx-xxx, or body.code)
    let targetOrderCode = String(body.code || "").trim();
    if (!targetOrderCode || targetOrderCode === "null") {
      const match = content.match(/(?:WTL|EL)-?[A-Z0-9]+(?:-[A-Z0-9]+)*/i);
      if (match) {
        targetOrderCode = match[0].toUpperCase();
      }
    }

    if (!targetOrderCode) {
      console.warn(
        "[SePay Webhook] Could not find order code in transfer content:",
        content
      );
      return NextResponse.json(
        { error: "Order code not identified in transfer content" },
        { status: 400 }
      );
    }

    const result = await completeOrderAndEnroll({
      orderCode: targetOrderCode,
      gatewayRef: String(
        body.referenceCode || body.id || `SEPAY-${Date.now()}`
      ),
      amount: receivedAmount,
      bankCode: String(body.gateway || "VIETQR"),
      transferContent: content,
      rawWebhookData: JSON.stringify(body),
      paymentMethod: "SEPAY",
    });

    if (!result.success && !result.alreadyCompleted) {
      console.error("[SePay Webhook] Fulfillment error:", result.message);
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
    console.error("[SePay Webhook] Exception:", error);
    return NextResponse.json(
      { error: "Internal SePay webhook processing error" },
      { status: 500 }
    );
  }
}
