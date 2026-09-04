import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings, invalidateSettingsCache, DEFAULT_CONFIG } from "@/lib/config";
import { validateBankSettingsInput, isValidEmail, sanitizePlainText, isValidSafeUrl } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await getSystemSettings();

    // Mask sensitive secret fields before returning to frontend
    const SENSITIVE_KEYS: (keyof typeof settings)[] = [
      "paypalSecret",
      "stripeSecretKey",
      "stripeWebhookSecret",
      "payosApiKey",
      "payosChecksumKey",
      "sepayApiKey",
    ];

    const maskedSettings = { ...settings };
    for (const key of SENSITIVE_KEYS) {
      const val = maskedSettings[key];
      if (typeof val === "string" && val.length > 0) {
        (maskedSettings as any)[key] =
          val.length <= 4 ? "••••" : "••••" + val.slice(-4);
      }
    }

    return NextResponse.json({ success: true, settings: maskedSettings });
  } catch (error: any) {
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ error: "Error loading settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    if (settings.supportEmail && !isValidEmail(String(settings.supportEmail))) {
      return NextResponse.json({ error: "Invalid support email format" }, { status: 400 });
    }

    if (settings.bankId || settings.bankAccountNo || settings.bankAccountName) {
      const bankVal = validateBankSettingsInput({
        bankId: settings.bankId,
        bankAccountNo: settings.bankAccountNo,
        bankAccountName: settings.bankAccountName,
      });
      if (!bankVal.isValid) {
        return NextResponse.json({ error: bankVal.error }, { status: 400 });
      }
    }

    // Mapping of keys to group for organization
    const groupMapping: Record<string, string> = {
      appName: "GENERAL",
      appSlogan: "GENERAL",
      appDescription: "GENERAL",
      supportEmail: "CONTACT",
      supportHotline: "CONTACT",
      zaloUrl: "CONTACT",
      telegramUrl: "CONTACT",
      facebookUrl: "CONTACT",
      bankId: "PAYMENT",
      bankName: "PAYMENT",
      bankAccountNo: "PAYMENT",
      bankAccountName: "PAYMENT",
      vietqrTemplate: "PAYMENT",
      paymentManualEnabled: "PAYMENT",
      paymentVietqrAutoEnabled: "PAYMENT",
      paymentVietqrProvider: "PAYMENT",
      payosClientId: "PAYMENT",
      payosApiKey: "PAYMENT",
      payosChecksumKey: "PAYMENT",
      sepayApiKey: "PAYMENT",
      sepayAccountNumber: "PAYMENT",
      paymentPaypalEnabled: "PAYMENT",
      paypalClientId: "PAYMENT",
      paypalSecret: "PAYMENT",
      paypalMode: "PAYMENT",
      paymentStripeEnabled: "PAYMENT",
      stripePublishableKey: "PAYMENT",
      stripeSecretKey: "PAYMENT",
      stripeWebhookSecret: "PAYMENT",
      usdExchangeRate: "PAYMENT",
      paymentCryptoEnabled: "PAYMENT",
      cryptoBep20Address: "PAYMENT",
      cryptoTrc20Address: "PAYMENT",
      statsStudentCount: "HERO",
      statsSatisfactionRate: "HERO",
      statsPracticalRate: "HERO",
      statsSupportHours: "HERO",
      refundDays: "POLICY",
      refundMaxProgress: "POLICY",
      affiliateEnabled: "AFFILIATE",
      affiliateCommissionPercent: "AFFILIATE",
      affiliateCookieDays: "AFFILIATE",
      affiliateHoldDays: "AFFILIATE",
      affiliateMinPayout: "AFFILIATE",
    };

    // Upsert each setting with sanitization
    const URL_SETTING_KEYS = new Set(["zaloUrl", "telegramUrl", "facebookUrl"]);
    const updatePromises = Object.entries(settings).map(([key, val]) => {
      let stringValue = String(val ?? "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

      if (URL_SETTING_KEYS.has(key)) {
        if (stringValue && !isValidSafeUrl(stringValue)) {
          stringValue = "";
        }
      } else if (!key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret")) {
        stringValue = sanitizePlainText(stringValue, 1000);
      }

      const group = groupMapping[key] || "GENERAL";

      return prisma.setting.upsert({
        where: { key },
        update: { value: stringValue, group },
        create: { key, value: stringValue, group },
      });
    });

    await prisma.$transaction(updatePromises);

    invalidateSettingsCache();
    try {
      revalidatePath("/", "layout");
    } catch {
      // Ignore if called outside of request context
    }

    const updatedSettings = await getSystemSettings();

    return NextResponse.json({
      success: true,
      message: "System settings saved successfully!",
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error("Admin Settings POST Error:", error);
    return NextResponse.json({ error: "Error saving system settings" }, { status: 500 });
  }
}
