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

    const { orderId, action } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing required orderId" }, { status: 400 });
    }

    // Strict action validation
    if (action !== "APPROVE" && action !== "CANCEL") {
      return NextResponse.json(
        { error: "Invalid action. Only APPROVE or CANCEL is supported." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: { course: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // State machine check
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
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });

        // If previously completed, revoke access and refund coupon usage
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
            await tx.coupon.update({
              where: { id: order.couponId },
              data: {
                usedCount: { decrement: 1 },
              },
            });
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: wasCompleted
          ? "Order cancelled and course access revoked successfully."
          : "Order cancelled successfully.",
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
