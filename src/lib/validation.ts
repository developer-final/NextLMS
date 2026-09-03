export * from "./sanitizer";
import {
  sanitizePlainText,
  sanitizeMarkdown,
  isSafeMarkdownUrl,
} from "./sanitizer";

export interface RegisterValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates standard email address format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password length requirement (minimum 6 characters, maximum 128 characters)
 */
export function isValidPassword(password: string | null | undefined): boolean {
  if (!password) return false;
  return password.length >= 6 && password.length <= 128;
}

/**
 * Validates user registration input payload
 */
export function validateRegisterInput(input: {
  name?: string | null;
  email?: string | null;
  password?: string | null;
}): RegisterValidationResult {
  const { name, email, password } = input;

  if (!name?.trim() || !email?.trim() || !password) {
    return {
      isValid: false,
      error: "Please provide Name, Email, and Password",
    };
  }

  const cleanName = sanitizePlainText(name);
  if (cleanName.length < 2 || cleanName.length > 100) {
    return {
      isValid: false,
      error: "Full name must be between 2 and 100 characters",
    };
  }

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      error: "Invalid email address format",
    };
  }

  if (!isValidPassword(password)) {
    if (password.length < 6) {
      return {
        isValid: false,
        error: "Password must be at least 6 characters long",
      };
    }
    return {
      isValid: false,
      error: "Password cannot exceed 128 characters",
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a given URL is safe to render in href or img src attributes.
 * Prevents JavaScript URI injection (javascript:), vbscript, and dangerous data: schemes.
 */
export function isValidSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Reject malicious schemes explicitly (case-insensitive and control-char resistant)
  const normalized = trimmed.toLowerCase().replace(/[\x00-\x20]/g, "");
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:text/html") ||
    normalized.startsWith("data:image/svg+xml") ||
    normalized.startsWith("data:application/")
  ) {
    return false;
  }

  // Allow safe base64 raster images (png, jpg, jpeg, webp)
  if (normalized.startsWith("data:image/")) {
    const isSafeRaster = /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(trimmed);
    return isSafeRaster;
  }

  // Standard safe http and https protocols
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    // Relative URLs starting with "/" are acceptable
    return trimmed.startsWith("/") && !trimmed.startsWith("//");
  }
}

/**
 * Safely serializes JSON for embedding inside <script type="application/ld+json"> tags.
 * Replaces '<', '>', and '&' with Unicode escape sequences to prevent script tag injection.
 */
