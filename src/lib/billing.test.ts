import { describe, it, expect } from "vitest";
import { validateCoupon, calculateOrderPricing, type CouponData } from "./billing";

describe("Billing & Coupon Logic (TC-PAY-02)", () => {
  const baseCoupon: CouponData = {
    id: "coupon-1",
    code: "DISCOUNT20",
    discountType: "PERCENT",
    discountValue: 20,
    maxUsage: 100,
    usedCount: 5,
    minOrderValue: 500000,
    isActive: true,
  };

  describe("validateCoupon", () => {
    it("should accept a valid active coupon", () => {
      const result = validateCoupon(baseCoupon, 1000000);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject a null or undefined coupon", () => {
      expect(validateCoupon(null, 1000000).isValid).toBe(false);
      expect(validateCoupon(undefined, 1000000).isValid).toBe(false);
    });

    it("should reject an inactive coupon", () => {
      const inactive = { ...baseCoupon, isActive: false };
      const result = validateCoupon(inactive, 1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("deactivated");
    });

    it("should reject an expired coupon", () => {
      const pastDate = new Date("2020-01-01");
      const expired = { ...baseCoupon, expiresAt: pastDate };
      const result = validateCoupon(expired, 1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should reject a coupon that has not started yet", () => {
      const futureDate = new Date("2099-01-01");
      const futureCoupon = { ...baseCoupon, startsAt: futureDate };
      const result = validateCoupon(futureCoupon, 1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("not started yet");
    });

    it("should reject a coupon that reached max usage limit", () => {
      const maxedOut = { ...baseCoupon, maxUsage: 10, usedCount: 10 };
      const result = validateCoupon(maxedOut, 1000000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("maximum usage limit");
    });

    it("should reject if order value is less than minOrderValue", () => {
      const result = validateCoupon(baseCoupon, 300000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Minimum order value");
    });

    it("should accept if order value exactly equals minOrderValue", () => {
      const result = validateCoupon(baseCoupon, 500000);
      expect(result.isValid).toBe(true);
    });
  });

  describe("calculateOrderPricing", () => {
    it("should return original price when no coupon provided", () => {
      const result = calculateOrderPricing(1000000, null);
      expect(result.originalPrice).toBe(1000000);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(1000000);
    });

    it("should calculate percentage discount correctly", () => {
      const percentCoupon: CouponData = {
        code: "SALE25",
        discountType: "PERCENT",
        discountValue: 25,
      };
      const result = calculateOrderPricing(2000000, percentCoupon);
      expect(result.discountAmount).toBe(500000);
      expect(result.finalAmount).toBe(1500000);
    });

    it("should calculate fixed amount discount correctly", () => {
      const fixedCoupon: CouponData = {
        code: "MINUS200K",
        discountType: "FIXED_AMOUNT",
        discountValue: 200000,
      };
      const result = calculateOrderPricing(1000000, fixedCoupon);
      expect(result.discountAmount).toBe(200000);
      expect(result.finalAmount).toBe(800000);
    });

    it("should never let final amount become negative when discount exceeds price", () => {
      const superCoupon: CouponData = {
        code: "MEGA",
        discountType: "FIXED_AMOUNT",
        discountValue: 1500000,
      };
      const result = calculateOrderPricing(1000000, superCoupon);
      expect(result.discountAmount).toBe(1000000);
      expect(result.finalAmount).toBe(0);
    });

    it("should clamp percentage discount between 0% and 100%", () => {
      const over100Coupon: CouponData = {
        code: "OVER",
        discountType: "PERCENT",
        discountValue: 150,
      };
      const result = calculateOrderPricing(1000000, over100Coupon);
      expect(result.discountAmount).toBe(1000000);
      expect(result.finalAmount).toBe(0);
    });
  });
});
