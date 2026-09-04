import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("API Route: /api/admin/courses", () => {
  const mockAdminSession = {
    user: { id: "admin-1", role: "ADMIN", email: "admin@example.com" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/admin/courses (Bulk & Single)", () => {
    it("should return 403 if user is not an admin", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "student-1", role: "STUDENT" },
      } as any);

      const req = new Request("http://localhost/api/admin/courses", {
        method: "PATCH",
        body: JSON.stringify({ id: "course-1", status: "PUBLISHED" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
    });

    it("should update a single course when id is provided", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.course.update).mockResolvedValueOnce({
        id: "c1",
        status: "PUBLISHED",
      } as any);

      const req = new Request("http://localhost/api/admin/courses", {
        method: "PATCH",
        body: JSON.stringify({ id: "c1", status: "PUBLISHED" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { status: "PUBLISHED" },
      });
    });

    it("should bulk update multiple courses when ids array is provided", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.course.updateMany).mockResolvedValueOnce({ count: 3 });

      const req = new Request("http://localhost/api/admin/courses", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["c1", "c2", "c3"],
          status: "DRAFT",
          isFeatured: true,
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      expect(prisma.course.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["c1", "c2", "c3"] } },
        data: { status: "DRAFT", isFeatured: true },
      });
    });
  });

  describe("DELETE /api/admin/courses (Bulk & Single)", () => {
    it("should delete multiple courses successfully if none have order items", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderItem.findMany).mockResolvedValueOnce([]); // No orders
      vi.mocked(prisma.$transaction).mockResolvedValueOnce([]);

      const req = new Request("http://localhost/api/admin/courses", {
        method: "DELETE",
        body: JSON.stringify({ ids: ["c1", "c2"] }),
      });

      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should reject deletion if all selected courses have associated order items", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(mockAdminSession as any);
      vi.mocked(prisma.orderItem.findMany).mockResolvedValueOnce([
        { courseId: "c1" } as any,
      ]);

      const req = new Request("http://localhost/api/admin/courses", {
        method: "DELETE",
        body: JSON.stringify({ ids: ["c1"] }),
      });

      const res = await DELETE(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("associated orders");
    });
  });
});
