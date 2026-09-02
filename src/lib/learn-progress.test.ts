import { describe, it, expect } from "vitest";
import { calculateCourseProgress, generateCertificateCode } from "./learn-progress";

describe("LMS Progress Tracking (TC-LMS-02)", () => {
  describe("calculateCourseProgress", () => {
    it("should return 0% when course has no lessons", () => {
      expect(calculateCourseProgress(0, 0)).toEqual({
        progressPercent: 0,
        isCompleted: false,
      });
      expect(calculateCourseProgress(5, 0)).toEqual({
        progressPercent: 0,
        isCompleted: false,
      });
    });

    it("should calculate progress correctly for partial completion", () => {
      // 1 out of 3 -> 33%
      expect(calculateCourseProgress(1, 3)).toEqual({
        progressPercent: 33,
        isCompleted: false,
      });

      // 1 out of 2 -> 50%
      expect(calculateCourseProgress(1, 2)).toEqual({
        progressPercent: 50,
        isCompleted: false,
      });

      // 2 out of 3 -> 67%
      expect(calculateCourseProgress(2, 3)).toEqual({
        progressPercent: 67,
        isCompleted: false,
      });
    });

    it("should return 100% and isCompleted: true when all lessons are finished", () => {
      expect(calculateCourseProgress(10, 10)).toEqual({
        progressPercent: 100,
        isCompleted: true,
      });
    });

    it("should clamp progress at 100% even if completed exceeds total lessons", () => {
      expect(calculateCourseProgress(12, 10)).toEqual({
        progressPercent: 100,
        isCompleted: true,
      });
    });

    it("should handle negative completed count gracefully", () => {
      expect(calculateCourseProgress(-1, 5)).toEqual({
        progressPercent: 0,
        isCompleted: false,
      });
    });
  });

  describe("generateCertificateCode", () => {
    it("should start with prefix CERT-", () => {
      const code = generateCertificateCode();
      expect(code.startsWith("CERT-")).toBe(true);
    });

    it("should have 12 alphanumeric characters after the prefix", () => {
      const code = generateCertificateCode();
      const parts = code.split("-");
      expect(parts.length).toBe(2);
      expect(parts[1].length).toBe(12);
    });

    it("should generate unique codes on multiple calls", () => {
      const code1 = generateCertificateCode();
      const code2 = generateCertificateCode();
      expect(code1).not.toBe(code2);
    });
  });
});
