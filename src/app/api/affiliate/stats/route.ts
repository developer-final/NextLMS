import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUserReferralCode } from "@/lib/affiliate";
import { getSystemSettings } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const settings = await getSystemSettings();

    // Ensure the user has an active referral code
    const referralCode = await ensureUserReferralCode(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        customCommissionRate: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
      },
    });

    // Fetch all user commissions
    const allCommissions = await prisma.commission.findMany({
      where: { affiliateId: userId },
      include: {
        order: {
          select: {
            orderCode: true,
            createdAt: true,
            orderItems: {
              include: {
                course: {
                  select: {
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate aggregated KPI balances
    let lifetimeEarnings = 0;
    let availableBalance = 0;
    let pendingBalance = 0;
    let paidBalance = 0;

    for (const comm of allCommissions) {
      const amount = Number(comm.commissionAmount);
      if (comm.status !== "REJECTED") {
        lifetimeEarnings += amount;
      }

      if (comm.status === "APPROVED" && !comm.payoutRequestId) {
        availableBalance += amount;
      } else if (comm.status === "PENDING") {
        pendingBalance += amount;
      } else if (comm.status === "PAID") {
        paidBalance += amount;
      }
    }

    // Fetch recent payout requests
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const activeCommissionRate = user?.customCommissionRate
      ? Number(user.customCommissionRate)
      : Number(settings.affiliateCommissionPercent || 20);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        referralCode,
        commissionRate: activeCommissionRate,
      },
      stats: {
        totalReferredOrders: allCommissions.filter((c) => c.status !== "REJECTED").length,
        lifetimeEarnings,
        availableBalance,
        pendingBalance,
        paidBalance,
      },
      commissions: allCommissions.slice(0, 30),
      payoutRequests,
      settings: {
        enabled: settings.affiliateEnabled,
        defaultRate: settings.affiliateCommissionPercent,
        minPayout: settings.affiliateMinPayout,
        holdDays: settings.affiliateHoldDays,
        cookieDays: settings.affiliateCookieDays,
      },
    });
  } catch (error: any) {
    console.error("[Affiliate Stats API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate statistics" },
      { status: 500 }
    );
  }
}
