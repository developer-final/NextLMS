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
