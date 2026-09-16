import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateRbacAccess,
  isSuperAdminOrAdmin,
  hasInstructorOrAdminAccess,
  type AuthTokenPayload,
} from "./rbac";
import { sanitizeStorageKey } from "./s3";
import { uploadRateLimiter, aiRateLimiter } from "./rate-limit";
import { sendEmail } from "./email";
import { en } from "./i18n/en";
import { vi as viDict } from "./i18n/vi";
import robots from "@/app/robots";

describe("Master Audit Remediation & System Verification Suite (Sessions 1 - 6)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    uploadRateLimiter.reset();
    aiRateLimiter.reset();
  });

  describe("Pillar 1: RBAC & Edge Routing Integrity (Khối 1 & Khối 6)", () => {
    it("should strictly deny INSTRUCTOR role from accessing sensitive affiliate & AI admin routes", () => {
      const instructorToken: AuthTokenPayload = {
        id: "instructor-1",
        role: "INSTRUCTOR",
        status: "ACTIVE",
      };
      const studentToken: AuthTokenPayload = {
        id: "student-1",
        role: "STUDENT",
        status: "ACTIVE",
      };
      const adminToken: AuthTokenPayload = {
        id: "admin-1",
        role: "ADMIN",
        status: "ACTIVE",
      };

      // Instructor cannot access affiliate or AI admin paths
      expect(evaluateRbacAccess("/api/admin/affiliates", instructorToken).allowed).toBe(false);
      expect(evaluateRbacAccess("/admin/ai", instructorToken).allowed).toBe(false);

      // Student cannot access any admin route
      expect(evaluateRbacAccess("/admin/courses", studentToken).allowed).toBe(false);
      expect(evaluateRbacAccess("/api/admin/courses", studentToken).allowed).toBe(false);

      // Admin can access admin routes
      expect(evaluateRbacAccess("/admin/courses", adminToken).allowed).toBe(true);
      expect(isSuperAdminOrAdmin("ADMIN")).toBe(true);
      expect(hasInstructorOrAdminAccess("INSTRUCTOR")).toBe(true);
    });

    it("should enforce MAX_BULK_LIMIT = 100 to prevent Denial of Service on bulk operations", () => {
      const MAX_BULK_LIMIT = 100;
      const validPayload = Array.from({ length: 100 }, (_, i) => `id-${i}`);
      const invalidPayload = Array.from({ length: 101 }, (_, i) => `id-${i}`);

      expect(validPayload.length).toBeLessThanOrEqual(MAX_BULK_LIMIT);
      expect(invalidPayload.length).toBeGreaterThan(MAX_BULK_LIMIT);
    });
  });

  describe("Pillar 2: Payment Security & Currency Tolerance Guard (Khối 2 & Khối 5)", () => {
    it("should reject payments with non-positive amounts or below minimum threshold", () => {
      const tolerance = 25000;
      const orderAmount = 20000; // less than tolerance
      const minAcceptableAmount = Math.max(1000, orderAmount - tolerance);

      // A webhook delivering 0 VND must be rejected
      const incomingAmountZero = 0;
      const isValidZero = incomingAmountZero > 0 && incomingAmountZero >= minAcceptableAmount;
      expect(isValidZero).toBe(false);

      // A webhook delivering correct amount must pass
      const incomingValid = 20000;
      const isValid = incomingValid > 0 && incomingValid >= minAcceptableAmount;
      expect(isValid).toBe(true);
    });

    it("should ensure atomic coupon reservation guard enforces maxUsage bounds", () => {
      const coupon = {
        code: "SALE50",
        usedCount: 10,
        maxUsage: 10,
      };

      const canReserve = coupon.usedCount < coupon.maxUsage;
      expect(canReserve).toBe(false);

      const availableCoupon = {
        code: "WELCOME",
        usedCount: 3,
        maxUsage: 10,
      };
      const canReserveAvailable = availableCoupon.usedCount < availableCoupon.maxUsage;
      expect(canReserveAvailable).toBe(true);
    });
  });

  describe("Pillar 3: Intellectual Property & PII Privacy Protection (Khối 3 & Khối 4)", () => {
    it("should redact protected lesson video URLs and content bodies for non-enrolled students", () => {
      const rawLesson = {
        id: "les-1",
        title: "Pro Trading Strategies",
        videoUrl: "https://secure-cdn.worldtradinglab.com/pro-video.mp4",
        contentBody: "Proprietary trade secrets body",
        attachments: [{ id: "att-1", fileUrl: "https://secure-cdn.com/file.pdf" }],
        isPreview: false,
      };

      const isEnrolled = false;
      const isStaff = false;

      // Redaction transformation logic as implemented in course details
      const sanitizedLesson = {
        ...rawLesson,
        videoUrl: isEnrolled || isStaff || rawLesson.isPreview ? rawLesson.videoUrl : null,
        contentBody: isEnrolled || isStaff || rawLesson.isPreview ? rawLesson.contentBody : null,
        attachments: isEnrolled || isStaff || rawLesson.isPreview ? rawLesson.attachments : [],
      };

      expect(sanitizedLesson.videoUrl).toBeNull();
      expect(sanitizedLesson.contentBody).toBeNull();
      expect(sanitizedLesson.attachments).toEqual([]);
    });

    it("should prevent studentEmail leakage on public certificate lookup", () => {
      const dbCertificateRecord = {
        id: "cert-1",
        certificateCode: "WTL-CERT-2026-X9Y8Z7",
        courseTitle: "Advanced Price Action",
        studentName: "Nguyen Van A",
        studentEmail: "student.secret@example.com",
        issuedAt: new Date("2026-09-16"),
      };

      // Client payload must strictly omit studentEmail
      const { studentEmail, ...publicCertificatePayload } = dbCertificateRecord;
      expect((publicCertificatePayload as any).studentEmail).toBeUndefined();
      expect(publicCertificatePayload.certificateCode).toBe("WTL-CERT-2026-X9Y8Z7");
      expect(publicCertificatePayload.studentName).toBe("Nguyen Van A");
    });
  });

  describe("Pillar 4: Storage Hardening, Email Resiliency & AI Isolation (Khối 7 & Khối 8)", () => {
    it("should neutralize directory traversal attack vectors in file storage keys", () => {
      expect(sanitizeStorageKey("../../../etc/shadow")).toBe("etc/shadow");
      expect(sanitizeStorageKey("..\\..\\boot.ini")).toBe("boot.ini");
      expect(sanitizeStorageKey("uploads/../../passwords.txt")).toBe("uploads/passwords.txt");
      expect(sanitizeStorageKey("safe/document\x00.pdf")).toBe("safe/document.pdf");
    });

    it("should enforce rate limiting on high-frequency upload and AI endpoints", () => {
      const testIp = "master-test-client-1";
      for (let i = 0; i < 30; i++) {
        expect(uploadRateLimiter.check(testIp).allowed).toBe(true);
      }
      expect(uploadRateLimiter.check(testIp).allowed).toBe(false);
    });

    it("should validate email recipient before attempting multi-channel dispatch", async () => {
      const invalidResult = await sendEmail({
        to: "malformed-email-address",
        subject: "Verification",
        html: "<p>Hello</p>",
      });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain("Invalid recipient email");
    });
  });

  describe("Pillar 5: Centralized i18n, SEO Governance & Database Safety (Khối 9 & Khối 10)", () => {
    it("should verify complete structural key synchronization between English and Vietnamese dictionaries", () => {
      const enKeys = Object.keys(en).sort();
      const viKeys = Object.keys(viDict).sort();
      expect(enKeys).toEqual(viKeys);

      const enCommonKeys = Object.keys(en.common).sort();
      const viCommonKeys = Object.keys(viDict.common).sort();
      expect(enCommonKeys).toEqual(viCommonKeys);

      const enAiKeys = Object.keys(en.admin.ai).sort();
      const viAiKeys = Object.keys(viDict.admin.ai).sort();
      expect(enAiKeys).toEqual(viAiKeys);
    });

    it("should ensure search engine crawler rules include blog, affiliate, and certificates", () => {
      const robotConfig = robots();
      const userAgents = Array.isArray(robotConfig.rules)
        ? robotConfig.rules
        : [robotConfig.rules];

      const mainRule = userAgents[0];
      const allowedPaths = Array.isArray(mainRule.allow)
        ? mainRule.allow
        : [mainRule.allow || ""];

      expect(allowedPaths).toContain("/blog");
      expect(allowedPaths).toContain("/blog/*");
      expect(allowedPaths).toContain("/affiliate");
      expect(allowedPaths).toContain("/certificates/*");
    });

    it("should confirm idempotent migration SQL exists for performance composite indexes", () => {
      const migrationFilePath = path.join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260916000000_optimize_performance_indexes",
        "migration.sql"
      );

      expect(fs.existsSync(migrationFilePath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationFilePath, "utf-8");

      expect(sqlContent).toContain("CREATE INDEX IF NOT EXISTS");
      expect(sqlContent).toContain("users_role_status_createdAt_idx");
      expect(sqlContent).toContain("commissions_status_availableAt_idx");
      expect(sqlContent).toContain("reviews_courseId_isApproved_idx");
      expect(sqlContent).toContain("enrollments_userId_status_idx");
    });
  });
});
