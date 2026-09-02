import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  validateRegisterInput,
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
    it("should return true for passwords with 6 or more characters", () => {
      expect(isValidPassword("123456")).toBe(true);
      expect(isValidPassword("ComplexPassword123!")).toBe(true);
    });

    it("should return false for passwords shorter than 6 characters", () => {
      expect(isValidPassword("12345")).toBe(false);
      expect(isValidPassword("abc")).toBe(false);
      expect(isValidPassword("")).toBe(false);
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
  });
});
