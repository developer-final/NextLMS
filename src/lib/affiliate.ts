import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate a clean, unique alphanumeric referral code.
 * Format: WTL-XXXXXX (e.g. WTL-7F89B2)
 */
export function generateRandomReferralCode(): string {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WTL-${randomHex}`;
}

/**
 * Ensure the given user has a unique referral code.
 * If user does not have one, generate and persist it.
 */
export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.referralCode) {
    return user.referralCode;
  }

  // Generate unique code and handle collisions gracefully
  let code = generateRandomReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch {
      // Code collision, retry with new random bytes
      code = generateRandomReferralCode();
      attempts++;
    }
  }

  // Fallback if random attempts collided: use user ID suffix
  const fallbackCode = `WTL-${user.id.slice(-6).toUpperCase()}`;
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: fallbackCode },
  });
  return fallbackCode;
}
