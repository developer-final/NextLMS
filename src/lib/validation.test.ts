import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  validateRegisterInput,
  isValidSafeUrl,
  safeJsonLdStringify,
} from "./validation";

describe("Auth Validation Logic (TC-AUTH-01)", () => {
  describe("isValidEmail", () => {
    it("should return true for valid email formats", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("student.wtl@domain.co")).toBe(true);
      expect(isValidEmail("name+tag@sub.domain.vn")).toBe(true);
    });

    it("should return false for invalid email formats", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@domain")).toBe(false);
      expect(isValidEmail("user domain@gmail.com")).toBe(false);
    });

    it("should return false for null, undefined or empty string", () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("   ")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("should return true for passwords with 6 to 128 characters", () => {
      expect(isValidPassword("123456")).toBe(true);
      expect(isValidPassword("ComplexPassword123!")).toBe(true);
      expect(isValidPassword("a".repeat(128))).toBe(true);
    });

    it("should return false for passwords shorter than 6 characters", () => {
      expect(isValidPassword("12345")).toBe(false);
      expect(isValidPassword("abc")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });

    it("should return false for passwords longer than 128 characters", () => {
      expect(isValidPassword("a".repeat(129))).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });

  describe("validateRegisterInput", () => {
    it("should accept valid registration input", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "nguyenvana@example.com",
        password: "securePassword123",
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject when name is missing or empty", () => {
      const result = validateRegisterInput({
        name: "   ",
        email: "test@example.com",
        password: "securePassword123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("đầy đủ Tên, Email");
    });

    it("should reject when email is invalid", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "not-an-email",
        password: "securePassword123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("email không hợp lệ");
    });

    it("should reject when password is under 6 characters", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "valid@example.com",
        password: "123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ít nhất 6 ký tự");
    });

    it("should reject when password exceeds 128 characters", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "valid@example.com",
        password: "p".repeat(130),
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("không được vượt quá 128 ký tự");
    });
  });

  describe("isValidSafeUrl (XSS Defense)", () => {
    it("should accept valid http and https URLs", () => {
      expect(isValidSafeUrl("https://example.com/proof.jpg")).toBe(true);
      expect(isValidSafeUrl("http://localhost:3000/uploads/receipt.png")).toBe(true);
      expect(isValidSafeUrl("/images/default-avatar.png")).toBe(true);
    });

    it("should reject javascript: URLs and variants", () => {
      expect(isValidSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isValidSafeUrl("JAVASCRIPT:alert('xss')")).toBe(false);
      expect(isValidSafeUrl("javascript :alert(1)")).toBe(false);
      expect(isValidSafeUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("should reject dangerous data: schemes such as HTML and SVG", () => {
      expect(isValidSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidSafeUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBe(false);
      expect(isValidSafeUrl("data:application/javascript;alert(1)")).toBe(false);
    });

    it("should accept safe base64 raster image data URLs", () => {
      expect(isValidSafeUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==")).toBe(true);
      expect(isValidSafeUrl("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==")).toBe(true);
    });

    it("should reject empty, null or invalid strings", () => {
      expect(isValidSafeUrl(null)).toBe(false);
      expect(isValidSafeUrl(undefined)).toBe(false);
      expect(isValidSafeUrl("")).toBe(false);
    });
  });

  describe("safeJsonLdStringify (JSON-LD Script Breakout Defense)", () => {
    it("should escape script tags and HTML control characters", () => {
      const maliciousData = {
        title: "Forex Course </script><script>alert('xss')</script>",
        description: "Test & Learn <bold>",
      };

      const serialized = safeJsonLdStringify(maliciousData);
      expect(serialized).not.toContain("</script>");
      expect(serialized).toContain("\\u003c/script\\u003e");
      expect(serialized).toContain("\\u0026");
    });
  });
});