export function safeJsonLdStringify(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

export interface CourseValidationInput {
  title?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  price?: number | string | null;
  salePrice?: number | string | null;
  isFree?: boolean;
  sections?: Array<{
    title?: string | null;
    description?: string | null;
    lessons?: Array<{
      title?: string | null;
      videoDuration?: number | null;
      contentBody?: string | null;
    }>;
  }> | null;
  tagNames?: string[] | null;
}

export interface CourseValidationResult extends ValidationResult {
  sanitized?: {
    title: string;
    shortDescription: string | null;
    description: string | null;
    tagNames?: string[];
    sections?: Array<{
      title: string;
      description: string | null;
      lessons?: Array<{
        title: string;
        contentBody: string | null;
      }>;
    }>;
  };
}

/**
 * Validates and sanitizes course creation and edit payload
 */
export function validateCourseInput(input: CourseValidationInput): CourseValidationResult {
  const { title, shortDescription, description, price, salePrice, isFree, sections, tagNames } = input;

  if (!title?.trim()) {
    return { isValid: false, field: "title", error: "Course title is required" };
  }

  const cleanTitle = sanitizePlainText(title, 200);
  if (cleanTitle.length < 5 || cleanTitle.length > 200) {
    return {
      isValid: false,
      field: "title",
      error: "Course title must be between 5 and 200 characters",
    };
  }

  const cleanShortDesc =
    shortDescription !== undefined && shortDescription !== null
      ? sanitizePlainText(shortDescription, 500) || null
      : null;

  const cleanDesc =
    description !== undefined && description !== null
      ? sanitizeMarkdown(description) || null
      : null;

  const numPrice = isFree ? 0 : Number(price ?? 0);
  if (isNaN(numPrice) || numPrice < 0) {
    return { isValid: false, field: "price", error: "Course price must be greater than or equal to 0" };
  }

  if (salePrice !== null && salePrice !== undefined && salePrice !== "" && !isFree) {
    const numSalePrice = Number(salePrice);
    if (isNaN(numSalePrice) || numSalePrice < 0) {
      return {
        isValid: false,
        field: "salePrice",
        error: "Sale price must be greater than or equal to 0",
      };
    }
    if (numSalePrice > numPrice) {
      return {
        isValid: false,
        field: "salePrice",
        error: "Sale price cannot be greater than original price",
      };
    }
  }

  let cleanSections:
    | Array<{
        title: string;
        description: string | null;
        lessons?: Array<{
          title: string;
          contentBody: string | null;
        }>;
      }>
    | undefined = undefined;

  if (sections !== undefined && sections !== null) {
    if (!Array.isArray(sections) || sections.length === 0) {
      return {
        isValid: false,
        field: "sections",
        error: "Course must have at least 1 section",
      };
    }

    cleanSections = [];

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      const cleanSecTitle = sanitizePlainText(sec.title, 150);
      if (!cleanSecTitle || cleanSecTitle.length < 2) {
        return {
          isValid: false,
          field: `sections[${sIdx}].title`,
          error: `Section ${sIdx + 1} must have a title of at least 2 characters`,
        };
      }

      if (!Array.isArray(sec.lessons) || sec.lessons.length === 0) {
        return {
          isValid: false,
          field: `sections[${sIdx}].lessons`,
          error: `Section "${cleanSecTitle}" must have at least 1 lesson`,
        };
      }

      const cleanLessons: Array<{ title: string; contentBody: string | null }> = [];

      for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
        const les = sec.lessons[lIdx];
        const cleanLesTitle = sanitizePlainText(les.title, 150);
        if (!cleanLesTitle || cleanLesTitle.length < 2) {
          return {
            isValid: false,
            field: `sections[${sIdx}].lessons[${lIdx}].title`,
            error: `Lesson ${lIdx + 1} in section "${cleanSecTitle}" must have a title of at least 2 characters`,
          };
        }

        const cleanLessonBody =
          les.contentBody !== undefined && les.contentBody !== null
            ? sanitizeMarkdown(les.contentBody) || null
            : null;

        cleanLessons.push({
          title: cleanLesTitle,
          contentBody: cleanLessonBody,
        });
      }

      cleanSections.push({
        title: cleanSecTitle,
        description: sec.description ? sanitizePlainText(sec.description, 500) || null : null,
        lessons: cleanLessons,
      });
    }
  }

  const cleanTags: string[] = [];
  if (Array.isArray(tagNames)) {
    for (const tag of tagNames) {
      const cleaned = sanitizePlainText(String(tag), 50);
      if (cleaned && !cleanTags.includes(cleaned)) {
        cleanTags.push(cleaned);
      }
    }
  }

  return {
    isValid: true,
    sanitized: {
      title: cleanTitle,
      shortDescription: cleanShortDesc,
      description: cleanDesc,
      tagNames: cleanTags,
      sections: cleanSections,
    },
  };
}

export interface BlogPostValidationInput {
  title?: string | null;
  content?: string | null;
  summary?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  tagNames?: string[] | null;
}

export interface BlogPostValidationResult extends ValidationResult {
  sanitized?: {
    title: string;
    content: string;
    summary: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    tagNames: string[];
  };
}

/**
 * Validates and sanitizes blog post creation and edit payload
 */
export function validateBlogPostInput(input: BlogPostValidationInput): BlogPostValidationResult {
  const { title, content, summary, metaTitle, metaDescription, metaKeywords, tagNames } = input;

  if (!title?.trim()) {
    return { isValid: false, field: "title", error: "Article title is required" };
  }

  const cleanTitle = sanitizePlainText(title, 250);
  if (cleanTitle.length < 3 || cleanTitle.length > 250) {
    return {
      isValid: false,
      field: "title",
      error: "Article title must be between 3 and 250 characters",
    };
  }

  if (content !== undefined && content !== null) {
    if (!content.trim()) {
      return { isValid: false, field: "content", error: "Article content cannot be empty" };
    }
  }

  const cleanContent = content ? sanitizeMarkdown(content) : "";
  if (content !== undefined && cleanContent.length < 5) {
    return {
      isValid: false,
      field: "content",
      error: "Article content must have at least 5 characters",
    };
  }

  const cleanSummary =
    summary !== undefined && summary !== null ? sanitizePlainText(summary, 500) || null : null;
  const cleanMetaTitle =
    metaTitle !== undefined && metaTitle !== null ? sanitizePlainText(metaTitle, 150) || null : null;
  const cleanMetaDesc =
    metaDescription !== undefined && metaDescription !== null
      ? sanitizePlainText(metaDescription, 300) || null
      : null;
  const cleanMetaKeywords =
    metaKeywords !== undefined && metaKeywords !== null
      ? sanitizePlainText(metaKeywords, 200) || null
      : null;

  const cleanTags: string[] = [];
  if (Array.isArray(tagNames)) {
    for (const tag of tagNames) {
      const cleaned = sanitizePlainText(String(tag), 50);
      if (cleaned && !cleanTags.includes(cleaned)) {
        cleanTags.push(cleaned);
      }
    }
  }

  return {
    isValid: true,
    sanitized: {
      title: cleanTitle,
      content: cleanContent,
      summary: cleanSummary,
      metaTitle: cleanMetaTitle,
      metaDescription: cleanMetaDesc,
      metaKeywords: cleanMetaKeywords,
      tagNames: cleanTags,
    },
  };
}

