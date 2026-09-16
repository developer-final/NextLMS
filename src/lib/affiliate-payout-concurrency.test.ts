import { describe, it, expect, vi, beforeEach } from "vitest";
import { settleMaturedCommissions } from "@/lib/affiliate";
import { POST as requestPayout } from "@/app/api/affiliate/payout/route";
import { POST as processAdminPayout } from "@/app/api/admin/affiliates/payouts/route";
import { POST as createOrder } from "@/app/api/orders/create/route";
import { POST as approveBulkOrders } from "@/app/api/admin/orders/approve/route";
import { POST as manualBulkEnroll } from "@/app/api/admin/enrollments/manual/route";
import { PATCH as bulkPatchCoupons } from "@/app/api/admin/coupons/route";
import { PATCH as bulkPatchCourses } from "@/app/api/admin/courses/route";
import { PATCH as bulkPatchPosts } from "@/app/api/admin/posts/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/config", () => ({
  getSystemSettings: vi.fn().mockResolvedValue({
    affiliateEnabled: true,
    affiliateCommissionPercent: 20,
    affiliateHoldDays: 7,
    affiliateMinPayout: 200000,
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  orderRateLimiter: {
    check: vi.fn().mockReturnValue({ allowed: true }),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    enrollment: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    commission: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    payoutRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    blogPost: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return Promise.all(cb);
    }),
  },
}));

