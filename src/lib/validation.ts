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
}): ValidationResult {
  const { content, lessonId } = input;

  if (!lessonId?.trim()) {
    return { isValid: false, field: "lessonId", error: "Thiếu thông tin bài học" };
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
