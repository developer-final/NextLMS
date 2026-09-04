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
