import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/config";

export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({
      success: true,
      settings: {
        appName: settings.appName,
        appSlogan: settings.appSlogan,
        supportEmail: settings.supportEmail,
        supportHotline: settings.supportHotline,
        zaloUrl: settings.zaloUrl,
        bankId: settings.bankId,
        bankName: settings.bankName,
        bankAccountNo: settings.bankAccountNo,
        bankAccountName: settings.bankAccountName,
        vietqrTemplate: settings.vietqrTemplate,
        refundDays: settings.refundDays,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load public settings" }, { status: 500 });
  }
}
