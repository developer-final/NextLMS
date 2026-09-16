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

/**
 * Automatically settles matured affiliate commissions whose holding period has passed.
 * Commissions with availableAt <= now and COMPLETED orders transition from PENDING -> APPROVED.
 * Commissions with CANCELLED or REFUNDED orders transition from PENDING -> REJECTED.
 *
 * @param userId Optional userId to restrict settlement to a single affiliate partner.
 */
export async function settleMaturedCommissions(userId?: string): Promise<{ approved: number; rejected: number }> {
  const now = new Date();
  const whereClause: any = {
    status: "PENDING",
    availableAt: { lte: now },
  };

  if (userId) {
    whereClause.affiliateId = userId;
  }

  const maturedCommissions = await prisma.commission.findMany({
    where: whereClause,
    select: {
      id: true,
      order: {
        select: { status: true },
      },
    },
    take: 200,
  });

  if (maturedCommissions.length === 0) {
    return { approved: 0, rejected: 0 };
  }

  const commIdsToApprove: string[] = [];
  const commIdsToReject: string[] = [];

  for (const c of maturedCommissions) {
    if (c.order?.status === "COMPLETED") {
      commIdsToApprove.push(c.id);
    } else if (c.order?.status === "CANCELLED" || c.order?.status === "REFUNDED") {
      commIdsToReject.push(c.id);
    }
  }

  let approvedCount = 0;
  let rejectedCount = 0;

  if (commIdsToApprove.length > 0) {
    const res = await prisma.commission.updateMany({
      where: { id: { in: commIdsToApprove } },
      data: { status: "APPROVED" },
    });
    approvedCount = res.count;
  }

  if (commIdsToReject.length > 0) {
    const res = await prisma.commission.updateMany({
      where: { id: { in: commIdsToReject } },
      data: { status: "REJECTED", payoutRequestId: null },
    });
    rejectedCount = res.count;
  }

  return { approved: approvedCount, rejected: rejectedCount };
}
