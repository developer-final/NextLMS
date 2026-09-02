import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings, DEFAULT_CONFIG } from "@/lib/config";
import { validateBankSettingsInput, isValidEmail } from "@/lib/validation";

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
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ error: "Lỗi tải cấu hình" }, { status: 500 });
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
      return NextResponse.json({ error: "Dữ liệu cấu hình không hợp lệ" }, { status: 400 });
    }

    if (settings.supportEmail && !isValidEmail(String(settings.supportEmail))) {
      return NextResponse.json({ error: "Email hỗ trợ không đúng định dạng" }, { status: 400 });
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
      statsStudentCount: "HERO",
      statsSatisfactionRate: "HERO",
      statsPracticalRate: "HERO",
      statsSupportHours: "HERO",
      refundDays: "POLICY",
      refundMaxProgress: "POLICY",
    };

    // Upsert each setting
    const updatePromises = Object.entries(settings).map(([key, val]) => {
      const stringValue = String(val ?? "");
      const group = groupMapping[key] || "GENERAL";

      return prisma.setting.upsert({
        where: { key },
        update: { value: stringValue, group },
        create: { key, value: stringValue, group },
      });
    });

    await prisma.$transaction(updatePromises);

    const updatedSettings = await getSystemSettings();

    return NextResponse.json({
      success: true,
      message: "Lưu cấu hình hệ thống thành công!",
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error("Admin Settings POST Error:", error);
    return NextResponse.json({ error: "Lỗi lưu cấu hình hệ thống" }, { status: 500 });
  }
}
