import { describe, it, expect } from "vitest";
import {
  formatVND,
  formatDuration,
  generateOrderCode,
  getYouTubeEmbedUrl,
  slugify,
  cn,
} from "./utils";

describe("Utils Library", () => {
  describe("formatVND", () => {
    it("should return 'Miễn phí' when amount is 0", () => {
      expect(formatVND(0)).toBe("Miễn phí");
    });

    it("should format positive currency numbers in VND", () => {
      const formatted = formatVND(500000);
      // Normalized check to avoid non-breaking space / currency symbol discrepancies across OS/Node
      expect(formatted).toMatch(/500\.000/);
      expect(formatted).toMatch(/₫|đ|VND/);
    });
  });

  describe("formatDuration", () => {
    it("should return '00:00' for zero, negative or falsy seconds", () => {
      expect(formatDuration(0)).toBe("00:00");
      expect(formatDuration(-10)).toBe("00:00");
    });

    it("should format minutes and seconds correctly (mm:ss)", () => {
      expect(formatDuration(45)).toBe("00:45");
      expect(formatDuration(65)).toBe("01:05");
      expect(formatDuration(599)).toBe("09:59");
    });

    it("should format hours, minutes and seconds correctly (h:mm:ss)", () => {
      expect(formatDuration(3600)).toBe("1:00:00");
      expect(formatDuration(3665)).toBe("1:01:05");
      expect(formatDuration(7322)).toBe("2:02:02");
    });
  });

  describe("generateOrderCode", () => {
    it("should generate a code with prefix 'EL-'", () => {
      const code = generateOrderCode();
      expect(code.startsWith("EL-")).toBe(true);
    });

    it("should generate unique order codes on successive calls", () => {
      const code1 = generateOrderCode();
      const code2 = generateOrderCode();
      expect(code1).not.toBe(code2);
    });

    it("should match format EL-[TIMESTAMP]-[HASH]", () => {
      const code = generateOrderCode();
      const parts = code.split("-");
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe("EL");
      expect(parts[1].length).toBeGreaterThan(0);
      expect(parts[2].length).toBe(8);
    });
  });

  describe("getYouTubeEmbedUrl", () => {
    it("should return null for empty or null url", () => {
      expect(getYouTubeEmbedUrl(null)).toBeNull();
      expect(getYouTubeEmbedUrl(undefined)).toBeNull();
      expect(getYouTubeEmbedUrl("")).toBeNull();
    });

    it("should extract 11-character video ID from standard watch URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(getYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
      );
    });

    it("should extract video ID from shortened youtu.be URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(getYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
      );
    });

    it("should extract video ID from embed URL", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      expect(getYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
      );
    });

    it("should return original url if it is not a recognized YouTube URL format", () => {
      const customUrl = "https://example.com/video.mp4";
      expect(getYouTubeEmbedUrl(customUrl)).toBe(customUrl);
    });
  });

  describe("slugify", () => {
    it("should convert Vietnamese text with diacritics to clean slug", () => {
      const input = "Khóa Học Phân Tích Kỹ Thuật Chuyên Sâu";
      expect(slugify(input)).toBe("khoa-hoc-phan-tich-ky-thuat-chuyen-sau");
    });

    it("should handle the letter 'đ' and 'Đ'", () => {
      const input = "Đầu tư Chứng khoán và Giao dịch Forex";
      expect(slugify(input)).toBe("dau-tu-chung-khoan-va-giao-dich-forex");
    });

    it("should remove special characters and collapse extra hyphens", () => {
      const input = "Trading 101: Price Action & SMC Strategy! (2026)";
      expect(slugify(input)).toBe("trading-101-price-action-smc-strategy-2026");
    });
  });

  describe("cn (tailwind merge utility)", () => {
    it("should merge class names properly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("should resolve tailwind conflict classes", () => {
      expect(cn("px-4", "px-6")).toBe("px-6");
    });

    it("should ignore falsy values", () => {
      expect(cn("px-4", false && "py-2", undefined, null, "text-white")).toBe(
        "px-4 text-white"
      );
    });
  });
});
