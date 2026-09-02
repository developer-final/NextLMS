import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as payosWebhookHandler } from "@/app/api/webhook/payos/route";
import { POST as sepayWebhookHandler } from "@/app/api/webhook/sepay/route";
import { POST as paypalWebhookHandler } from "@/app/api/webhook/paypal/route";
import { POST as paypalCaptureHandler } from "@/app/api/orders/paypal-capture/route";
import * as configModule from "@/lib/config";
import * as paymentServiceModule from "@/lib/payment-service";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "user-test", role: "STUDENT" },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn().mockResolvedValue({
        id: "order-123",
        orderCode: "WTL123456",
        finalAmount: 1000000,
        status: "PENDING",
      }),
    },
  },
}));

describe("Payment Webhooks Integration Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PayOS Webhook Handler", () => {
    it("should reject if PayOS gateway is disabled", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentVietqrAutoEnabled: false,
      });

      const req = new Request("http://localhost/api/webhook/payos", {
        method: "POST",
        body: JSON.stringify({ data: { orderCode: "WTL123456", amount: 1000000 } }),
      });

      const res = await payosWebhookHandler(req);
      expect(res.status).toBe(403);
    });

    it("should process PayOS payment and call completeOrderAndEnroll", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentVietqrAutoEnabled: true,
        paymentVietqrProvider: "PAYOS",
        payosChecksumKey: "", // simulation mode
      });

      const completeOrderSpy = vi
        .spyOn(paymentServiceModule, "completeOrderAndEnroll")
        .mockResolvedValue({
          success: true,
          message: "Success",
          orderId: "ord-1",
        });

      const req = new Request("http://localhost/api/webhook/payos", {
        method: "POST",
        body: JSON.stringify({
          code: "00",
          desc: "success",
          data: {
            orderCode: "WTL123456",
            amount: 1000000,
            description: "WTL123456 thanh toan",
          },
        }),
      });

      const res = await payosWebhookHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(completeOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderCode: "WTL123456",
          amount: 1000000,
          paymentMethod: "PAYOS",
        })
      );
    });
  });

  describe("SePay Webhook Handler", () => {
    it("should reject if SePay gateway is disabled", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentVietqrAutoEnabled: true,
        paymentVietqrProvider: "PAYOS", // configured for PayOS instead of SePay
      });

      const req = new Request("http://localhost/api/webhook/sepay", {
        method: "POST",
        body: JSON.stringify({ content: "WTL123456", transferAmount: 1000000 }),
      });

      const res = await sepayWebhookHandler(req);
      expect(res.status).toBe(403);
    });

    it("should process SePay transfer credit webhook", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentVietqrAutoEnabled: true,
        paymentVietqrProvider: "SEPAY",
        sepayApiKey: "",
      });

      const completeOrderSpy = vi
        .spyOn(paymentServiceModule, "completeOrderAndEnroll")
        .mockResolvedValue({
          success: true,
          message: "Success",
        });

      const req = new Request("http://localhost/api/webhook/sepay", {
        method: "POST",
        body: JSON.stringify({
          transferType: "in",
          transferAmount: 1000000,
          content: "WTL123456 CK KHOA HOC",
          gateway: "MBBank",
        }),
      });

      const res = await sepayWebhookHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(completeOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderCode: "WTL123456",
          amount: 1000000,
          paymentMethod: "SEPAY",
        })
      );
    });
  });

  describe("PayPal Capture & Webhook Handlers", () => {
    it("should fulfill order via PayPal capture endpoint", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentPaypalEnabled: true,
        usdExchangeRate: 25400,
      });

      const completeOrderSpy = vi
        .spyOn(paymentServiceModule, "completeOrderAndEnroll")
        .mockResolvedValue({
          success: true,
          message: "Success",
        });

      const req = new Request("http://localhost/api/orders/paypal-capture", {
        method: "POST",
        body: JSON.stringify({
          orderCode: "WTL123456",
          paypalCaptureId: "PAYPAL-CAP-999",
          amountUsd: 39.37,
        }),
      });

      const res = await paypalCaptureHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(completeOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderCode: "WTL123456",
          paymentMethod: "PAYPAL",
        })
      );
    });

    it("should handle PayPal capture completed webhook event", async () => {
      vi.spyOn(configModule, "getSystemSettings").mockResolvedValue({
        ...configModule.DEFAULT_CONFIG,
        paymentPaypalEnabled: true,
        usdExchangeRate: 25400,
      });

      const completeOrderSpy = vi
        .spyOn(paymentServiceModule, "completeOrderAndEnroll")
        .mockResolvedValue({
          success: true,
          message: "Success",
        });

      const req = new Request("http://localhost/api/webhook/paypal", {
        method: "POST",
        body: JSON.stringify({
          event_type: "PAYMENT.CAPTURE.COMPLETED",
          resource: {
            id: "CAP-12345",
            custom_id: "WTL123456",
            amount: { value: "39.37" },
          },
        }),
      });

      const res = await paypalWebhookHandler(req);
      expect(res.status).toBe(200);
      expect(completeOrderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderCode: "WTL123456",
          paymentMethod: "PAYPAL",
        })
      );
    });
  });
});
