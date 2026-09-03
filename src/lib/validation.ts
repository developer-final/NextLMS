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
      error: "Vui lòng cung cấp đầy đủ Tên, Email và Mật khẩu",
    };
  }

  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    return {
      isValid: false,
      error: "Họ và tên phải từ 2 đến 100 ký tự",
    };
  }

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      error: "Định dạng email không hợp lệ",
    };
  }

  if (!isValidPassword(password)) {
    if (password.length < 6) {
      return {
        isValid: false,
        error: "Mật khẩu phải có ít nhất 6 ký tự",
      };
    }
    return {
      isValid: false,
      error: "Mật khẩu không được vượt quá 128 ký tự",
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

/**
 * Validates course creation and edit payload
 */
export function validateCourseInput(input: {
  title?: string | null;
  price?: number | string | null;
  salePrice?: number | string | null;
  isFree?: boolean;
  sections?: Array<{
    title?: string | null;
    lessons?: Array<{
      title?: string | null;
      videoDuration?: number | null;
    }>;
  }> | null;
}): ValidationResult {
  const { title, price, salePrice, isFree, sections } = input;

  if (!title?.trim()) {
    return { isValid: false, field: "title", error: "Tiêu đề khóa học là bắt buộc" };
  }

  const cleanTitle = title.trim();
  if (cleanTitle.length < 5 || cleanTitle.length > 200) {
    return {
      isValid: false,
      field: "title",
      error: "Tiêu đề khóa học phải có từ 5 đến 200 ký tự",
    };
  }

  const numPrice = isFree ? 0 : Number(price ?? 0);
  if (isNaN(numPrice) || numPrice < 0) {
    return { isValid: false, field: "price", error: "Giá khóa học phải lớn hơn hoặc bằng 0" };
  }

  if (salePrice !== null && salePrice !== undefined && salePrice !== "" && !isFree) {
    const numSalePrice = Number(salePrice);
    if (isNaN(numSalePrice) || numSalePrice < 0) {
      return {
        isValid: false,
        field: "salePrice",
        error: "Giá khuyến mãi phải lớn hơn hoặc bằng 0",
      };
    }
    if (numSalePrice > numPrice) {
      return {
        isValid: false,
        field: "salePrice",
        error: "Giá khuyến mãi không được lớn hơn giá gốc của khóa học",
      };
    }
  }

  if (sections !== undefined && sections !== null) {
    if (!Array.isArray(sections) || sections.length === 0) {
      return {
        isValid: false,
        field: "sections",
        error: "Khóa học phải có ít nhất 1 chương học",
      };
    }

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      if (!sec.title?.trim() || sec.title.trim().length < 2) {
        return {
          isValid: false,
          field: `sections[${sIdx}].title`,
          error: `Chương ${sIdx + 1} cần có tiêu đề ít nhất 2 ký tự`,
        };
      }

      if (!Array.isArray(sec.lessons) || sec.lessons.length === 0) {
        return {
          isValid: false,
          field: `sections[${sIdx}].lessons`,
          error: `Chương "${sec.title.trim()}" phải có ít nhất 1 bài học`,
        };
      }

      for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
        const les = sec.lessons[lIdx];
        if (!les.title?.trim() || les.title.trim().length < 2) {
          return {
            isValid: false,
            field: `sections[${sIdx}].lessons[${lIdx}].title`,
            error: `Bài học số ${lIdx + 1} trong chương "${sec.title.trim()}" cần có tiêu đề ít nhất 2 ký tự`,
          };
        }
      }
    }
  }

  return { isValid: true };
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
    return { isValid: false, field: "code", error: "Mã giảm giá không được để trống" };
  }

  const cleanCode = code.trim().toUpperCase();
  const codeRegex = /^[A-Z0-9_-]{3,30}$/;
  if (!codeRegex.test(cleanCode)) {
    return {
      isValid: false,
      field: "code",
      error: "Mã giảm giá chỉ được gồm chữ cái in hoa, chữ số, gạch nối (-), từ 3 đến 30 ký tự",
    };
  }

  if (discountType !== "PERCENT" && discountType !== "FIXED_AMOUNT") {
    return {
      isValid: false,
      field: "discountType",
      error: "Loại giảm giá không hợp lệ (chỉ chấp nhận PERCENT hoặc FIXED_AMOUNT)",
    };
  }

  const numDiscountValue = Number(discountValue);
  if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
    return {
      isValid: false,
      field: "discountValue",
      error: "Mức giảm giá phải lớn hơn 0",
    };
  }

  if (discountType === "PERCENT" && numDiscountValue > 100) {
    return {
      isValid: false,
      field: "discountValue",
      error: "Mức giảm giá theo phần trăm không được vượt quá 100%",
    };
  }

  if (maxUsage !== undefined && maxUsage !== null) {
    const numMaxUsage = Number(maxUsage);
    if (isNaN(numMaxUsage) || numMaxUsage < 1) {
      return {
        isValid: false,
        field: "maxUsage",
        error: "Số lượt sử dụng tối đa phải từ 1 trở lên",
      };
    }
  }

  if (minOrderValue !== undefined && minOrderValue !== null) {
    const numMinOrder = Number(minOrderValue);
    if (isNaN(numMinOrder) || numMinOrder < 0) {
      return {
        isValid: false,
        field: "minOrderValue",
        error: "Giá trị đơn hàng tối thiểu không được âm",
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
    return { isValid: false, field: "bankId", error: "Vui lòng chọn hoặc nhập mã ngân hàng (VD: MB, VCB)" };
  }

  if (!bankAccountNo?.trim()) {
    return { isValid: false, field: "bankAccountNo", error: "Số tài khoản ngân hàng là bắt buộc" };
  }

  const cleanAccountNo = bankAccountNo.trim();
  const accountNoRegex = /^[0-9A-Za-z]{6,30}$/;
  if (!accountNoRegex.test(cleanAccountNo)) {
    return {
      isValid: false,
      field: "bankAccountNo",
      error: "Số tài khoản chỉ được chứa chữ số hoặc chữ cái, độ dài từ 6 đến 30 ký tự",
    };
  }

  if (!bankAccountName?.trim() || bankAccountName.trim().length < 2) {
    return {
      isValid: false,
      field: "bankAccountName",
      error: "Tên chủ tài khoản thụ hưởng phải có ít nhất 2 ký tự",
    };
  }

  return { isValid: true };
}

/**
 * Validates lesson comment / Q&A submission
 */
export function validateCommentInput(input: {
  content?: string | null;
  lessonId?: string | null;
  postId?: string | null;
}): ValidationResult {
  const { content, lessonId, postId } = input;

  if (!lessonId?.trim() && !postId?.trim()) {
    return { isValid: false, field: "target", error: "Thiếu thông tin bài học hoặc bài viết" };
  }

  if (!content?.trim()) {
    return { isValid: false, field: "content", error: "Nội dung câu hỏi/bình luận không được để trống" };
  }

  const cleanContent = content.trim();
  if (cleanContent.length < 2) {
    return { isValid: false, field: "content", error: "Nội dung bình luận phải có ít nhất 2 ký tự" };
  }

  if (cleanContent.length > 2000) {
    return { isValid: false, field: "content", error: "Nội dung bình luận không được vượt quá 2000 ký tự" };
  }

  return { isValid: true };
}

export type UploadTargetType = "thumbnail" | "attachment" | "video" | "avatar";

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
    return { isValid: false, error: "Tệp tin không hợp lệ hoặc dữ liệu bị trống" };
  }

  // 1. Critical Blacklist Check: Executable PE (MZ header)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { isValid: false, error: "Phát hiện tệp thực thi Windows độc hại (.exe/.dll)" };
  }

  // 2. Critical Blacklist Check: Linux ELF binary
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { isValid: false, error: "Phát hiện tệp thực thi Linux độc hại" };
  }

  // 3. Critical Blacklist Check: Shell Script '#!' (0x23 0x21)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { isValid: false, error: "Phát hiện tập lệnh thực thi shell script" };
  }

  // 4. Critical Blacklist Check: HTML / XML script tags (XSS vector in files)
  const headerPreview = buffer.subarray(0, Math.min(buffer.length, 128)).toString("utf8").toLowerCase();
  if (
    headerPreview.includes("<?php") ||
    headerPreview.includes("<script") ||
    headerPreview.includes("<html") ||
    headerPreview.includes("<!doctype html")
  ) {
    return { isValid: false, error: "Phát hiện mã kịch bản web độc hại trong nội dung tệp" };
  }

  const normalizedExt = ext.toLowerCase();

  // 5. Whitelist validation by format
  if (normalizedExt === "jpg" || normalizedExt === "jpeg") {
    // JPEG magic bytes: FF D8 FF
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng ảnh JPEG thực tế" };
    }
  } else if (normalizedExt === "png") {
    // PNG magic bytes: 89 50 4E 47
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng ảnh PNG thực tế" };
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
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng ảnh WebP thực tế" };
    }
  } else if (normalizedExt === "pdf") {
    // PDF magic bytes: %PDF (25 50 44 46)
    if (
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      return { isValid: false, error: "Chữ ký tệp không khớp với tài liệu PDF thực tế" };
    }
  } else if (
    normalizedExt === "zip" ||
    normalizedExt === "docx" ||
    normalizedExt === "xlsx" ||
    normalizedExt === "pptx"
  ) {
    // PKZip based: PK.. (50 4B 03 04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { isValid: false, error: `Chữ ký tệp không khớp với định dạng ${normalizedExt.toUpperCase()} thực tế` };
    }
  } else if (normalizedExt === "rar") {
    // RAR magic bytes: Rar! (52 61 72 21)
    if (
      buffer[0] !== 0x52 ||
      buffer[1] !== 0x61 ||
      buffer[2] !== 0x72 ||
      buffer[3] !== 0x21
    ) {
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng RAR thực tế" };
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
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng 7z thực tế" };
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
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng video MP4/MOV thực tế" };
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
      return { isValid: false, error: "Chữ ký tệp không khớp với định dạng video WebM/MKV thực tế" };
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
    return { isValid: false, error: "Dữ liệu tệp tin bị trống" };
  }

  if (!fileName || !fileName.trim()) {
    return { isValid: false, error: "Thiếu tên tệp tin" };
  }

  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) {
    return { isValid: false, error: "Tệp tin phải có phần mở rộng hợp lệ" };
  }

  const ext = fileName.substring(lastDot + 1).toLowerCase();

  // 1. Blacklist Check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      error: `Định dạng tệp .${ext} bị cấm tải lên vì lý do an toàn bảo mật`,
    };
  }

  // 2. Size Limit Check (Thumbnail: 5MB, Attachment: 50MB, Video: 1024MB = 1GB)
  const defaultLimit = type === "avatar" ? 5 : type === "thumbnail" ? 5 : type === "video" ? 1024 : 50;
  const effectiveMaxSizeMb = maxSizeMb ?? defaultLimit;
  const maxSizeBytes = effectiveMaxSizeMb * 1024 * 1024;

  if (buffer.length > maxSizeBytes) {
    return {
      isValid: false,
      error: `Dung lượng tệp vượt quá mức cho phép (Tối đa ${effectiveMaxSizeMb}MB)`,
    };
  }

  // 3. Whitelist check by type
  if (type === "avatar") {
    if (!ALLOWED_AVATAR_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: "Ảnh đại diện chỉ chấp nhận các định dạng: .jpg, .jpeg, .png, .webp",
      };
    }

    if (mimeType && !ALLOWED_AVATAR_MIMES.has(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: "MIME type của ảnh đại diện không hợp lệ",
      };
    }
  } else if (type === "thumbnail") {
    if (!ALLOWED_THUMBNAIL_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: "Ảnh bìa khóa học chỉ chấp nhận các định dạng: .jpg, .jpeg, .png, .webp",
      };
    }

    if (mimeType && !ALLOWED_THUMBNAIL_MIMES.has(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: "MIME type của ảnh bìa không hợp lệ",
      };
    }
  } else if (type === "video") {
    if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: `Định dạng .${ext} không được hỗ trợ cho video bài giảng. Vui lòng chọn .mp4, .webm, hoặc .mov`,
      };
    }
  } else {
    // attachment type
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: `Định dạng .${ext} không được hỗ trợ cho tài liệu đính kèm`,
      };
    }
  }

  // 4. Magic Bytes Binary Signature Check
  const magicCheck = verifyMagicBytes(buffer, ext);
  if (!magicCheck.isValid) {
    return {
      isValid: false,
      error: magicCheck.error || "Tệp tin không vượt qua bước kiểm tra bảo mật",
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
    return { isValid: false, field: "name", error: "Họ và tên không được để trống" };
  }
  const cleanName = input.name.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    return { isValid: false, field: "name", error: "Họ và tên phải từ 2 đến 100 ký tự" };
  }

  const cleanHeadline = input.headline !== undefined ? input.headline?.trim() || null : undefined;
  if (cleanHeadline && cleanHeadline.length > 150) {
    return { isValid: false, field: "headline", error: "Chức danh / Headline không được vượt quá 150 ký tự" };
  }

  const cleanBio = input.bio !== undefined ? input.bio?.trim() || null : undefined;
  if (cleanBio && cleanBio.length > 1000) {
    return { isValid: false, field: "bio", error: "Tiểu sử không được vượt quá 1000 ký tự" };
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
    return { isValid: false, field: "currentPassword", error: "Vui lòng nhập mật khẩu hiện tại" };
  }

  if (!newPassword) {
    return { isValid: false, field: "newPassword", error: "Vui lòng nhập mật khẩu mới" };
  }

  if (newPassword.length < 6) {
    return { isValid: false, field: "newPassword", error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  if (newPassword.length > 128) {
    return { isValid: false, field: "newPassword", error: "Mật khẩu không được vượt quá 128 ký tự" };
  }

  if (newPassword !== confirmPassword) {
    return { isValid: false, field: "confirmPassword", error: "Xác nhận mật khẩu mới không khớp" };
  }

  if (requireCurrentPassword && currentPassword === newPassword) {
    return { isValid: false, field: "newPassword", error: "Mật khẩu mới không được trùng với mật khẩu hiện tại" };
  }

  return { isValid: true };
}


