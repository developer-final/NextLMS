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
 * Validates password length requirement (minimum 6 characters)
 */
export function isValidPassword(password: string | null | undefined): boolean {
  if (!password) return false;
  return password.length >= 6;
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

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      error: "Định dạng email không hợp lệ",
    };
  }

  if (!isValidPassword(password)) {
    return {
      isValid: false,
      error: "Mật khẩu phải có ít nhất 6 ký tự",
    };
  }

  return { isValid: true };
}
