import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/config";

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
    const body = await req.json();
    const { amount, bankName, bankAccountNo, bankAccountName } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    if (!bankName?.trim() || !bankAccountNo?.trim() || !bankAccountName?.trim()) {
      return NextResponse.json(
        { error: "Please provide complete bank account details" },
        { status: 400 }
      );
    }

    const settings = await getSystemSettings();
    const minPayout = Number(settings.affiliateMinPayout || 200000);

    if (withdrawAmount < minPayout) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is ${minPayout.toLocaleString("vi-VN")} VND`,
        },
        { status: 400 }
      );
    }

    // Check if user has an existing PENDING payout request to prevent double submissions
    const pendingRequest = await prisma.payoutRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        {
          error: "You already have a pending payout request in review. Please wait for admin approval.",
        },
        { status: 400 }
      );
    }

    // Calculate actual available approved balance
    const availableCommissions = await prisma.commission.findMany({
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

    if (withdrawAmount > totalAvailable) {
      return NextResponse.json(
        {
          error: `Insufficient available balance. You currently have ${totalAvailable.toLocaleString("vi-VN")} VND available for withdrawal.`,
        },
        { status: 400 }
      );
    }

    // Select enough commissions to cover or equal the requested payout
    let accumulated = 0;
    const commissionsToLock: string[] = [];
    for (const comm of availableCommissions) {
      commissionsToLock.push(comm.id);
      accumulated += Number(comm.commissionAmount);
      if (accumulated >= withdrawAmount) {
        break;
      }
    }

    // Atomic transaction: create PayoutRequest and link chosen commissions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payout request
      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          amount: withdrawAmount,
          bankName: bankName.trim(),
          bankAccountNo: bankAccountNo.trim(),
          bankAccountName: bankAccountName.trim().toUpperCase(),
          status: "PENDING",
        },
      });

      // 2. Link commissions to this payout request to lock them from further withdrawals
      await tx.commission.updateMany({
        where: { id: { in: commissionsToLock } },
        data: { payoutRequestId: payout.id },
      });

      // 3. Persist default bank details in user profile for future payouts
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
    console.error("[Affiliate Payout API] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit payout request" },
      { status: 500 }
    );
  }
}
