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

  // Hero & Landing Stats
  statsStudentCount: string;
  statsSatisfactionRate: string;
  statsPracticalRate: string;
  statsSupportHours: string;

  // Policy
  refundDays: number;
  refundMaxProgress: number;
}

export const DEFAULT_CONFIG: SystemConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "World Trading Lab",
  appSlogan: "Học viện Đào tạo Trading Thực chiến",
  appDescription:
    "Nền tảng đào tạo trực tuyến hàng đầu về Giao dịch Tài chính, Đầu tư Chứng khoán, Crypto và Kỹ năng Thực chiến.",
  supportEmail: "support@worldtradinglab.com",
  supportHotline: "0988.888.888",
  zaloUrl: "https://zalo.me/0988888888",
  telegramUrl: "https://t.me/worldtradinglab",
  facebookUrl: "https://facebook.com/worldtradinglab",

  bankId: process.env.NEXT_PUBLIC_BANK_ID || "MB",
  bankName: "MB Bank (Ngân hàng Quân Đội)",
  bankAccountNo: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "0988888888",
  bankAccountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "WORLD TRADING LAB",
  vietqrTemplate: "compact2",

  statsStudentCount: "5,000+",
  statsSatisfactionRate: "98.6%",
  statsPracticalRate: "100%",
  statsSupportHours: "24/7",

  refundDays: 7,
  refundMaxProgress: 30,
};

/**
 * Fetch all system settings from database with fallback to DEFAULT_CONFIG
 */
export async function getSystemSettings(): Promise<SystemConfig> {
  try {
    const settings = await prisma.setting.findMany();
    const configMap: Record<string, string> = {};

    for (const item of settings) {
      configMap[item.key] = item.value;
    }

    return {
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

      statsStudentCount: configMap["statsStudentCount"] || DEFAULT_CONFIG.statsStudentCount,
      statsSatisfactionRate: configMap["statsSatisfactionRate"] || DEFAULT_CONFIG.statsSatisfactionRate,
      statsPracticalRate: configMap["statsPracticalRate"] || DEFAULT_CONFIG.statsPracticalRate,
      statsSupportHours: configMap["statsSupportHours"] || DEFAULT_CONFIG.statsSupportHours,

      refundDays: configMap["refundDays"] ? parseInt(configMap["refundDays"], 10) : DEFAULT_CONFIG.refundDays,
      refundMaxProgress: configMap["refundMaxProgress"]
        ? parseInt(configMap["refundMaxProgress"], 10)
        : DEFAULT_CONFIG.refundMaxProgress,
    };
  } catch (error) {
    console.error("Error loading system settings:", error);
    return DEFAULT_CONFIG;
  }
}