/**
 * Validates coupon creation and update payload
 */
export function validateCouponInput(input: {
  code?: string | null;
  discountType?: string | null;
  discountValue?: number | string | null;
  maxUsage?: number | string | null;
  minOrderValue?: number | string | null;
}): ValidationResult {
  const { code, discountType, discountValue, maxUsage, minOrderValue } = input;

  if (!code?.trim()) {
    return { isValid: false, field: "code", error: "Coupon code cannot be empty" };
  }

  const cleanCode = code.trim().toUpperCase();
  const codeRegex = /^[A-Z0-9_-]{3,30}$/;
  if (!codeRegex.test(cleanCode)) {
    return {
      isValid: false,
      field: "code",
      error: "Coupon code must contain 3-30 uppercase letters, numbers, or hyphens",
    };
  }

  if (discountType !== "PERCENT" && discountType !== "FIXED_AMOUNT") {
    return {
      isValid: false,
      field: "discountType",
      error: "Invalid discount type (only PERCENT or FIXED_AMOUNT allowed)",
    };
  }

  const numDiscountValue = Number(discountValue);
  if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
    return {
      isValid: false,
      field: "discountValue",
      error: "Discount value must be greater than 0",
    };
  }

  if (discountType === "PERCENT" && numDiscountValue > 100) {
    return {
      isValid: false,
      field: "discountValue",
      error: "Percentage discount cannot exceed 100%",
    };
  }

  if (maxUsage !== undefined && maxUsage !== null) {
    const numMaxUsage = Number(maxUsage);
    if (isNaN(numMaxUsage) || numMaxUsage < 1) {
      return {
        isValid: false,
        field: "maxUsage",
        error: "Max usage must be at least 1",
      };
    }
  }

  if (minOrderValue !== undefined && minOrderValue !== null) {
    const numMinOrder = Number(minOrderValue);
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      return {
        isValid: false,
        field: "minOrderValue",
        error: "Minimum order value cannot be negative",
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates bank and payment settings payload
 */
export function validateBankSettingsInput(input: {
  bankId?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
}): ValidationResult {
  const { bankId, bankAccountNo, bankAccountName } = input;

  if (!bankId?.trim()) {
    return { isValid: false, field: "bankId", error: "Please select or enter bank ID (e.g. MB, VCB)" };
  }

  if (!bankAccountNo?.trim()) {
    return { isValid: false, field: "bankAccountNo", error: "Bank account number is required" };
  }

  const cleanAccountNo = bankAccountNo.trim();
  const accountNoRegex = /^[0-9A-Za-z]{6,30}$/;
  if (!accountNoRegex.test(cleanAccountNo)) {
    return {
      isValid: false,
      field: "bankAccountNo",
      error: "Bank account number must be alphanumeric and 6-30 characters long",
    };
  }

  if (!bankAccountName?.trim() || bankAccountName.trim().length < 2) {
    return {
      isValid: false,
      field: "bankAccountName",
      error: "Account holder name must have at least 2 characters",
    };
  }

  return { isValid: true };
}

export interface CommentValidationResult extends ValidationResult {
  sanitized?: {
    content: string;
  };
}

/**
 * Validates and sanitizes lesson comment / Q&A submission
 */
export function validateCommentInput(input: {
  content?: string | null;
  lessonId?: string | null;
  postId?: string | null;
}): CommentValidationResult {
  const { content, lessonId, postId } = input;

  if (!lessonId?.trim() && !postId?.trim()) {
    return { isValid: false, field: "target", error: "Missing target lesson or article" };
  }

  if (!content?.trim()) {
    return { isValid: false, field: "content", error: "Comment content cannot be empty" };
  }

  const cleanContent = sanitizePlainText(content);
  if (cleanContent.length < 2) {
    return { isValid: false, field: "content", error: "Comment content must have at least 2 characters" };
  }

  if (cleanContent.length > 2000) {
    return { isValid: false, field: "content", error: "Comment content cannot exceed 2000 characters" };
  }

  return { isValid: true, sanitized: { content: cleanContent } };
}

export type UploadTargetType = "thumbnail" | "attachment" | "video" | "avatar" | "receipt";

export interface FileValidationOptions {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  type: UploadTargetType;
  maxSizeMb?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
  fileExt?: string;
  detectedMime?: string;
}

// Dangerous executable and script file extensions (Blacklist)
export const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bash", "ps1", "vbs", "msi", "jar", "com", "scr", "bin",
  "pif", "vb", "wsf", "hta", "cpl", "msc", "reg",
  "php", "phtml", "php3", "php4", "php5", "phps", "asp", "aspx", "jsp", "jspx", "cgi", "pl",
  "html", "htm", "xhtml", "svg", "js", "mjs", "ts", "jsx", "tsx",
]);

