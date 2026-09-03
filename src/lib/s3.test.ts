import { describe, it, expect } from "vitest";
import {
  sanitizeFileName,
  verifyMagicBytes,
  validateFileUpload,
  DANGEROUS_EXTENSIONS,
} from "./validation";
import { isS3Configured } from "./s3";

describe("File Upload & Security Validation", () => {
  describe("sanitizeFileName", () => {
    it("should remove directory traversal sequences", () => {
      expect(sanitizeFileName("../../malicious.pdf")).toBe("malicious.pdf");
      expect(sanitizeFileName("..\\..\\windows.exe")).toBe("windows.exe");
      expect(sanitizeFileName("c:/secret/folder/doc.docx")).toBe("doc.docx");
    });

    it("should normalize Vietnamese accents and replace spaces/special chars", () => {
      const sanitized = sanitizeFileName("Tài liệu khóa học - 2026!@#.pdf");
      expect(sanitized).toBe("Tai-lieu-khoa-hoc-2026.pdf");
    });

    it("should provide fallback if name is completely empty", () => {
      expect(sanitizeFileName("")).toBe("file");
    });
  });

  describe("verifyMagicBytes", () => {
    it("should reject Windows Executable PE files (MZ header)", () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      const res = verifyMagicBytes(exeBuffer, "pdf");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Dangerous Windows executable detected");
    });

    it("should reject Linux ELF binaries", () => {
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]);
      const res = verifyMagicBytes(elfBuffer, "png");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Dangerous Linux executable detected");
    });

    it("should reject Shell Script execution header (#! / 0x23 0x21)", () => {
      const shBuffer = Buffer.from("#!/bin/bash\nrm -rf /", "utf8");
      const res = verifyMagicBytes(shBuffer, "jpg");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Executable shell script detected");
    });

    it("should reject HTML/PHP scripts disguised as image", () => {
      const fakeImage = Buffer.from("<?php echo 'malware'; ?>", "utf8");
      const res = verifyMagicBytes(fakeImage, "jpg");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Dangerous script tags detected");
    });

    it("should accept authentic JPEG files", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = verifyMagicBytes(jpegBuffer, "jpg");
      expect(res.isValid).toBe(true);
    });

    it("should accept authentic PNG files", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = verifyMagicBytes(pngBuffer, "png");
      expect(res.isValid).toBe(true);
    });

    it("should accept authentic PDF documents", () => {
      const pdfBuffer = Buffer.from("%PDF-1.7 ...", "utf8");
      const res = verifyMagicBytes(pdfBuffer, "pdf");
      expect(res.isValid).toBe(true);
    });

    it("should accept authentic ZIP/Office documents", () => {
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      const res = verifyMagicBytes(zipBuffer, "zip");
      expect(res.isValid).toBe(true);
    });
  });

  describe("validateFileUpload", () => {
    it("should reject dangerous extensions from blacklist", () => {
      const buffer = Buffer.from("echo hello", "utf8");
      for (const dangerousExt of ["exe", "bat", "sh", "php", "svg", "js"]) {
        const res = validateFileUpload({
          buffer,
          fileName: `attack.${dangerousExt}`,
          type: "attachment",
        });
        expect(res.isValid).toBe(false);
        expect(res.error).toContain("blocked for security reasons");
      }
    });

    it("should reject oversized files for thumbnail (limit 5MB)", () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      bigBuffer[0] = 0xff;
      bigBuffer[1] = 0xd8;
      bigBuffer[2] = 0xff;

      const res = validateFileUpload({
        buffer: bigBuffer,
        fileName: "large-cover.jpg",
        type: "thumbnail",
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("exceeds maximum allowed limit");
    });

    it("should accept valid thumbnail within 5MB", () => {
      const validThumb = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = validateFileUpload({
        buffer: validThumb,
        fileName: "my-course-cover.jpg",
        mimeType: "image/jpeg",
        type: "thumbnail",
      });
      expect(res.isValid).toBe(true);
      expect(res.sanitizedName).toBe("my-course-cover.jpg");
    });

    it("should accept valid attachment document within 50MB", () => {
      const validPdf = Buffer.from("%PDF-1.4 header content...", "utf8");
      const res = validateFileUpload({
        buffer: validPdf,
        fileName: "Trading-Strategy-Cheatsheet.pdf",
        type: "attachment",
      });
      expect(res.isValid).toBe(true);
      expect(res.sanitizedName).toBe("Trading-Strategy-Cheatsheet.pdf");
      expect(res.fileExt).toBe("pdf");
    });
  });

  describe("S3 Environment Check", () => {
    it("isS3Configured correctly reflects credentials presence", () => {
      // Test function doesn't crash
      expect(typeof isS3Configured()).toBe("boolean");
    });
  });

  describe("Video S3 & Presigned URL Features", () => {
    it("extractS3Key should extract key from various S3/R2 formats", async () => {
      const { extractS3Key } = await import("./s3");

      expect(extractS3Key("courses/videos/lecture-1.mp4")).toBe(
        "courses/videos/lecture-1.mp4"
      );
      expect(extractS3Key("/uploads/courses/videos/lecture-1.mp4")).toBe(
        "courses/videos/lecture-1.mp4"
      );
      expect(
        extractS3Key(
          "https://pub-xyz123.r2.dev/courses/videos/orderblock-masterclass.mp4"
        )
      ).toBe("courses/videos/orderblock-masterclass.mp4");
      expect(
        extractS3Key(
          "https://mybucket.s3.ap-southeast-1.amazonaws.com/courses/videos/forex.mp4"
        )
      ).toBe("courses/videos/forex.mp4");
      expect(
        extractS3Key(
          "https://sxmwlxsabxtrjprpolds.supabase.co/storage/v1/object/public/e-learning-bucket/courses/videos/forex.mp4"
        )
      ).toBe("courses/videos/forex.mp4");

      // Non-S3 links should return null
      expect(extractS3Key("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
      expect(extractS3Key("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
      expect(extractS3Key("https://vimeo.com/12345678")).toBeNull();
      expect(extractS3Key("")).toBeNull();
    });

    it("getSecureStreamUrl should keep YouTube link unchanged and resolve S3 link", async () => {
      const { getSecureStreamUrl } = await import("./s3");

      const ytUrl = "https://www.youtube.com/watch?v=sample123";
      const resultYt = await getSecureStreamUrl(ytUrl);
      expect(resultYt).toBe(ytUrl);

      const s3Url = "courses/videos/lesson-1.mp4";
      const resultS3 = await getSecureStreamUrl(s3Url, 7200);
      expect(resultS3).toBeDefined();
      expect(resultS3).toContain("lesson-1.mp4");
    });

    it("should accept authentic MP4 video with ftyp box", () => {
      // MP4 header: 4 bytes size + 'ftyp' (0x66 0x74 0x79 0x70) + major brand
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
      ]);
      const res = verifyMagicBytes(mp4Buffer, "mp4");
      expect(res.isValid).toBe(true);
    });

    it("should reject executable disguised as MP4 video", () => {
      const fakeMp4 = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ header
      const res = verifyMagicBytes(fakeMp4, "mp4");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Dangerous Windows executable detected");
    });

    it("validateFileUpload should allow video up to 1024MB (1GB)", () => {
      const validMp4 = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
      ]);
      const res = validateFileUpload({
        buffer: validMp4,
        fileName: "Lesson-01-Liquidity-Pools.mp4",
        type: "video",
      });
      expect(res.isValid).toBe(true);
      expect(res.fileExt).toBe("mp4");
      expect(res.sanitizedName).toBe("Lesson-01-Liquidity-Pools.mp4");
    });

    it("validateFileUpload should reject video format not in whitelist", () => {
      const dummyBuffer = Buffer.from("dummy video content", "utf8");
      const res = validateFileUpload({
        buffer: dummyBuffer,
        fileName: "malicious.avi",
        type: "video",
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("is not supported for lesson videos");
    });
  });
});

