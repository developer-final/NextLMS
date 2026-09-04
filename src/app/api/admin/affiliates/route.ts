import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliates
 * Lists all registered users with affiliate profiles and performance stats
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                  { referralCode: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
          {
            OR: [
              { referralCode: { not: null } },
              { commissions: { some: {} } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        referralCode: true,
        customCommissionRate: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
        createdAt: true,
        _count: {
          select: {
            referredOrders: true,
            commissions: true,
            payoutRequests: true,
          },
        },
        commissions: {
          select: {
            commissionAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedAffiliates = users.map((u) => {
      let totalEarned = 0;
      let totalPaid = 0;
      let totalPending = 0;

      for (const c of u.commissions) {
        const amt = Number(c.commissionAmount);
        if (c.status !== "REJECTED") totalEarned += amt;
        if (c.status === "PAID") totalPaid += amt;
        if (c.status === "PENDING") totalPending += amt;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        referralCode: u.referralCode,
        customCommissionRate: u.customCommissionRate ? Number(u.customCommissionRate) : null,
        bankName: u.bankName,
        bankAccountNo: u.bankAccountNo,
        bankAccountName: u.bankAccountName,
        createdAt: u.createdAt,
        totalReferredOrders: u._count.referredOrders,
        totalCommissionsCount: u._count.commissions,
        totalEarned,
        totalPaid,
        totalPending,
      };
    });

    return NextResponse.json({
      success: true,
      affiliates: formattedAffiliates,
    });
  } catch (error: any) {
    console.error("[Admin Affiliates API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch affiliate partners" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/affiliates
 * Update partner custom commission rate or referral code
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, customCommissionRate, referralCode } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing required userId" }, { status: 400 });
    }

    const dataToUpdate: any = {};

    if (customCommissionRate !== undefined) {
      if (customCommissionRate === null || customCommissionRate === "") {
        dataToUpdate.customCommissionRate = null;
      } else {
        const rate = parseFloat(customCommissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          return NextResponse.json({ error: "Commission rate must be between 0 and 100" }, { status: 400 });
        }
        dataToUpdate.customCommissionRate = rate;
      }
    }

    if (referralCode) {
      const cleanCode = referralCode.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,32}$/.test(cleanCode)) {
        return NextResponse.json(
          { error: "Referral code must be 3-32 characters alphanumeric without special characters" },
          { status: 400 }
        );
      }

      // Check unique collision
      const existing = await prisma.user.findFirst({
        where: {
          referralCode: cleanCode,
          NOT: { id: userId },
        },
      });

      if (existing) {
        return NextResponse.json({ error: "This referral code is already taken" }, { status: 400 });
      }

      dataToUpdate.referralCode = cleanCode;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        referralCode: true,
        customCommissionRate: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate partner settings updated successfully",
      user: updated,
    });
  } catch (error: any) {
    console.error("[Admin Update Affiliate API] Error:", error);
    return NextResponse.json({ error: "Failed to update affiliate partner" }, { status: 500 });
  }
}
