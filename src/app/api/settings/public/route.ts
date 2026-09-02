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

        // Public Payment Gateway Settings
        paymentManualEnabled: settings.paymentManualEnabled,
        paymentVietqrAutoEnabled: settings.paymentVietqrAutoEnabled,
        paymentVietqrProvider: settings.paymentVietqrProvider,
        paymentPaypalEnabled: settings.paymentPaypalEnabled,
        paypalClientId: settings.paypalClientId,
        paypalMode: settings.paypalMode,
        paymentStripeEnabled: settings.paymentStripeEnabled,
        stripePublishableKey: settings.stripePublishableKey,
        usdExchangeRate: settings.usdExchangeRate,

        // Crypto Manual Payment
        paymentCryptoEnabled: settings.paymentCryptoEnabled,
        cryptoBep20Address: settings.cryptoBep20Address,
        cryptoTrc20Address: settings.cryptoTrc20Address,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load public settings" }, { status: 500 });
  }
}
