import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { en } from "./i18n/en";
import { vi } from "./i18n/vi";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("Session 5 Audit: Khối 9 (i18n, SEO, Theme) & Khối 10 (Prisma DB, Migrations)", () => {
  describe("SEC-P5-01: Centralized i18n Dictionary Integrity & Completeness", () => {
    it("should ensure all new AI Copilot and Course Generator keys are present in both en and vi dictionaries", () => {
      const requiredAiKeys = [
        "topicRequired",
        "generatePlanFailed",
        "planNetworkError",
        "settingUpStructure",
        "generatingLessonContent",
        "uploadDocSuccess",
        "uploadDocFailed",
        "uploadDocNetworkError",
        "generateArticleSuccess",
        "generateArticleFailed",
        "generateArticleNetworkError",
        "appliedAllToArticle",
        "appliedTitle",
        "appliedSeo",
        "insertedToContent",
        "replacedSelection",
        "insertedToCourseDesc",
        "contextDocsTitle",
        "contextDocsSubtitle",
        "promptImproveStyle",
        "promptIntroHook",
        "promptExpandPractical",
        "promptQuizGeneration",
      ] as const;

      for (const key of requiredAiKeys) {
        expect(en.admin.ai[key], `en.admin.ai.${key} must be defined`).toBeDefined();
        expect(typeof en.admin.ai[key]).toBe("string");
        expect(en.admin.ai[key].trim().length).toBeGreaterThan(0);

        expect(vi.admin.ai[key], `vi.admin.ai.${key} must be defined`).toBeDefined();
        expect(typeof vi.admin.ai[key]).toBe("string");
        expect(vi.admin.ai[key].trim().length).toBeGreaterThan(0);
      }
    });

    it("should guarantee identical key structure between en and vi dictionaries across all root sections", () => {
      const enKeys = Object.keys(en).sort();
      const viKeys = Object.keys(vi).sort();
      expect(enKeys).toEqual(viKeys);

      // Check admin keys equality
      const enAdminKeys = Object.keys(en.admin).sort();
      const viAdminKeys = Object.keys(vi.admin).sort();
      expect(enAdminKeys).toEqual(viAdminKeys);

      // Check admin.ai keys equality
      const enAiKeys = Object.keys(en.admin.ai).sort();
      const viAiKeys = Object.keys(vi.admin.ai).sort();
      expect(enAiKeys).toEqual(viAiKeys);
    });
  });

  describe("SEC-P5-02: SEO Optimization & Robot Crawl Policy", () => {
    it("should verify robots.txt contains blog, courses, affiliate and certificates in allowed paths", () => {
      const robotsConfig = robots();
      expect(robotsConfig).toBeDefined();
      expect(robotsConfig.rules).toBeDefined();

      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;

      expect(rules).toBeDefined();
      const allowedPaths = Array.isArray(rules?.allow) ? rules.allow : [];

      expect(allowedPaths).toContain("/blog");
      expect(allowedPaths).toContain("/blog/*");
      expect(allowedPaths).toContain("/courses");
      expect(allowedPaths).toContain("/courses/*");
      expect(allowedPaths).toContain("/affiliate");
      expect(allowedPaths).toContain("/certificates/*");

      const disallowedPaths = Array.isArray(rules?.disallow) ? rules.disallow : [];
      expect(disallowedPaths).toContain("/admin");
      expect(disallowedPaths).toContain("/admin/*");
      expect(disallowedPaths).toContain("/learn");
      expect(disallowedPaths).toContain("/learn/*");
      expect(disallowedPaths).toContain("/checkout/*");
      expect(disallowedPaths).toContain("/api/*");
    });

    it("should verify sitemap generates static routes including blog and courses", async () => {
      const sitemapEntries = await sitemap();
      expect(Array.isArray(sitemapEntries)).toBe(true);

      const urls = sitemapEntries.map((entry) => entry.url);
      expect(urls.some((u) => u.endsWith("/courses"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/blog"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/about"))).toBe(true);
    });
  });

  describe("SEC-P5-03 & SEC-P5-04: Prisma Schema Composite Indexes & Migration Idempotency", () => {
    it("should verify schema.prisma contains high-performance composite indexes", () => {
      const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");

      // User composite index
      expect(schemaContent).toContain("@@index([role, status, createdAt(sort: Desc)])");

      // Enrollment composite index
      expect(schemaContent).toContain("@@index([userId, status])");

      // Review composite index
      expect(schemaContent).toContain("@@index([courseId, isApproved])");

      // Commission composite index
      expect(schemaContent).toContain("@@index([status, availableAt])");
    });

    it("should verify migration 20260916000000_optimize_performance_indexes is versioned and strictly idempotent", () => {
      const migrationPath = path.resolve(
        process.cwd(),
        "prisma/migrations/20260916000000_optimize_performance_indexes/migration.sql"
      );

      expect(fs.existsSync(migrationPath)).toBe(true);
      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      // Verify all CREATE INDEX statements use IF NOT EXISTS for non-destructive deployment
      expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS "users_role_status_createdAt_idx"');
      expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS "enrollments_userId_status_idx"');
      expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS "reviews_courseId_isApproved_idx"');
      expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS "commissions_status_availableAt_idx"');
    });
  });
});
