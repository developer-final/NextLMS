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
  validateFileUpload,
  validateProfileUpdate,
  validateChangePassword,
  validateBlogPostInput,
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
        email: "valid@example.com",
        password: "securePassword123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Please provide Name, Email, and Password");
    });

    it("should reject when email is invalid", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "not-an-email",
        password: "securePassword123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid email address format");
    });

    it("should reject when password is under 6 characters", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "valid@example.com",
        password: "123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Password must be at least 6 characters long");
    });

    it("should reject when password exceeds 128 characters", () => {
      const result = validateRegisterInput({
        name: "Nguyen Van A",
        email: "valid@example.com",
        password: "p".repeat(130),
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Password cannot exceed 128 characters");
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
      expect(res.error).toContain("Sale price cannot be greater than original price");
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
      expect(res.error).toContain("Percentage discount cannot exceed 100%");
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
      expect(res.error).toContain("Comment content cannot exceed 2000 characters");
    });
  });

  describe("Avatar Upload Validation", () => {
    // Valid PNG buffer header: 89 50 4E 47
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // Valid JPEG buffer header: FF D8 FF
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

    it("should accept valid avatar image with matching magic bytes", () => {
      const result = validateFileUpload({
        buffer: validPngBuffer,
        fileName: "my-avatar.png",
        mimeType: "image/png",
        type: "avatar",
      });
      expect(result.isValid).toBe(true);
      expect(result.fileExt).toBe("png");
    });

    it("should reject avatar with unsupported extension like .gif or .exe", () => {
      const result = validateFileUpload({
        buffer: validPngBuffer,
        fileName: "malicious.exe",
        type: "avatar",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("blocked for security reasons");

      const gifResult = validateFileUpload({
        buffer: Buffer.from("GIF89a..."),
        fileName: "avatar.gif",
        type: "avatar",
      });
      expect(gifResult.isValid).toBe(false);
      expect(gifResult.error).toContain("Avatar only accepts");
    });

    it("should reject avatar exceeding size limit", () => {
      const largeBuffer = Buffer.concat([validJpgBuffer, Buffer.alloc(6 * 1024 * 1024)]);
      const result = validateFileUpload({
        buffer: largeBuffer,
        fileName: "huge-avatar.jpg",
        mimeType: "image/jpeg",
        type: "avatar",
        maxSizeMb: 5,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed limit");
    });
  });

  describe("Receipt Upload Validation", () => {
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);

    it("should accept valid receipt payment proof image", () => {
      const result = validateFileUpload({
        buffer: validJpgBuffer,
        fileName: "bank-transfer-receipt.jpg",
        mimeType: "image/jpeg",
        type: "receipt",
      });
      expect(result.isValid).toBe(true);
      expect(result.fileExt).toBe("jpg");
    });

    it("should reject receipt with non-image format", () => {
      const result = validateFileUpload({
        buffer: Buffer.from("%PDF-1.4..."),
        fileName: "receipt.pdf",
        type: "receipt",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Receipt only accepts image formats");
    });

    it("should reject receipt exceeding size limit", () => {
      const largeBuffer = Buffer.concat([validPngBuffer, Buffer.alloc(11 * 1024 * 1024)]);
      const result = validateFileUpload({
        buffer: largeBuffer,
        fileName: "huge-receipt.png",
        mimeType: "image/png",
        type: "receipt",
        maxSizeMb: 10,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed limit");
    });
  });

  describe("validateProfileUpdate", () => {
    it("should accept valid profile input", () => {
      const result = validateProfileUpdate({
        name: "Nguyen Van A",
        headline: "Senior Forex Trader & Mentor",
        bio: "Experienced in price action and risk management.",
      });
      expect(result.isValid).toBe(true);
      expect(result.sanitized?.name).toBe("Nguyen Van A");
      expect(result.sanitized?.headline).toBe("Senior Forex Trader & Mentor");
    });

    it("should reject empty or too short name", () => {
      expect(validateProfileUpdate({ name: "" }).isValid).toBe(false);
      expect(validateProfileUpdate({ name: "   " }).isValid).toBe(false);
      expect(validateProfileUpdate({ name: "A" }).isValid).toBe(false);
    });

    it("should reject headline exceeding 150 characters", () => {
      const result = validateProfileUpdate({
        name: "Valid Name",
        headline: "x".repeat(151),
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("headline");
    });

    it("should reject bio exceeding 1000 characters", () => {
      const result = validateProfileUpdate({
        name: "Valid Name",
        bio: "x".repeat(1001),
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("bio");
    });
  });

  describe("validateChangePassword", () => {
    it("should accept valid password change with current password", () => {
      const result = validateChangePassword({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
      });
      expect(result.isValid).toBe(true);
    });

    it("should reject if current password is missing when required", () => {
      const result = validateChangePassword({
        currentPassword: "",
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
        requireCurrentPassword: true,
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("currentPassword");
    });

    it("should allow missing current password when requireCurrentPassword is false (OAuth account)", () => {
      const result = validateChangePassword({
        newPassword: "NewPassword456",
        confirmPassword: "NewPassword456",
        requireCurrentPassword: false,
      });
      expect(result.isValid).toBe(true);
    });

    it("should reject if new password is too short (< 6 chars)", () => {
      const result = validateChangePassword({
        currentPassword: "OldPassword123",
        newPassword: "123",
        confirmPassword: "123",
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("newPassword");
    });

    it("should reject if confirmation does not match", () => {
      const result = validateChangePassword({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmPassword: "DifferentPassword789",
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("confirmPassword");
    });

    it("should reject if new password is identical to current password", () => {
      const result = validateChangePassword({
        currentPassword: "SamePassword123",
        newPassword: "SamePassword123",
        confirmPassword: "SamePassword123",
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("New password cannot be the same as current password");
    });
  });

  describe("validateBlogPostInput", () => {
    it("should accept valid blog post input and sanitize fields", () => {
      const result = validateBlogPostInput({
        title: "  Kiến thức Trading cơ bản  ",
        content: "# Giới thiệu\nNội dung bài viết chi tiết với <script>alert(1)</script>",
        summary: "<b>Tóm tắt ngắn gọn</b>",
        tagNames: ["Trading", "Forex", "Trading"],
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.title).toBe("Kiến thức Trading cơ bản");
      expect(result.sanitized?.content).not.toContain("<script>");
      expect(result.sanitized?.summary).toBe("Tóm tắt ngắn gọn");
      expect(result.sanitized?.tagNames).toEqual(["Trading", "Forex"]);
    });

    it("should reject empty or missing title", () => {
      const result = validateBlogPostInput({
        title: "   ",
        content: "Nội dung hợp lệ",
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("title");
    });

    it("should reject too short content", () => {
      const result = validateBlogPostInput({
        title: "Tiêu đề chuẩn",
        content: "123",
      });
      expect(result.isValid).toBe(false);
      expect(result.field).toBe("content");
    });
  });
});

