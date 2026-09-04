import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PayoutStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliates/payouts
 * List all payout requests from affiliates
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();

    const whereClause: any = {};
    if (statusParam && ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"].includes(statusParam)) {
      whereClause.status = statusParam as PayoutStatus;
    }

    const payouts = await prisma.payoutRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            referralCode: true,
          },
        },
        commissions: {
          select: {
            id: true,
            commissionAmount: true,
            orderId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      payouts,
    });
  } catch (error: any) {
    console.error("[Admin Payouts API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch payout requests" }, { status: 500 });
  }
}

/**
 * POST /api/admin/affiliates/payouts
 * Process payout approval or rejection
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { payoutId, action, adminNote, proofImageUrl } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: "Missing payoutId or action" }, { status: 400 });
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { commissions: true },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    if (payout.status === "COMPLETED") {
      return NextResponse.json({ error: "Payout request has already been completed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Approve and mark commissions as PAID
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: "COMPLETED",
            adminNote: adminNote?.trim() || null,
            proofImageUrl: proofImageUrl?.trim() || null,
            processedAt: new Date(),
          },
        });

        await tx.commission.updateMany({
          where: { payoutRequestId: payoutId },
          data: {
            status: "PAID",
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payout request approved successfully. Funds marked as paid.",
      });
    } else if (action === "REJECT") {
      // Reject and release commissions back to APPROVED state so affiliate can re-request
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: "REJECTED",
            adminNote: adminNote?.trim() || "Rejected by administrator",
            processedAt: new Date(),
          },
        });

        // Unlink commissions from this payout request so they can be withdrawn again
        await tx.commission.updateMany({
          where: { payoutRequestId: payoutId },
          data: {
            payoutRequestId: null,
            status: "APPROVED",
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payout request rejected and funds returned to affiliate's available balance.",
      });
    }

    return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Process Payout API] Error:", error);
    return NextResponse.json({ error: "Failed to process payout request" }, { status: 500 });
  }
}
