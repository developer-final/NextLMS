import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH as updateCommissionRoute } from "@/app/api/admin/affiliates/commissions/route";
import { POST as requestPayoutRoute } from "@/app/api/affiliate/payout/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock dependencies
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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    commission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    payoutRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      if (typeof callback === "function") {
        return callback({
          payoutRequest: {
            create: vi.fn().mockResolvedValue({ id: "payout-new-1", amount: 500000 }),
          },
          commission: {
            updateMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          user: {
            update: vi.fn().mockResolvedValue({ id: "user-aff-1" }),
          },
        });
      }
      return Promise.all(callback);
    }),
  },
}));

describe("Affiliate System Integrity & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Admin Manual Commission Control (PATCH /api/admin/affiliates/commissions)", () => {
    it("should reject non-admin users with 403", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "std-1", role: "STUDENT" },
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId: "comm-1", action: "APPROVE" }),
      });

      const res = await updateCommissionRoute(req);
      expect(res.status).toBe(403);
    });

    it("should successfully approve a pending commission early", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.commission.findUnique).mockResolvedValueOnce({
        id: "comm-1",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.commission.update).mockResolvedValueOnce({
        id: "comm-1",
        status: "APPROVED",
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId: "comm-1", action: "APPROVE" }),
      });

      const res = await updateCommissionRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: "comm-1" },
        data: { status: "APPROVED" },
      });
    });

    it("should reject/void an unpaid commission and unlink pending payout", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.commission.findUnique).mockResolvedValueOnce({
        id: "comm-2",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.commission.update).mockResolvedValueOnce({
        id: "comm-2",
        status: "REJECTED",
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId: "comm-2", action: "REJECT" }),
      });

      const res = await updateCommissionRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: "comm-2" },
        data: { status: "REJECTED", payoutRequestId: null },
      });
    });

    it("should prevent modifying a commission that is already PAID", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.commission.findUnique).mockResolvedValueOnce({
        id: "comm-paid",
        status: "PAID",
      } as any);

      const req = new Request("http://localhost:3000/api/admin/affiliates/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId: "comm-paid", action: "REJECT" }),
      });

      const res = await updateCommissionRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("already been paid");
    });
  });

  describe("Affiliate Payout Request Flow (POST /api/affiliate/payout)", () => {
    it("should reject BLOCKED affiliate accounts with 403", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-blocked", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-blocked",
        status: "BLOCKED",
      } as any);

      const req = new Request("http://localhost:3000/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "MB Bank",
          bankAccountNo: "123456789",
          bankAccountName: "NGUYEN VAN A",
        }),
      });

      const res = await requestPayoutRoute(req);
      expect(res.status).toBe(403);
    });

    it("should reject payout if available balance is less than minimum payout threshold", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-active", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-active",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.payoutRequest.findFirst).mockResolvedValueOnce(null);

      // Only 100,000 VND available (min is 200,000 VND)
      vi.mocked(prisma.commission.findMany).mockResolvedValueOnce([
        { id: "comm-under", commissionAmount: 100000 as any },
      ] as any);

      const req = new Request("http://localhost:3000/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "MB Bank",
          bankAccountNo: "123456789",
          bankAccountName: "NGUYEN VAN A",
        }),
      });

      const res = await requestPayoutRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Minimum payout amount");
    });

    it("should successfully lock full available commissions and create PayoutRequest", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-active", role: "STUDENT" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-active",
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.payoutRequest.findFirst).mockResolvedValueOnce(null);

      // Two cleared commissions totaling 500,000 VND
      vi.mocked(prisma.commission.findMany).mockResolvedValueOnce([
        { id: "comm-1", commissionAmount: 200000 as any },
        { id: "comm-2", commissionAmount: 300000 as any },
      ] as any);

      const req = new Request("http://localhost:3000/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "Techcombank",
          bankAccountNo: "987654321",
          bankAccountName: "TRAN VAN B",
        }),
      });

      const res = await requestPayoutRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
