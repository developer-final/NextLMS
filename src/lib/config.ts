import { prisma } from "@/lib/prisma";

export interface SystemConfig {
  // Brand & Site info
  appName: string;
  appSlogan: string;
  appDescription: string;
  supportEmail: string;
  supportHotline: string;
  zaloUrl: string;
  telegramUrl: string;
  facebookUrl: string;

  // VietQR / Bank Info
  bankId: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  vietqrTemplate: string;

  // Multi-Gateway Payment Settings
  paymentManualEnabled: boolean;
  paymentVietqrAutoEnabled: boolean;
  paymentVietqrProvider: "PAYOS" | "SEPAY";
  payosClientId: string;
  payosApiKey: string;
  payosChecksumKey: string;
  sepayApiKey: string;
  sepayAccountNumber: string;

  paymentPaypalEnabled: boolean;
  paypalClientId: string;
  paypalSecret: string;
  paypalMode: "sandbox" | "live";
  paymentStripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  usdExchangeRate: number;

  // Crypto Manual Payment (USDT BEP-20 & TRC-20)
  paymentCryptoEnabled: boolean;
  cryptoBep20Address: string;
  cryptoTrc20Address: string;

  // Hero & Landing Stats
  statsStudentCount: string;
  statsSatisfactionRate: string;
  statsPracticalRate: string;
  statsSupportHours: string;

  // Policy
  refundDays: number;
  refundMaxProgress: number;

  // Affiliate / Referral System
  affiliateEnabled: boolean;
  affiliateCommissionPercent: number;
  affiliateCookieDays: number;
  affiliateHoldDays: number;
  affiliateMinPayout: number;
}

export const DEFAULT_CONFIG: SystemConfig = {
  appName: process.env.APP_NAME || "NextLMS",
  appSlogan: process.env.APP_SLOGAN || "Nền tảng Học viện & Đào tạo Trực tuyến Hiện đại",
  appDescription:
    process.env.APP_DESCRIPTION ||
    "NextLMS là nền tảng e-Learning mã nguồn mở hiện đại, tối ưu cho giảng viên, học viện và doanh nghiệp.",
  supportEmail: process.env.SUPPORT_EMAIL || "support@nextlms.org",
  supportHotline: process.env.SUPPORT_HOTLINE || "0988.888.888",
  zaloUrl: process.env.ZALO_URL || "https://zalo.me/0988888888",
  telegramUrl: process.env.TELEGRAM_URL || "https://t.me/trading_world_support",
  facebookUrl: process.env.FACEBOOK_URL || "https://facebook.com/nextlms",

  bankId: process.env.BANK_ID || "MB",
  bankName: process.env.BANK_NAME || "MB Bank (Ngân hàng Quân Đội)",
  bankAccountNo: process.env.BANK_ACCOUNT_NO || "0988888888",
  bankAccountName: process.env.BANK_ACCOUNT_NAME || "WORLD TRADING LAB",
  vietqrTemplate: process.env.VIETQR_TEMPLATE || "compact2",

  paymentManualEnabled: true,
  paymentVietqrAutoEnabled: true,
  paymentVietqrProvider: "PAYOS",
  payosClientId: process.env.PAYOS_CLIENT_ID || "",
  payosApiKey: process.env.PAYOS_API_KEY || "",
  payosChecksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
  sepayApiKey: process.env.SEPAY_API_KEY || "",
  sepayAccountNumber: process.env.SEPAY_ACCOUNT_NO || "",

  paymentPaypalEnabled: true,
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalSecret: process.env.PAYPAL_SECRET || "",
  paypalMode: "sandbox",
  paymentStripeEnabled: false,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  usdExchangeRate: 25400,

  paymentCryptoEnabled: true,
  cryptoBep20Address: process.env.CRYPTO_BEP20_ADDRESS || "",
  cryptoTrc20Address: process.env.CRYPTO_TRC20_ADDRESS || "",

  statsStudentCount: "5,000+",
  statsSatisfactionRate: "98.6%",
  statsPracticalRate: "100%",
  statsSupportHours: "24/7",

  refundDays: 7,
  refundMaxProgress: 30,

  // Affiliate defaults
  affiliateEnabled: true,
  affiliateCommissionPercent: 20,
  affiliateCookieDays: 30,
  affiliateHoldDays: 7,
  affiliateMinPayout: 200000,
};

let cachedSettings: SystemConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Fetch all system settings from database with fallback to DEFAULT_CONFIG
 */
