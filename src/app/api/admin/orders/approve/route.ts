import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

      // Execute approval atomically
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });

        // Create transaction audit record for manual approval
        await tx.transaction.create({
          data: {
            orderId: order.id,
            gatewayRef: `ADMIN-APPROVAL-${session.user.id}`,
            bankCode: order.paymentMethod,
            transferContent:
              order.proofImageUrl || "Admin manual verification",
            amount: order.finalAmount,
            rawWebhookData: JSON.stringify({
              approvedBy: session.user.id,
              approvedAt: new Date().toISOString(),
            }),
          },
        });

        // If order used a coupon, increment coupon's usedCount now upon approval
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Create Enrollment for each course in order
        for (const item of order.orderItems) {
          await tx.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: order.userId,
                courseId: item.courseId,
              },
            },
            update: {
              status: "ACTIVE",
            },
            create: {
              userId: order.userId,
              courseId: item.courseId,
              status: "ACTIVE",
              progressPercent: 0,
            },
          });
        }
      });

      // Asynchronously send transactional confirmation & welcome email
      if (order.user?.email) {
        const emailItems = order.orderItems.map((item) => ({
          title: item.course.title,
          price: `${Number(item.price).toLocaleString("vi-VN")} đ`,
        }));

        sendOrderConfirmationEmail({
          to: order.user.email,
          name: order.user.name,
          orderCode: order.orderCode,
          totalAmount: `${Number(order.finalAmount).toLocaleString("vi-VN")} đ`,
          items: emailItems,
        }).catch((err) => {
          console.error("[Approve Order] Failed to send invoice email:", err);
        });
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
          for (const item of order.orderItems) {
            await tx.enrollment.deleteMany({
              where: {
                userId: order.userId,
                courseId: item.courseId,
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
