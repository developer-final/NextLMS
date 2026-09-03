/**
 * Helper to generate VietQR QuickPay dynamic image URL
 * Standard: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<ACCOUNT_NAME>
 */

export interface VietQRParams {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  description: string;
  template?: "compact" | "compact2" | "qr_only" | "print";
}

export function generateVietQRUrl({
  bankId = process.env.BANK_ID || "MB",
  accountNo = process.env.BANK_ACCOUNT_NO || "0988888888",
  accountName = process.env.BANK_ACCOUNT_NAME || "WORLD TRADING LAB",
  amount,
  description,
  template = "compact2",
}: VietQRParams): string {
  const cleanAccountNo = accountNo.trim();
  const cleanBankId = bankId.trim();
  const encodedContent = encodeURIComponent(description.trim());
  const encodedName = encodeURIComponent(accountName.trim());

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-${template}.png?amount=${Math.round(
    amount
  )}&addInfo=${encodedContent}&accountName=${encodedName}`;
}
