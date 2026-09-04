import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeOrderAndEnroll } from "@/lib/payment-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user;

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const targetIds: string[] = Array.isArray(body.orderIds)
      ? body.orderIds
      : body.orderId
      ? [body.orderId]
      : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Missing required orderId or orderIds" }, { status: 400 });
    }

    // Strict action validation
    if (action !== "APPROVE" && action !== "CANCEL") {
      return NextResponse.json(
        { error: "Invalid action. Only APPROVE or CANCEL is supported." },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: targetIds } },
      include: {
        user: true,
        orderItems: {
          include: { course: true },
        },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No matching orders found" }, { status: 404 });
    }

    // Single order backward compatibility flow
    if (targetIds.length === 1 && !Array.isArray(body.orderIds)) {
      const order = orders[0];

      if (action === "APPROVE") {
        if (order.status === "COMPLETED") {
          return NextResponse.json(
            { error: "This order has already been approved." },
            { status: 400 }
          );
        }
        if (order.status === "CANCELLED") {
          return NextResponse.json(
            { error: "Cannot approve a cancelled order." },
            { status: 400 }
          );
        }

        const result = await completeOrderAndEnroll({
          orderCode: order.orderCode,
          gatewayRef: `ADMIN-APPROVAL-${session.user.id}`,
          bankCode: order.paymentMethod,
          transferContent:
            order.proofImageUrl || "Admin manual verification",
          amount: Number(order.finalAmount),
          rawWebhookData: JSON.stringify({
            approvedBy: session.user.id,
            approvedAt: new Date().toISOString(),
          }),
          paymentMethod: order.paymentMethod,
        });

        if (!result.success && !result.alreadyCompleted) {
          return NextResponse.json(
            { error: result.message },
            { status: result.status || 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Order approved and course access activated successfully.",
        });
      }

      if (action === "CANCEL") {
        if (order.status === "CANCELLED") {
          return NextResponse.json(
            { error: "This order has already been cancelled." },
            { status: 400 }
          );
        }

        const wasCompleted = order.status === "COMPLETED";

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });

          if (wasCompleted) {
            const courseIds = order.orderItems.map((item) => item.courseId);
            if (courseIds.length > 0) {
              await tx.enrollment.deleteMany({
                where: {
                  userId: order.userId,
                  courseId: { in: courseIds },
                },
              });
            }

            if (order.couponId) {
              await tx.coupon.updateMany({
                where: { id: order.couponId, usedCount: { gt: 0 } },
                data: {
                  usedCount: { decrement: 1 },
                },
              });
            }

            // Invalidate any unpaid affiliate commission associated with this cancelled order
            await tx.commission.updateMany({
              where: {
                orderId: order.id,
                status: { in: ["PENDING", "APPROVED"] },
              },
              data: {
                status: "REJECTED",
                payoutRequestId: null,
              },
            });
          }
        });

        return NextResponse.json({
          success: true,
          message: wasCompleted
            ? "Order cancelled and course access revoked successfully."
            : "Order cancelled successfully.",
        });
      }
    }

    // Bulk operation flow
    let processedCount = 0;

    if (action === "APPROVE") {
      const eligibleOrders = orders.filter((o) => o.status === "PENDING");
      for (const order of eligibleOrders) {
        try {
          const result = await completeOrderAndEnroll({
            orderCode: order.orderCode,
            gatewayRef: `ADMIN-BULK-APPROVAL-${session.user.id}`,
            bankCode: order.paymentMethod,
            transferContent:
              order.proofImageUrl || "Admin manual bulk verification",
            amount: Number(order.finalAmount),
            rawWebhookData: JSON.stringify({
              approvedBy: session.user.id,
              approvedAt: new Date().toISOString(),
              bulk: true,
            }),
            paymentMethod: order.paymentMethod,
          });

          if (result.success || result.alreadyCompleted) {
            processedCount++;
          }
        } catch (err) {
          console.error(`Failed to approve order ${order.id}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        count: processedCount,
        total: targetIds.length,
        message: `Successfully approved ${processedCount} of ${targetIds.length} orders.`,
      });
    }

    if (action === "CANCEL") {
      const cancellableOrders = orders.filter((o) => o.status !== "CANCELLED");
      for (const order of cancellableOrders) {
        try {
          const wasCompleted = order.status === "COMPLETED";
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: { status: "CANCELLED" },
            });

            if (wasCompleted) {
              const courseIds = order.orderItems.map((item) => item.courseId);
              if (courseIds.length > 0) {
                await tx.enrollment.deleteMany({
                  where: {
                    userId: order.userId,
                    courseId: { in: courseIds },
                  },
                });
              }

              if (order.couponId) {
                await tx.coupon.updateMany({
                  where: { id: order.couponId, usedCount: { gt: 0 } },
                  data: {
                    usedCount: { decrement: 1 },
                  },
                });
              }

              // Invalidate any unpaid affiliate commission associated with this cancelled order
              await tx.commission.updateMany({
                where: {
                  orderId: order.id,
                  status: { in: ["PENDING", "APPROVED"] },
                },
                data: {
                  status: "REJECTED",
                  payoutRequestId: null,
                },
              });
            }
          });
          processedCount++;
        } catch (err) {
          console.error(`Failed to cancel order ${order.id}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        count: processedCount,
        total: targetIds.length,
        message: `Successfully cancelled ${processedCount} of ${targetIds.length} orders.`,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("Approve Order Error:", error);
    return NextResponse.json(
      { error: "Failed to process order status change." },
      { status: 500 }
    );
  }
}
