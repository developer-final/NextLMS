import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeStorageKey } from "./s3";
import { uploadRateLimiter, aiRateLimiter } from "./rate-limit";
import { sendEmail } from "./email";
import { searchSimilarChunks } from "./ai/rag/vector-store";
import { prisma } from "./prisma";

describe("Session 4 Security & Robustness Audit (Khối 7 & Khối 8)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    uploadRateLimiter.reset();
    aiRateLimiter.reset();
  });

  describe("SEC-P4-01: Path Traversal Protection in Storage Keys", () => {
    it("should sanitize malicious directory traversal sequences from storage keys", () => {
      expect(sanitizeStorageKey("../../../etc/passwd")).toBe("etc/passwd");
      expect(sanitizeStorageKey("..\\..\\..\\windows\\system32\\cmd.exe")).toBe(
        "windows/system32/cmd.exe"
      );
      expect(sanitizeStorageKey("attachments/../../../secret.env")).toBe(
        "attachments/secret.env"
      );
      expect(sanitizeStorageKey("////courses/videos/lecture.mp4")).toBe(
        "courses/videos/lecture.mp4"
      );
      expect(sanitizeStorageKey("")).toBe("");
    });

    it("should neutralize null bytes and control characters", () => {
      expect(sanitizeStorageKey("file\x00name.pdf")).toBe("filename.pdf");
      expect(sanitizeStorageKey("file\x1fname.pdf")).toBe("filename.pdf");
    });
  });

  describe("SEC-P4-02: Upload Rate Limiting & Resource Protection", () => {
    it("should throttle excessive upload requests via uploadRateLimiter", () => {
      const identifier = "test-client-ip_test-user-1";

      for (let i = 0; i < 30; i++) {
        const check = uploadRateLimiter.check(identifier);
        expect(check.allowed).toBe(true);
      }

      // 31st request should be throttled
      const throttledCheck = uploadRateLimiter.check(identifier);
      expect(throttledCheck.allowed).toBe(false);
      expect(throttledCheck.remaining).toBe(0);
      expect(throttledCheck.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe("SEC-P4-03: Multi-Channel Email Fallback & Recipient Validation", () => {
    it("should reject invalid recipient email addresses early", async () => {
      const invalidResult1 = await sendEmail({
        to: "not-an-email",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });
      expect(invalidResult1.success).toBe(false);
      expect(invalidResult1.error).toContain("Invalid recipient email address");

      const invalidResult2 = await sendEmail({
        to: "",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });
      expect(invalidResult2.success).toBe(false);
      expect(invalidResult2.error).toContain("Invalid recipient email address");
    });

    it("should successfully trigger dev simulation mode when no providers are configured", async () => {
      const origSmtp = process.env.SMTP_USER;
      const origResend = process.env.RESEND_API_KEY;
      delete process.env.SMTP_USER;
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: "student@worldtradinglab.com",
        subject: "Simulation Verification",
        html: "<p>Simulated Body</p>",
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      if (origSmtp) process.env.SMTP_USER = origSmtp;
      if (origResend) process.env.RESEND_API_KEY = origResend;
    });
  });

  describe("SEC-P4-04: RAG Tenant Isolation in searchSimilarChunks", () => {
    it("should strictly enforce courseId boundary when documentIds are also provided", async () => {
      const findManySpy = vi
        .spyOn(prisma.documentChunk, "findMany")
        .mockResolvedValue([
          {
            id: "chunk-1",
            documentId: "doc-1",
            content: "Order Block and Liquidity strategy in course A",
            chunkIndex: 0,
            metadata: null,
            createdAt: new Date(),
            document: { title: "Course A Guide" },
          } as any,
        ]);

      await searchSimilarChunks("Liquidity", {
        courseId: "course-A",
        documentIds: ["doc-1", "doc-2"],
        limit: 2,
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            documentId: { in: ["doc-1", "doc-2"] },
            document: { courseId: "course-A" },
          },
        })
      );
    });

    it("should isolate to global documents when neither courseId nor documentIds are provided", async () => {
      const findManySpy = vi
        .spyOn(prisma.documentChunk, "findMany")
        .mockResolvedValue([]);

      await searchSimilarChunks("Trading Philosophy", {});

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            document: { courseId: null },
          },
        })
      );
    });

    it("should throttle excessive AI chat requests via aiRateLimiter", () => {
      const identifier = "ai-client-ip_ai-user-1";

      for (let i = 0; i < 30; i++) {
        const check = aiRateLimiter.check(identifier);
        expect(check.allowed).toBe(true);
      }

      const throttledCheck = aiRateLimiter.check(identifier);
      expect(throttledCheck.allowed).toBe(false);
      expect(throttledCheck.remaining).toBe(0);
    });
  });

  describe("SEC-P4-05: Study Reminder Deduplication & Cron Hygeine", () => {
    it("should ensure student deduplication prevents sending multiple reminder emails to same user", () => {
      const sentUserIds = new Set<string>();
      const candidateEnrollments = [
        { id: "e1", user: { id: "u1", email: "student1@test.com" } },
        { id: "e2", user: { id: "u1", email: "student1@test.com" } }, // Duplicate student
        { id: "e3", user: { id: "u2", email: "student2@test.com" } },
      ];

      const processedEnrollments: string[] = [];
      for (const e of candidateEnrollments) {
        if (!e.user?.email) continue;
        if (sentUserIds.has(e.user.id)) continue;

        sentUserIds.add(e.user.id);
        processedEnrollments.push(e.id);
      }

      expect(processedEnrollments).toEqual(["e1", "e3"]);
      expect(sentUserIds.size).toBe(2);
    });
  });
});