describe("Khối 5 & Khối 6: Affiliate Concurrency, Coupon Limits & Admin Operations Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SEC-P3-04: Real-Time Maturity Resolution (settleMaturedCommissions)", () => {
    it("should automatically settle matured commissions to APPROVED when order is COMPLETED", async () => {
      vi.mocked(prisma.commission.findMany).mockResolvedValueOnce([
        { id: "comm-1", order: { status: "COMPLETED" } },
        { id: "comm-2", order: { status: "COMPLETED" } },
        { id: "comm-3", order: { status: "CANCELLED" } },
      ] as any);

      vi.mocked(prisma.commission.updateMany)
        .mockResolvedValueOnce({ count: 2 }) // Approved
        .mockResolvedValueOnce({ count: 1 }); // Rejected

      const result = await settleMaturedCommissions("aff-user-1");

      expect(result.approved).toBe(2);
      expect(result.rejected).toBe(1);
      expect(prisma.commission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            affiliateId: "aff-user-1",
          }),
        })
      );
    });
  });

  describe("SEC-P3-02: Affiliate Payout Race Condition & Overdraft Prevention", () => {
    it("should abort payout request if an existing pending request is found inside transaction", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "aff-user-1", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "aff-user-1",
        status: "ACTIVE",
      } as any);

      // Settle matured commissions mock
      vi.mocked(prisma.commission.findMany).mockResolvedValue([]);

      // Inside transaction: pending payout already exists
      vi.mocked(prisma.payoutRequest.findFirst).mockResolvedValueOnce({
        id: "existing-payout",
        status: "PENDING",
      } as any);

      const req = new Request("http://localhost:3000/api/affiliate/payout", {
        method: "POST",
        body: JSON.stringify({
          bankName: "MB Bank",
          bankAccountNo: "0987654321",
          bankAccountName: "NGUYEN VAN AFF",
        }),
      });

      const res = await requestPayout(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("already have a pending payout request");
    });

    it("should return 409 if optimistic locking detects concurrent commission locking", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "aff-user-1", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "aff-user-1",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.payoutRequest.findFirst).mockResolvedValueOnce(null);

      // Available commissions totaling 500,000 VND (2 commissions)
      vi.mocked(prisma.commission.findMany).mockResolvedValue([
        { id: "c1", commissionAmount: 250000 },
        { id: "c2", commissionAmount: 250000 },
      ] as any);

      vi.mocked(prisma.payoutRequest.create).mockResolvedValueOnce({
        id: "new-payout-1",
      } as any);

      // Concurrency collision: only 1 commission was updated because another thread locked c2
      vi.mocked(prisma.commission.updateMany).mockResolvedValueOnce({ count: 1 });

      const req = new Request("http://localhost:3000/api/affiliate/payout", {
        method: "POST",
        body: JSON.stringify({
          bankName: "Techcombank",
          bankAccountNo: "1122334455",
          bankAccountName: "NGUYEN VAN AFF",
        }),
      });

      const res = await requestPayout(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error).toContain("already been requested or modified");
    });
  });

  describe("SEC-P3-03: Admin Payout State Transition & Race Condition Defense", () => {
    it("should reject approval if payout is already COMPLETED or REJECTED", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.payoutRequest.findUnique).mockResolvedValueOnce({
        id: "payout-done",
        status: "COMPLETED",
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/payouts", {
        method: "POST",
        body: JSON.stringify({
          payoutId: "payout-done",
          action: "APPROVE",
        }),
      });

      const res = await processAdminPayout(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("already COMPLETED");
    });

    it("should reject action if payout is already REJECTED", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.payoutRequest.findUnique).mockResolvedValueOnce({
        id: "payout-rejected",
        status: "REJECTED",
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/payouts", {
        method: "POST",
        body: JSON.stringify({
          payoutId: "payout-rejected",
          action: "APPROVE",
        }),
      });

      const res = await processAdminPayout(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("already REJECTED");
    });

    it("should return 409 if another admin concurrently processed the payout", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.payoutRequest.findUnique).mockResolvedValueOnce({
        id: "payout-pending",
        status: "PENDING",
      } as any);

      // Atomic update inside transaction returned count 0 because another admin processed it first
      vi.mocked(prisma.payoutRequest.updateMany).mockResolvedValueOnce({ count: 0 });

      const req = new Request("http://localhost:3000/api/admin/affiliates/payouts", {
        method: "POST",
        body: JSON.stringify({
          payoutId: "payout-pending",
          action: "APPROVE",
        }),
      });

      const res = await processAdminPayout(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error).toContain("already been processed");
    });
  });

  describe("SEC-P3-01: Atomic Coupon Reservation & Concurrency Lock", () => {
    it("should reject order creation if coupon limit is exceeded via atomic reservation", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "student-1", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.course.findUnique).mockResolvedValueOnce({
        id: "course-1",
        title: "Trading 101",
        price: 1000000 as any,
        salePrice: null,
        status: "PUBLISHED",
        isFree: false,
        sections: [],
      } as any);

      vi.mocked(prisma.enrollment.findUnique).mockResolvedValueOnce(null);

      vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
        id: "cp-limit-1",
        code: "LIMITED10",
        discountType: "PERCENT",
        discountValue: 10 as any,
        maxUsage: 1,
        usedCount: 0,
        minOrderValue: 0 as any,
        isActive: true,
      } as any);

      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      // Atomic reservation count = 0 (concurrent request grabbed the last slot)
      vi.mocked(prisma.coupon.updateMany).mockResolvedValueOnce({ count: 0 });

      const req = new Request("http://localhost:3000/api/orders/create", {
        method: "POST",
        body: JSON.stringify({
          courseId: "course-1",
          couponCode: "LIMITED10",
        }),
      });

      const res = await createOrder(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("limit has been reached");
    });
  });

  describe("SEC-P3-05: Maximum Bulk Batch Limits (MAX_BULK_LIMIT = 100)", () => {
    const mockAdminSession = {
      user: { id: "admin-1", role: "ADMIN" },
    };

    it("should reject order bulk approval when targetIds exceed 100", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);

      const oversizedIds = Array.from({ length: 101 }, (_, i) => `ord-${i}`);
      const req = new Request("http://localhost:3000/api/admin/orders/approve", {
        method: "POST",
        body: JSON.stringify({ orderIds: oversizedIds, action: "APPROVE" }),
      });

      const res = await approveBulkOrders(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batch size exceeds maximum limit");
    });

    it("should reject student bulk enrollment when userIds exceed 100", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);

      const oversizedIds = Array.from({ length: 105 }, (_, i) => `user-${i}`);
      const req = new Request("http://localhost:3000/api/admin/enrollments/manual", {
        method: "POST",
        body: JSON.stringify({ userIds: oversizedIds, courseId: "c-1" }),
      });

      const res = await manualBulkEnroll(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batch size exceeds maximum limit");
    });

    it("should reject coupon bulk update when ids exceed 100", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);

      const oversizedIds = Array.from({ length: 102 }, (_, i) => `cp-${i}`);
      const req = new Request("http://localhost:3000/api/admin/coupons", {
        method: "PATCH",
        body: JSON.stringify({ ids: oversizedIds, isActive: false }),
      });

      const res = await bulkPatchCoupons(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batch size exceeds maximum limit");
    });

    it("should reject course bulk patch when ids exceed 100", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);

      const oversizedIds = Array.from({ length: 110 }, (_, i) => `course-${i}`);
      const req = new Request("http://localhost:3000/api/admin/courses", {
        method: "PATCH",
        body: JSON.stringify({ ids: oversizedIds, status: "ARCHIVED" }),
      });

      const res = await bulkPatchCourses(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batch size exceeds maximum limit");
    });

    it("should reject blog posts bulk patch when ids exceed 100", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);

      const oversizedIds = Array.from({ length: 101 }, (_, i) => `post-${i}`);
      const req = new Request("http://localhost:3000/api/admin/posts", {
        method: "PATCH",
        body: JSON.stringify({ ids: oversizedIds, status: "ARCHIVED" }),
      });

      const res = await bulkPatchPosts(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batch size exceeds maximum limit");
    });
  });
});