// Allowed extensions for Course Thumbnails and User Avatars
export const ALLOWED_THUMBNAIL_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
export const ALLOWED_THUMBNAIL_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_AVATAR_EXTENSIONS = ALLOWED_THUMBNAIL_EXTENSIONS;
export const ALLOWED_AVATAR_MIMES = ALLOWED_THUMBNAIL_MIMES;

export const ALLOWED_RECEIPT_EXTENSIONS = ALLOWED_THUMBNAIL_EXTENSIONS;
export const ALLOWED_RECEIPT_MIMES = ALLOWED_THUMBNAIL_MIMES;

// Allowed extensions for Course & Lesson Attachments
export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  "pdf",
  "doc", "docx",
  "xls", "xlsx",
  "ppt", "pptx",
  "txt", "csv", "json", "sql",
  "zip", "rar", "7z", "tar", "gz",
  "jpg", "jpeg", "png", "webp",
]);

// Allowed extensions for Course & Lesson Videos
export const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "mkv"]);
export const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

/**
 * Sanitizes a file name to prevent path traversal and shell injection
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") return "file";

  // Strip path traversal sequences and directory separators
  let name = fileName.replace(/^.*[\\/]/, "");
  
  // Extract extension
  const lastDot = name.lastIndexOf(".");
  let baseName = lastDot > 0 ? name.substring(0, lastDot) : name;
  let ext = lastDot > 0 ? name.substring(lastDot + 1) : "";

  // Replace invalid characters with dash
  baseName = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  ext = ext.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (!baseName) baseName = "attachment";
  if (baseName.length > 80) baseName = baseName.substring(0, 80);

  return ext ? `${baseName}.${ext}` : baseName;
}

/**
 * Verifies Magic Bytes (File signatures) to prevent malicious files pretending to be images/docs
 */