export async function getSystemSettings(): Promise<SystemConfig> {
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const settings = await prisma.setting.findMany();
    const configMap: Record<string, string> = {};

    for (const item of settings) {
      configMap[item.key] = item.value;
    }

    const parseBool = (val: string | undefined, def: boolean): boolean => {
      if (val === undefined) return def;
      return val === "true" || val === "1";
    };

    const result: SystemConfig = {
      appName: configMap["appName"] || DEFAULT_CONFIG.appName,
      appSlogan: configMap["appSlogan"] || DEFAULT_CONFIG.appSlogan,
      appDescription: configMap["appDescription"] || DEFAULT_CONFIG.appDescription,
      supportEmail: configMap["supportEmail"] || DEFAULT_CONFIG.supportEmail,
      supportHotline: configMap["supportHotline"] || DEFAULT_CONFIG.supportHotline,
      zaloUrl: configMap["zaloUrl"] || DEFAULT_CONFIG.zaloUrl,
      telegramUrl: configMap["telegramUrl"] || DEFAULT_CONFIG.telegramUrl,
      facebookUrl: configMap["facebookUrl"] || DEFAULT_CONFIG.facebookUrl,

      bankId: configMap["bankId"] || DEFAULT_CONFIG.bankId,
      bankName: configMap["bankName"] || DEFAULT_CONFIG.bankName,
      bankAccountNo: configMap["bankAccountNo"] || DEFAULT_CONFIG.bankAccountNo,
      bankAccountName: configMap["bankAccountName"] || DEFAULT_CONFIG.bankAccountName,
      vietqrTemplate: configMap["vietqrTemplate"] || DEFAULT_CONFIG.vietqrTemplate,

      paymentManualEnabled: parseBool(configMap["paymentManualEnabled"], DEFAULT_CONFIG.paymentManualEnabled),
      paymentVietqrAutoEnabled: parseBool(configMap["paymentVietqrAutoEnabled"], DEFAULT_CONFIG.paymentVietqrAutoEnabled),
      paymentVietqrProvider: (configMap["paymentVietqrProvider"] === "SEPAY" ? "SEPAY" : "PAYOS"),
      payosClientId: configMap["payosClientId"] || DEFAULT_CONFIG.payosClientId,
      payosApiKey: configMap["payosApiKey"] || DEFAULT_CONFIG.payosApiKey,
      payosChecksumKey: configMap["payosChecksumKey"] || DEFAULT_CONFIG.payosChecksumKey,
      sepayApiKey: configMap["sepayApiKey"] || DEFAULT_CONFIG.sepayApiKey,
      sepayAccountNumber: configMap["sepayAccountNumber"] || DEFAULT_CONFIG.sepayAccountNumber,

      paymentPaypalEnabled: parseBool(configMap["paymentPaypalEnabled"], DEFAULT_CONFIG.paymentPaypalEnabled),
      paypalClientId: configMap["paypalClientId"] || DEFAULT_CONFIG.paypalClientId,
      paypalSecret: configMap["paypalSecret"] || DEFAULT_CONFIG.paypalSecret,
      paypalMode: (configMap["paypalMode"] === "live" ? "live" : "sandbox"),
      paymentStripeEnabled: parseBool(configMap["paymentStripeEnabled"], DEFAULT_CONFIG.paymentStripeEnabled),
      stripePublishableKey: configMap["stripePublishableKey"] || DEFAULT_CONFIG.stripePublishableKey,
      stripeSecretKey: configMap["stripeSecretKey"] || DEFAULT_CONFIG.stripeSecretKey,
      stripeWebhookSecret: configMap["stripeWebhookSecret"] || DEFAULT_CONFIG.stripeWebhookSecret,
      usdExchangeRate: configMap["usdExchangeRate"] ? parseFloat(configMap["usdExchangeRate"]) : DEFAULT_CONFIG.usdExchangeRate,

      paymentCryptoEnabled: parseBool(configMap["paymentCryptoEnabled"], DEFAULT_CONFIG.paymentCryptoEnabled),
      cryptoBep20Address: configMap["cryptoBep20Address"] || DEFAULT_CONFIG.cryptoBep20Address,
      cryptoTrc20Address: configMap["cryptoTrc20Address"] || DEFAULT_CONFIG.cryptoTrc20Address,

      statsStudentCount: configMap["statsStudentCount"] || DEFAULT_CONFIG.statsStudentCount,
      statsSatisfactionRate: configMap["statsSatisfactionRate"] || DEFAULT_CONFIG.statsSatisfactionRate,
      statsPracticalRate: configMap["statsPracticalRate"] || DEFAULT_CONFIG.statsPracticalRate,
      statsSupportHours: configMap["statsSupportHours"] || DEFAULT_CONFIG.statsSupportHours,

      refundDays: configMap["refundDays"] ? parseInt(configMap["refundDays"], 10) : DEFAULT_CONFIG.refundDays,
      refundMaxProgress: configMap["refundMaxProgress"]
        ? parseInt(configMap["refundMaxProgress"], 10)
        : DEFAULT_CONFIG.refundMaxProgress,

      affiliateEnabled: parseBool(configMap["affiliateEnabled"], DEFAULT_CONFIG.affiliateEnabled),
      affiliateCommissionPercent: configMap["affiliateCommissionPercent"]
        ? parseFloat(configMap["affiliateCommissionPercent"])
        : DEFAULT_CONFIG.affiliateCommissionPercent,
      affiliateCookieDays: configMap["affiliateCookieDays"]
        ? parseInt(configMap["affiliateCookieDays"], 10)
        : DEFAULT_CONFIG.affiliateCookieDays,
      affiliateHoldDays: configMap["affiliateHoldDays"]
        ? parseInt(configMap["affiliateHoldDays"], 10)
        : DEFAULT_CONFIG.affiliateHoldDays,
      affiliateMinPayout: configMap["affiliateMinPayout"]
        ? parseFloat(configMap["affiliateMinPayout"])
        : DEFAULT_CONFIG.affiliateMinPayout,
    };

    cachedSettings = result;
    cacheTimestamp = now;
    return result;
  } catch (error) {
    console.error("Error loading system settings:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Invalidate cached system settings to force fresh fetch from database
 */
export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

