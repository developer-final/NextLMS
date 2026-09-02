import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  validateRegisterInput,
  isValidSafeUrl,
  safeJsonLdStringify,
  validateCourseInput,
  validateCouponInput,
  validateBankSettingsInput,
  validateCommentInput,
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

  describe("validateCourseInput", () => {
    const validCourse = {
      title: "Khoa Hoc Trading SMC Chuyen Sau 2026",
      price: 2000000,
      salePrice: 1500000,
      isFree: false,
      sections: [
        {
          title: "Chuong 1: Tong Quan",
          lessons: [{ title: "Bai 1: Gioi thieu", videoDuration: 600 }],
        },
      ],
    };

    it("should accept valid course input", () => {
      const res = validateCourseInput(validCourse);
      expect(res.isValid).toBe(true);
    });

    it("should reject title shorter than 5 characters or empty", () => {
      expect(validateCourseInput({ ...validCourse, title: "" }).isValid).toBe(false);
      expect(validateCourseInput({ ...validCourse, title: "Abc" }).isValid).toBe(false);
      expect(validateCourseInput({ ...validCourse, title: null }).isValid).toBe(false);
    });

    it("should reject negative price", () => {
      const res = validateCourseInput({ ...validCourse, price: -50000 });
      expect(res.isValid).toBe(false);
      expect(res.field).toBe("price");
    });

    it("should reject salePrice greater than base price", () => {
      const res = validateCourseInput({ ...validCourse, price: 1000000, salePrice: 1500000 });
      expect(res.isValid).toBe(false);
      expect(res.field).toBe("salePrice");
      expect(res.error).toContain("không được lớn hơn giá gốc");
    });

    it("should reject course with empty sections", () => {
      const res = validateCourseInput({ ...validCourse, sections: [] });
      expect(res.isValid).toBe(false);
      expect(res.field).toBe("sections");
    });

    it("should reject section with no lessons", () => {
      const res = validateCourseInput({
        ...validCourse,
        sections: [{ title: "Chuong 1", lessons: [] }],
      });
      expect(res.isValid).toBe(false);
      expect(res.field).toContain("lessons");
    });
  });

  describe("validateCouponInput", () => {
    it("should accept valid percentage coupon", () => {
      const res = validateCouponInput({
        code: "SMC2026",
        discountType: "PERCENT",
        discountValue: 30,
        maxUsage: 50,
        minOrderValue: 500000,
      });
      expect(res.isValid).toBe(true);
    });

    it("should accept valid fixed amount coupon", () => {
      const res = validateCouponInput({
        code: "DISCOUNT_100K",
        discountType: "FIXED_AMOUNT",
        discountValue: 100000,
        maxUsage: 10,
      });
      expect(res.isValid).toBe(true);
    });

    it("should reject coupon code with invalid characters or spaces", () => {
      expect(validateCouponInput({ code: "SALE 20", discountType: "PERCENT", discountValue: 10 }).isValid).toBe(false);
      expect(validateCouponInput({ code: "AB", discountType: "PERCENT", discountValue: 10 }).isValid).toBe(false);
      expect(validateCouponInput({ code: "MÃGIẢM", discountType: "PERCENT", discountValue: 10 }).isValid).toBe(false);
    });

    it("should reject percentage discount exceeding 100%", () => {
      const res = validateCouponInput({
        code: "FREEALL",
        discountType: "PERCENT",
        discountValue: 150,
      });
      expect(res.isValid).toBe(false);
      expect(res.field).toBe("discountValue");
      expect(res.error).toContain("không được vượt quá 100%");
    });

    it("should reject negative discount value or 0", () => {
      expect(validateCouponInput({ code: "SALE", discountType: "FIXED_AMOUNT", discountValue: 0 }).isValid).toBe(false);
      expect(validateCouponInput({ code: "SALE", discountType: "FIXED_AMOUNT", discountValue: -10 }).isValid).toBe(false);
    });
  });

  describe("validateBankSettingsInput", () => {
    it("should accept valid bank settings", () => {
      const res = validateBankSettingsInput({
        bankId: "MB",
        bankAccountNo: "0988888888",
        bankAccountName: "WORLD TRADING LAB",
      });
      expect(res.isValid).toBe(true);
    });

    it("should reject missing bankId or account number", () => {
      expect(validateBankSettingsInput({ bankId: "", bankAccountNo: "12345678", bankAccountName: "ABC" }).isValid).toBe(false);
      expect(validateBankSettingsInput({ bankId: "MB", bankAccountNo: "", bankAccountName: "ABC" }).isValid).toBe(false);
    });

    it("should reject account numbers with invalid length or characters", () => {
      expect(validateBankSettingsInput({ bankId: "MB", bankAccountNo: "123", bankAccountName: "ABC" }).isValid).toBe(false);
      expect(validateBankSettingsInput({ bankId: "MB", bankAccountNo: "12345@#$%", bankAccountName: "ABC" }).isValid).toBe(false);
    });
  });

  describe("validateCommentInput", () => {
    it("should accept valid comments", () => {
      const res = validateCommentInput({
        lessonId: "lesson-1",
        content: "Thầy cho em hỏi điểm vào lệnh ở phút 08:35 là gì ạ?",
      });
      expect(res.isValid).toBe(true);
    });

    it("should reject empty or whitespace comments", () => {
      expect(validateCommentInput({ lessonId: "l-1", content: "" }).isValid).toBe(false);
      expect(validateCommentInput({ lessonId: "l-1", content: "   " }).isValid).toBe(false);
      expect(validateCommentInput({ lessonId: "l-1", content: "a" }).isValid).toBe(false);
    });

    it("should reject comments exceeding 2000 characters", () => {
      const longComment = "a".repeat(2001);
      const res = validateCommentInput({ lessonId: "l-1", content: longComment });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("không được vượt quá 2000 ký tự");
    });
  });
});