export function verifyMagicBytes(
  buffer: Buffer,
  ext: string
): { isValid: boolean; error?: string } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, error: "Invalid file or empty buffer" };
  }

  // 1. Critical Blacklist Check: Executable PE (MZ header)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { isValid: false, error: "Dangerous Windows executable detected (.exe/.dll)" };
  }

  // 2. Critical Blacklist Check: Linux ELF binary
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { isValid: false, error: "Dangerous Linux executable detected" };
  }

  // 3. Critical Blacklist Check: Shell Script '#!' (0x23 0x21)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { isValid: false, error: "Executable shell script detected" };
  }

  // 4. Critical Blacklist Check: HTML / XML script tags (XSS vector in files)
  const headerPreview = buffer.subarray(0, Math.min(buffer.length, 128)).toString("utf8").toLowerCase();
  if (
    headerPreview.includes("<?php") ||
    headerPreview.includes("<script") ||
    headerPreview.includes("<html") ||
    headerPreview.includes("<!doctype html")
  ) {
    return { isValid: false, error: "Dangerous script tags detected in file header" };
  }

  const normalizedExt = ext.toLowerCase();

  // 5. Whitelist validation by format
  if (normalizedExt === "jpg" || normalizedExt === "jpeg") {
    // JPEG magic bytes: FF D8 FF
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { isValid: false, error: "File signature mismatch for JPEG image" };
    }
  } else if (normalizedExt === "png") {
    // PNG magic bytes: 89 50 4E 47
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return { isValid: false, error: "File signature mismatch for PNG image" };
    }
  } else if (normalizedExt === "webp") {
    // WEBP magic bytes: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    if (
      buffer.length < 12 ||
      buffer[0] !== 0x52 ||
      buffer[1] !== 0x49 ||
      buffer[2] !== 0x46 ||
      buffer[3] !== 0x46 ||
      buffer[8] !== 0x57 ||
      buffer[9] !== 0x45 ||
      buffer[10] !== 0x42 ||
      buffer[11] !== 0x50
    ) {
      return { isValid: false, error: "File signature mismatch for WebP image" };
    }
  } else if (normalizedExt === "pdf") {
    // PDF magic bytes: %PDF (25 50 44 46)
    if (
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      return { isValid: false, error: "File signature mismatch for PDF document" };
    }
  } else if (
    normalizedExt === "zip" ||
    normalizedExt === "docx" ||
    normalizedExt === "xlsx" ||
    normalizedExt === "pptx"
  ) {
    // PKZip based: PK.. (50 4B 03 04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { isValid: false, error: `File signature mismatch for ${normalizedExt.toUpperCase()} document` };
    }
  } else if (normalizedExt === "rar") {
    // RAR magic bytes: Rar! (52 61 72 21)
    if (
      buffer[0] !== 0x52 ||
      buffer[1] !== 0x61 ||
      buffer[2] !== 0x72 ||
      buffer[3] !== 0x21
    ) {
      return { isValid: false, error: "File signature mismatch for RAR archive" };
    }
  } else if (normalizedExt === "7z") {
    // 7-Zip magic bytes: 37 7A BC AF 27 1C
    if (
      buffer.length < 6 ||
      buffer[0] !== 0x37 ||
      buffer[1] !== 0x7a ||
      buffer[2] !== 0xbc ||
      buffer[3] !== 0xaf
    ) {
      return { isValid: false, error: "File signature mismatch for 7z archive" };
    }
  } else if (normalizedExt === "mp4" || normalizedExt === "mov") {
    // MP4/MOV ISO base media container: bytes 4-7 are 'ftyp' (0x66 0x74 0x79 0x70)
    if (
      buffer.length < 8 ||
      buffer[4] !== 0x66 ||
      buffer[5] !== 0x74 ||
      buffer[6] !== 0x79 ||
      buffer[7] !== 0x70
    ) {
      return { isValid: false, error: "File signature mismatch for MP4/MOV video" };
    }
  } else if (normalizedExt === "webm" || normalizedExt === "mkv") {
    // WebM / Matroska EBML header: 1A 45 DF A3
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x1a ||
      buffer[1] !== 0x45 ||
      buffer[2] !== 0xdf ||
      buffer[3] !== 0xa3
    ) {
      return { isValid: false, error: "File signature mismatch for WebM/MKV video" };
    }
  }

  return { isValid: true };
}

/**
 * Validates uploaded file completely: size, extension, MIME type, blacklist, and binary magic bytes
 */
