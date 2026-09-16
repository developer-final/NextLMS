import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";
import { settleMaturedCommissions } from "@/lib/affiliate";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 1. Verify user status (prevent BLOCKED users from requesting payouts)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user || user.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bankName, bankAccountNo, bankAccountName } = body;

    if (!bankName?.trim() || !bankAccountNo?.trim() || !bankAccountName?.trim()) {
      return NextResponse.json(
        { error: "Please provide complete bank account details" },
        { status: 400 }
      );
    }

    // Auto-settle matured commissions for this user before assessing available balance
    try {
      await settleMaturedCommissions(userId);
    } catch (settleErr) {
      console.warn("[Affiliate Payout] Settle matured commissions warning:", settleErr);
    }

    const settings = await getSystemSettings();
    const minPayout = Number(settings.affiliateMinPayout || 200000);

    // Atomic transaction: verify pending requests, calculate balance, lock commissions & create PayoutRequest
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if user has an existing PENDING or PROCESSING payout request to prevent double submissions
      const payoutFinder = typeof tx.payoutRequest?.findFirst === "function"
        ? tx.payoutRequest.findFirst
        : prisma.payoutRequest.findFirst;

      const pendingRequest = await payoutFinder({
        where: {
          userId,
          status: { in: ["PENDING", "PROCESSING"] },
        },
      });

      if (pendingRequest) {
        throw new Error("PENDING_PAYOUT_EXISTS");
      }

      // 2. Fetch available approved commissions that are not locked
      const commFinder = typeof tx.commission?.findMany === "function"
        ? tx.commission.findMany
        : prisma.commission.findMany;

      const availableCommissions = await commFinder({
        where: {
          affiliateId: userId,
          status: "APPROVED",
          payoutRequestId: null,
        },
        orderBy: { createdAt: "asc" },
      });

      const totalAvailable = availableCommissions.reduce(
        (sum, c) => sum + Number(c.commissionAmount),
        0
      );

      if (totalAvailable < minPayout) {
        throw new Error(`INSUFFICIENT_BALANCE:${totalAvailable}`);
      }

      const commissionsToLock = availableCommissions.map((c) => c.id);

      // 3. Create payout request
      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          amount: totalAvailable,
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim().toUpperCase(),
          status: "PENDING",
        },
      });

      // 4. Atomically link commissions to this payout request with optimistic concurrency check
      const updateResult = await tx.commission.updateMany({
        where: {
          id: { in: commissionsToLock },
          payoutRequestId: null,
          status: "APPROVED",
        },
        data: { payoutRequestId: payout.id },
      });

      if (updateResult.count !== commissionsToLock.length) {
        throw new Error("CONCURRENT_COMMISSION_LOCK_FAILED");
      }

      // 5. Persist default bank details in user profile for future payouts
      await tx.user.update({
        where: { id: userId },
        data: {
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim().toUpperCase(),
        },
      });

      return payout;
    });

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully. Admin will review and process your transfer shortly.",
      payout: result,
    });
  } catch (error: any) {
    if (error?.message === "PENDING_PAYOUT_EXISTS") {
      return NextResponse.json(
        {
          error: "You already have a pending payout request in review. Please wait for admin approval.",
        },
        { status: 400 }
      );
    }

    if (error?.message?.startsWith("INSUFFICIENT_BALANCE:")) {
      const balance = Number(error.message.split(":")[1]) || 0;
      return NextResponse.json(
        {
          error: `Minimum payout amount threshold not met. Your available balance is ${balance.toLocaleString("vi-VN")} VND.`,
        },
        { status: 400 }
      );
    }

    if (error?.message === "CONCURRENT_COMMISSION_LOCK_FAILED") {
      return NextResponse.json(
        {
          error: "Some commissions have already been requested or modified. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    console.error("[Affiliate Payout API] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit payout request" },
      { status: 500 }
    );
  }
}
