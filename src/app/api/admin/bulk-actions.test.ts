import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST as approveOrders } from "./orders/approve/route";
import { POST as enrollManual, PATCH as patchStudents } from "./enrollments/manual/route";
import { PATCH as patchPosts, DELETE as deletePosts } from "./posts/route";
import { PATCH as patchCoupons, DELETE as deleteCoupons } from "./coupons/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/payment-service", () => ({
  completeOrderAndEnroll: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      updateMany: vi.fn(),
    },
    enrollment: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    blogPost: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    coupon: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

describe("Admin Bulk Actions API Verification", () => {
  const mockAdminSession = {
    user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Orders Bulk Actions (/api/admin/orders/approve)", () => {
    it("should approve multiple orders successfully", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
        {
          id: "ord-1",
          orderCode: "ORD001",
          status: "PENDING",
          finalAmount: 500000,
          paymentMethod: "VIETQR",
          proofImageUrl: null,
          user: { id: "u1" },
          orderItems: [],
        },
        {
          id: "ord-2",
          orderCode: "ORD002",
          status: "PENDING",
          finalAmount: 700000,
          paymentMethod: "VIETQR",
          proofImageUrl: null,
          user: { id: "u2" },
          orderItems: [],
        },
      ] as any);

      const req = new Request("http://localhost/api/admin/orders/approve", {
        method: "POST",
        body: JSON.stringify({
          orderIds: ["ord-1", "ord-2"],
          action: "APPROVE",
        }),
      });

      const res = await approveOrders(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should cancel multiple orders successfully", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
        {
          id: "ord-1",
          orderCode: "ORD001",
          status: "PENDING",
          finalAmount: 500000,
          paymentMethod: "VIETQR",
          user: { id: "u1" },
          orderItems: [],
        },
      ] as any);

      const req = new Request("http://localhost/api/admin/orders/approve", {
        method: "POST",
        body: JSON.stringify({
          orderIds: ["ord-1"],
          action: "CANCEL",
        }),
      });

      const res = await approveOrders(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
    });
  });

  describe("Students Bulk Actions (/api/admin/enrollments/manual)", () => {
    it("should update status for multiple students via PATCH", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.user.updateMany).mockResolvedValueOnce({ count: 3 } as any);

      const req = new Request("http://localhost/api/admin/enrollments/manual", {
        method: "PATCH",
        body: JSON.stringify({
          userIds: ["u1", "u2", "u3"],
          status: "BLOCKED",
        }),
      });

      const res = await patchStudents(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
    });

    it("should grant course access to multiple students via POST", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.enrollment.upsert).mockResolvedValue({ id: "enr-1" } as any);

      const req = new Request("http://localhost/api/admin/enrollments/manual", {
        method: "POST",
        body: JSON.stringify({
          userIds: ["u1", "u2"],
          courseId: "course-100",
        }),
      });

      const res = await enrollManual(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });
  });

  describe("Blog Posts Bulk Actions (/api/admin/posts)", () => {
    it("should bulk update post status via PATCH", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.blogPost.updateMany).mockResolvedValueOnce({ count: 2 } as any);

      const req = new Request("http://localhost/api/admin/posts", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["p1", "p2"],
          status: "PUBLISHED",
        }),
      });

      const res = await patchPosts(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should bulk delete posts via DELETE", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.blogPost.deleteMany).mockResolvedValueOnce({ count: 2 } as any);

      const req = new Request("http://localhost/api/admin/posts", {
        method: "DELETE",
        body: JSON.stringify({
          ids: ["p1", "p2"],
        }),
      });

      const res = await deletePosts(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });
  });

  describe("Coupons Bulk Actions (/api/admin/coupons)", () => {
    it("should bulk toggle coupon active status via PATCH", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.coupon.updateMany).mockResolvedValueOnce({ count: 4 } as any);

      const req = new Request("http://localhost/api/admin/coupons", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["c1", "c2", "c3", "c4"],
          isActive: false,
        }),
      });

      const res = await patchCoupons(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(4);
    });

    it("should bulk delete coupons via DELETE", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.coupon.deleteMany).mockResolvedValueOnce({ count: 3 } as any);

      const req = new Request("http://localhost/api/admin/coupons", {
        method: "DELETE",
        body: JSON.stringify({
          ids: ["c1", "c2", "c3"],
        }),
      });

      const res = await deleteCoupons(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
    });
  });
});