export function validateFileUpload({
  buffer,
  fileName,
  mimeType,
  type,
  maxSizeMb,
}: FileValidationOptions): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: "File buffer cannot be empty" };
  }

  if (!fileName || !fileName.trim()) {
    return { isValid: false, error: "File name is required" };
  }

  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) {
    return { isValid: false, error: "File must have a valid extension" };
  }

  const ext = fileName.substring(lastDot + 1).toLowerCase();

  // 1. Blacklist Check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `File extension .${ext} is blocked for security reasons`,
    };
  }

  // 2. Size Limit Check (Thumbnail: 5MB, Receipt: 10MB, Attachment: 50MB, Video: 1024MB = 1GB)
  const defaultLimit =
    type === "avatar" || type === "thumbnail"
      ? 5
      : type === "receipt"
      ? 10
      : type === "video"
      ? 1024
      : 50;
  const effectiveMaxSizeMb = maxSizeMb ?? defaultLimit;
  const maxSizeBytes = effectiveMaxSizeMb * 1024 * 1024;

  if (buffer.length > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed limit (${effectiveMaxSizeMb}MB)`,
    };
  }

  // 3. Whitelist check by type
  if (type === "avatar") {
    if (!ALLOWED_AVATAR_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: "Avatar only accepts .jpg, .jpeg, .png, .webp formats",
      };
    }

    if (mimeType && !ALLOWED_AVATAR_MIMES.has(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: "Invalid avatar MIME type",
      };
    }
  } else if (type === "receipt") {
    if (!ALLOWED_RECEIPT_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: "Receipt only accepts image formats: .jpg, .jpeg, .png, .webp",
      };
    }

    if (mimeType && !ALLOWED_RECEIPT_MIMES.has(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: "Invalid receipt MIME type",
      };
    }
  } else if (type === "thumbnail") {
    if (!ALLOWED_THUMBNAIL_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: "Course thumbnail only accepts .jpg, .jpeg, .png, .webp formats",
      };
    }

    if (mimeType && !ALLOWED_THUMBNAIL_MIMES.has(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: "Invalid course thumbnail MIME type",
      };
    }
  } else if (type === "video") {
    if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: `Extension .${ext} is not supported for lesson videos. Please use .mp4, .webm, or .mov`,
      };
    }
  } else {
    // attachment type
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: `Extension .${ext} is not supported for attachments`,
      };
    }
  }

  // 4. Magic Bytes Binary Signature Check
  const magicCheck = verifyMagicBytes(buffer, ext);
  if (!magicCheck.isValid) {
    return {
      isValid: false,
      error: magicCheck.error || "File did not pass security verification",
    };
  }


  const sanitized = sanitizeFileName(fileName);

  return {
    isValid: true,
    sanitizedName: sanitized,
    fileExt: ext,
  };
}

export interface ProfileUpdateInput {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
}

export interface ProfileValidationResult {
  isValid: boolean;
  field?: string;
  error?: string;
  sanitized?: {
    name: string;
    headline: string | null;
    bio: string | null;
  };
}

/**
 * Validates user profile update inputs
 */
export function validateProfileUpdate(input: ProfileUpdateInput): ProfileValidationResult {
  if (!input.name || !input.name.trim()) {
    return { isValid: false, field: "name", error: "Full name cannot be empty" };
  }
  const cleanName = sanitizePlainText(input.name);
  if (cleanName.length < 2 || cleanName.length > 100) {
    return { isValid: false, field: "name", error: "Full name must be between 2 and 100 characters" };
  }

  const cleanHeadline = input.headline !== undefined ? (sanitizePlainText(input.headline) || null) : undefined;
  if (cleanHeadline && cleanHeadline.length > 150) {
    return { isValid: false, field: "headline", error: "Headline cannot exceed 150 characters" };
  }

  const cleanBio = input.bio !== undefined ? (sanitizePlainText(input.bio) || null) : undefined;
  if (cleanBio && cleanBio.length > 1000) {
    return { isValid: false, field: "bio", error: "Bio cannot exceed 1000 characters" };
  }

  return {
    isValid: true,
    sanitized: {
      name: cleanName,
      headline: cleanHeadline ?? null,
      bio: cleanBio ?? null,
    },
  };
}

export interface ChangePasswordInput {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmPassword?: string | null;
  requireCurrentPassword?: boolean;
}

export interface ChangePasswordValidationResult {
  isValid: boolean;
  field?: string;
  error?: string;
}

/**
 * Validates password change input payload
 */
export function validateChangePassword(input: ChangePasswordInput): ChangePasswordValidationResult {
  const { currentPassword, newPassword, confirmPassword, requireCurrentPassword = true } = input;

  if (requireCurrentPassword && !currentPassword) {
    return { isValid: false, field: "currentPassword", error: "Please enter current password" };
  }

  if (!newPassword) {
    return { isValid: false, field: "newPassword", error: "Please enter new password" };
  }

  if (newPassword.length < 6) {
    return { isValid: false, field: "newPassword", error: "New password must be at least 6 characters long" };
  }

  if (newPassword.length > 128) {
    return { isValid: false, field: "newPassword", error: "Password cannot exceed 128 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { isValid: false, field: "confirmPassword", error: "New password confirmation does not match" };
  }

  if (requireCurrentPassword && currentPassword === newPassword) {
    return { isValid: false, field: "newPassword", error: "New password cannot be the same as current password" };
  }

  return { isValid: true };
}


