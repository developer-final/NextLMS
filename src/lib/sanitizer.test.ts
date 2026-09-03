import { describe, it, expect } from "vitest";
import {
  stripHtmlTags,
  sanitizePlainText,
  isSafeMarkdownUrl,
  sanitizeMarkdown,
  sanitizeUrl,
} from "./sanitizer";

describe("Sanitizer Security Utility", () => {
  describe("stripHtmlTags", () => {
    it("should strip simple HTML tags", () => {
      expect(stripHtmlTags("<p>Hello <b>World</b></p>")).toBe("Hello World");
    });

    it("should strip script tags and leave inner text (for plain text)", () => {
      expect(stripHtmlTags("<script>alert(1)</script>")).toBe("alert(1)");
    });

    it("should handle empty or null string gracefully", () => {
      expect(stripHtmlTags("")).toBe("");
    });
  });

  describe("sanitizePlainText", () => {
    it("should remove HTML tags completely", () => {
      const input = "<h1>Khóa học Next.js</h1> <script>alert('xss')</script>";
      expect(sanitizePlainText(input)).toBe("Khóa học Next.js alert('xss')");
    });

    it("should strip null bytes and unprintable control characters", () => {
      const input = "Tên\x00 khóa\x08 học\x1F hợp lệ";
      expect(sanitizePlainText(input)).toBe("Tên khóa học hợp lệ");
    });

    it("should preserve newlines, tabs, and carriage returns", () => {
      const input = "Dòng 1\nDòng 2\tTab";
      expect(sanitizePlainText(input)).toBe("Dòng 1\nDòng 2\tTab");
    });

    it("should enforce maxLength when provided", () => {
      const input = "1234567890ABCDEF";
      expect(sanitizePlainText(input, 10)).toBe("1234567890");
    });

    it("should return empty string for null, undefined or non-string", () => {
      expect(sanitizePlainText(null)).toBe("");
      expect(sanitizePlainText(undefined)).toBe("");
    });
  });

  describe("isSafeMarkdownUrl", () => {
    it("should accept valid http, https, and relative URLs", () => {
      expect(isSafeMarkdownUrl("https://worldtradinglab.com/logo.png")).toBe(true);
      expect(isSafeMarkdownUrl("http://example.com/docs")).toBe(true);
      expect(isSafeMarkdownUrl("/courses/nextjs")).toBe(true);
      expect(isSafeMarkdownUrl("#section-1")).toBe(true);
    });

    it("should reject javascript: protocol with or without spaces/cases", () => {
      expect(isSafeMarkdownUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeMarkdownUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
      expect(isSafeMarkdownUrl("  java\tscript:alert(1)")).toBe(false);
      expect(isSafeMarkdownUrl("javascript :alert(1)")).toBe(false);
    });

    it("should reject vbscript and data:text/html protocols", () => {
      expect(isSafeMarkdownUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeMarkdownUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeMarkdownUrl("data:application/javascript;base64,YWxlcnQoMSk=")).toBe(false);
    });
  });

  describe("sanitizeMarkdown", () => {
    it("should strip dangerous executable HTML tags like <script>, <iframe>, <object>", () => {
      const input = `# Title\n\n<script>alert('Stored XSS')</script>\n\n<iframe src="https://evil.com"></iframe>\nSafe text`;
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert('Stored XSS')");
      expect(result).not.toContain("<iframe>");
      expect(result).toContain("# Title");
      expect(result).toContain("Safe text");
    });

    it("should strip inline event handlers (onerror, onclick, etc.)", () => {
      const input = `<img src="invalid" onerror="alert(document.cookie)" />`;
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("document.cookie");
    });

    it("should disarm malicious Markdown links by rewriting URL to #", () => {
      const input = `[Download Document](javascript:alert(document.cookie)) and [Normal Link](https://google.com)`;
      const result = sanitizeMarkdown(input);
      expect(result).toContain("[Download Document](#)");
      expect(result).toContain("[Normal Link](https://google.com)");
      expect(result).not.toContain("javascript:");
    });

    it("should disarm malicious Markdown images", () => {
      const input = `![Malicious Image](javascript:alert('xss')) and ![Safe Image](https://images.unsplash.com/photo.jpg)`;
      const result = sanitizeMarkdown(input);
      expect(result).toContain("![Malicious Image](#)");
      expect(result).toContain("![Safe Image](https://images.unsplash.com/photo.jpg)");
    });

    it("should preserve standard legitimate markdown formatting", () => {
      const input = [
        "# Heading 1",
        "## Heading 2",
        "**Bold Text** and *Italic Text*",
        "- Item 1",
        "- Item 2",
        "> Quote block",
        "```typescript",
        "const safe = true;",
        "```",
      ].join("\n");

      const result = sanitizeMarkdown(input);
      expect(result).toBe(input);
    });

    it("should remove null bytes from markdown content", () => {
      const input = "# Heading\x00 with null bytes";
      expect(sanitizeMarkdown(input)).toBe("# Heading with null bytes");
    });
  });

  describe("sanitizeUrl", () => {
    it("should return clean url for safe URLs", () => {
      expect(sanitizeUrl("https://example.com/image.png")).toBe("https://example.com/image.png");
      expect(sanitizeUrl("/static/banner.jpg")).toBe("/static/banner.jpg");
    });

    it("should return null for dangerous schemes", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
      expect(sanitizeUrl("data:text/html;base64,...")).toBeNull();
      expect(sanitizeUrl(null)).toBeNull();
      expect(sanitizeUrl("")).toBeNull();
    });
  });
});
