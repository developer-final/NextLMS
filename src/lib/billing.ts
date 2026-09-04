export interface CouponData {
  id?: string;
  code: string;
  discountType: "PERCENT" | "FIXED_AMOUNT" | string;
  discountValue: number;
  maxUsage?: number;
  usedCount?: number;
  minOrderValue?: number;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  isActive?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PricingResult {
  originalPrice: number;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Validates whether a coupon can be applied to an order
 */
export function validateCoupon(
  coupon: CouponData | null | undefined,
  orderPrice: number,
  now: Date = new Date()
): CouponValidationResult {
  if (!coupon || !coupon.isActive) {
    return {
      isValid: false,
      error: "Coupon does not exist or has been deactivated",
    };
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return {
      isValid: false,
      error: "Coupon has not started yet",
    };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return {
      isValid: false,
      error: "Coupon has expired",
    };
  }

  if (
    typeof coupon.maxUsage === "number" &&
    typeof coupon.usedCount === "number" &&
    coupon.usedCount >= coupon.maxUsage
  ) {
    return {
      isValid: false,
      error: "Coupon has reached its maximum usage limit",
    };
  }

  if (
    typeof coupon.minOrderValue === "number" &&
    orderPrice < coupon.minOrderValue
  ) {
    return {
      isValid: false,
      error: `Minimum order value to apply this coupon is ${coupon.minOrderValue.toLocaleString()} VND`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates discount amount and final order price
 */
export function calculateOrderPricing(
  originalPrice: number,
  coupon?: CouponData | null
): PricingResult {
  const safeOriginalPrice = Math.max(0, originalPrice);
  if (!coupon) {
    return {
      originalPrice: safeOriginalPrice,
      discountAmount: 0,
      finalAmount: safeOriginalPrice,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENT") {
    const percent = Math.max(0, Math.min(100, coupon.discountValue));
    discountAmount = (safeOriginalPrice * percent) / 100;
  } else {
    discountAmount = Math.max(0, coupon.discountValue);
  }

  // Discount cannot exceed the original price
  discountAmount = Math.min(discountAmount, safeOriginalPrice);
  const finalAmount = Math.max(0, safeOriginalPrice - discountAmount);

  return {
    originalPrice: safeOriginalPrice,
    discountAmount,
    finalAmount,
  };
}
