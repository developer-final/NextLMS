import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";
import * as s3Module from "@/lib/s3";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      updateMany: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
    },
    attachment: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    blogPost: {
      deleteMany: vi.fn(),
    },
    user: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/s3", () => ({
  deleteFileFromStorage: vi.fn(),
}));

describe("Cron Cleanup Route (/api/cron/cleanup)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-super-secret-key" };

    vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 3 });
    vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 5 });
    vi.mocked(prisma.attachment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.attachment.delete).mockResolvedValue({} as any);
    vi.mocked(prisma.blogPost.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(s3Module.deleteFileFromStorage).mockResolvedValue(true);
  });

  describe("Authentication & Security", () => {
    it("should return 401 Unauthorized if secret is missing", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 401 Unauthorized if secret is incorrect", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup", {
        headers: { Authorization: "Bearer wrong-secret" },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("should authorize successfully with Bearer header", async () => {
      const req = new Request("http://localhost:3000/api/cron/cleanup", {
        headers: { Authorization: "Bearer test-super-secret-key" },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("should authorize successfully with secret query parameter", async () => {
      const req = new Request(
        "http://localhost:3000/api/cron/cleanup?secret=test-super-secret-key"
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Cleanup Operations", () => {
    it("should execute all maintenance tasks and return summary", async () => {
      const fakeOrphanedAttachments = [
        {
          id: "att-1",
          fileName: "orphan.pdf",
          fileUrl: "/uploads/orphan.pdf",
          fileKey: "attachments/orphan.pdf",
          fileSize: 1024,
          fileType: "application/pdf",
          courseId: null,
          lessonId: null,
          postId: null,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      ];

      vi.mocked(prisma.attachment.findMany).mockResolvedValue(
        fakeOrphanedAttachments as any
      );

      const req = new Request(
        "http://localhost:3000/api/cron/cleanup?secret=test-super-secret-key"
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.summary.cancelledOrders).toBe(3);
      expect(json.summary.deletedTokens).toBe(5);
      expect(json.summary.cleanedAttachments).toBe(1);
      expect(json.summary.purgedSoftDeletedPosts).toBe(1);
      expect(json.summary.purgedUnverifiedStudents).toBe(2);

      // Verify Prisma order query
      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
          }),
          data: expect.objectContaining({
            status: "CANCELLED",
          }),
        })
      );

      // Verify verification token deletion
      expect(prisma.verificationToken.deleteMany).toHaveBeenCalled();

      // Verify unverified student accounts deletion
      expect(prisma.user.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: "STUDENT",
            emailVerified: null,
          }),
        })
      );

      // Verify file deletion in storage
      expect(s3Module.deleteFileFromStorage).toHaveBeenCalledWith(
        "attachments/orphan.pdf"
      );
      expect(prisma.attachment.delete).toHaveBeenCalledWith({
        where: { id: "att-1" },
      });
    });

    it("should handle exceptions gracefully and return 500", async () => {
      vi.mocked(prisma.order.updateMany).mockRejectedValueOnce(
        new Error("Database connection lost")
      );

      const req = new Request(
        "http://localhost:3000/api/cron/cleanup?secret=test-super-secret-key"
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Database connection lost");
    });
  });
});
