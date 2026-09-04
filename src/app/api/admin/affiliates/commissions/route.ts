import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommissionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliates/commissions
 * Retrieve global list of affiliate commissions with status filtering and search
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();
    const query = searchParams.get("q")?.trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 30;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (statusParam && ["PENDING", "APPROVED", "REJECTED", "PAID"].includes(statusParam)) {
      whereClause.status = statusParam as CommissionStatus;
    }

    if (query) {
      whereClause.OR = [
        { order: { orderCode: { contains: query, mode: "insensitive" } } },
        { affiliate: { name: { contains: query, mode: "insensitive" } } },
        { affiliate: { email: { contains: query, mode: "insensitive" } } },
        { affiliate: { referralCode: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [total, commissions] = await Promise.all([
      prisma.commission.count({ where: whereClause }),
      prisma.commission.findMany({
        where: whereClause,
        include: {
          affiliate: {
            select: {
              id: true,
              name: true,
              email: true,
              referralCode: true,
            },
          },
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
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      commissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Admin Commissions API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch commission records" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/affiliates/commissions
 * Admin action to manually APPROVE early or REJECT/VOID an affiliate commission
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { commissionId, action } = body;

    if (!commissionId || !action) {
      return NextResponse.json({ error: "Missing commissionId or action" }, { status: 400 });
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
    }

    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    if (commission.status === "PAID") {
      return NextResponse.json({ error: "Cannot modify a commission that has already been paid" }, { status: 400 });
    }

    if (action === "APPROVE") {
      if (commission.status === "APPROVED") {
        return NextResponse.json({ error: "Commission is already approved" }, { status: 400 });
      }

      const updated = await prisma.commission.update({
        where: { id: commissionId },
        data: {
          status: "APPROVED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Commission approved successfully",
        commission: updated,
      });
    } else if (action === "REJECT") {
      if (commission.status === "REJECTED") {
        return NextResponse.json({ error: "Commission is already rejected" }, { status: 400 });
      }

      const updated = await prisma.commission.update({
        where: { id: commissionId },
        data: {
          status: "REJECTED",
          payoutRequestId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Commission rejected successfully",
        commission: updated,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Update Commission API] Error:", error);
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 });
  }
}
