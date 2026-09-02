import { NextResponse } from "next/server";
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
    if (!settings.paymentVietqrAutoEnabled || settings.paymentVietqrProvider !== "SEPAY") {
      return NextResponse.json(
        { error: "SePay gateway is currently disabled" },
        { status: 403 }
      );
    }

    // Verify SePay API Key in Authorization header if configured
    if (settings.sepayApiKey) {
      const authHeader = req.headers.get("Authorization") || "";
      const expectedApiKey = settings.sepayApiKey.trim();
      const apiKeyInHeader = authHeader.replace(/^Apikey\s+/i, "").trim();

      if (apiKeyInHeader !== expectedApiKey) {
        console.warn("[SePay Webhook] Unauthorized request: API Key mismatch.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // Only process incoming credit transfers
    if (body.transferType && body.transferType !== "in") {
      return NextResponse.json({ success: true, message: "Ignored outgoing transfer" });
    }

    const content = String(body.content || body.description || "");
    const receivedAmount = Number(body.transferAmount || body.amount || 0);

    // Extract order code from content (pattern: WTLxxxxx or ELxxxxx or code directly)
    let targetOrderCode = String(body.code || "").trim();
    if (!targetOrderCode || targetOrderCode === "null") {
      const match = content.match(/(?:WTL|EL)[A-Z0-9]+/i);
      if (match) {
        targetOrderCode = match[0].toUpperCase();
      }
    }

    if (!targetOrderCode) {
      console.warn("[SePay Webhook] Could not find order code in transfer content:", content);
      return NextResponse.json(
        { error: "Order code not identified in transfer content" },
        { status: 400 }
      );
    }

    const result = await completeOrderAndEnroll({
      orderCode: targetOrderCode,
      gatewayRef: String(body.referenceCode || body.id || `SEPAY-${Date.now()}`),
      amount: receivedAmount,
      bankCode: String(body.gateway || "VIETQR"),
      transferContent: content,
      rawWebhookData: JSON.stringify(body),
      paymentMethod: "SEPAY",
    });

    if (!result.success && !result.alreadyCompleted) {
      console.error("[SePay Webhook] Fulfillment error:", result.message);
      return NextResponse.json({ error: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[SePay Webhook] Exception:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
