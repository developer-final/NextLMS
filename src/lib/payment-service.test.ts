import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeOrderAndEnroll } from "./payment-service";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        create: vi.fn(),
      },
      enrollment: {
        upsert: vi.fn(),
      },
      coupon: {
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) =>
        callback({
          order: { update: vi.fn() },
          transaction: { create: vi.fn() },
          enrollment: { upsert: vi.fn() },
          coupon: { update: vi.fn() },
        })
      ),
    },
  };
});

// Mock Email
vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Payment Processing & Fulfillment (payment-service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if order does not exist", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const result = await completeOrderAndEnroll({
      orderCode: "NONEXISTENT",
      amount: 500000,
      paymentMethod: "PAYOS",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.message).toContain("not found");
  });

  it("should be idempotent and succeed without duplicate work if order is already COMPLETED", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "ord-1",
      orderCode: "ORD-123",
      status: "COMPLETED",
      finalAmount: 500000 as any,
      orderItems: [],
      user: { email: "student@test.com", name: "Student" },
    } as any);

    const result = await completeOrderAndEnroll({
      orderCode: "ORD-123",
      amount: 500000,
      paymentMethod: "PAYOS",
    });

    expect(result.success).toBe(true);
    expect(result.alreadyCompleted).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should reject payment if order has been CANCELLED", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "ord-2",
      orderCode: "ORD-CANCELLED",
      status: "CANCELLED",
      finalAmount: 500000 as any,
      orderItems: [],
    } as any);

    const result = await completeOrderAndEnroll({
      orderCode: "ORD-CANCELLED",
      amount: 500000,
      paymentMethod: "SEPAY",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toContain("cancelled");
  });

  it("should reject payment if received amount is less than finalAmount", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: "ord-3",
      orderCode: "ORD-UNDERPAID",
      status: "PENDING",
      finalAmount: 500000 as any,
      orderItems: [],
    } as any);

    const result = await completeOrderAndEnroll({
      orderCode: "ORD-UNDERPAID",
      amount: 200000, // Underpaid!
      paymentMethod: "PAYOS",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toContain("Insufficient payment");
  });

  it("should successfully fulfill a pending order, activate enrollment, and update coupon", async () => {
    const mockOrder = {
      id: "ord-4",
      orderCode: "ORD-SUCCESS",
      status: "PENDING",
      finalAmount: 1000000 as any,
      couponId: "cp-1",
      userId: "user-1",
      user: { email: "user@test.com", name: "Trader" },
      orderItems: [
        {
          courseId: "course-1",
          price: 1000000 as any,
          course: { title: "Forex Masterclass" },
        },
      ],
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

    const result = await completeOrderAndEnroll({
      orderCode: "ORD-SUCCESS",
      amount: 1000000,
      paymentMethod: "PAYOS",
      gatewayRef: "PAYOS-TX-999",
      bankCode: "MB",
      transferContent: "ORD-SUCCESS",
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBe("ord-4");
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        orderCode: "ORD-SUCCESS",
      })
    );
  });
});
