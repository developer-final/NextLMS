import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

export interface ProcessPaymentParams {
  orderCode: string;
  gatewayRef?: string | null;
  amount: number;
  bankCode?: string | null;
  transferContent?: string | null;
  rawWebhookData?: string | null;
  paymentMethod: PaymentMethod;
}

export interface ProcessPaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  orderCode?: string;
  alreadyCompleted?: boolean;
  status?: number;
}

/**
 * Atomic processor for completing paid orders and activating enrollments.
 * Ensures Idempotency, prevents double activation, and sends confirmation emails.
 */
export async function completeOrderAndEnroll({
  orderCode,
  gatewayRef,
  amount,
  bankCode,
  transferContent,
  rawWebhookData,
  paymentMethod,
}: ProcessPaymentParams): Promise<ProcessPaymentResult> {
  const cleanOrderCode = orderCode.trim();

  const order = await prisma.order.findUnique({
    where: { orderCode: cleanOrderCode },
    include: {
      orderItems: {
        include: { course: true },
      },
      user: true,
      coupon: true,
    },
  });

  if (!order) {
    return {
      success: false,
      message: `Order #${cleanOrderCode} not found`,
      status: 404,
    };
  }

  // Idempotency check: If already completed, gracefully return success
  if (order.status === "COMPLETED") {
    return {
      success: true,
      alreadyCompleted: true,
      orderId: order.id,
      orderCode: order.orderCode,
      message: `Order #${cleanOrderCode} has already been completed and processed.`,
      status: 200,
    };
  }

  if (order.status === "CANCELLED") {
    return {
      success: false,
      message: `Order #${cleanOrderCode} has been cancelled and cannot be paid.`,
      status: 400,
    };
  }

  const expectedAmount = Number(order.finalAmount);
  // Ensure the received amount meets the required finalAmount (allow small rounding tolerance)
  if (amount < expectedAmount - 1) {
    return {
      success: false,
      message: `Insufficient payment: received ${amount}, expected ${expectedAmount}`,
      status: 400,
    };
  }

  // Atomic database transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update Order status
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        paymentMethod,
      },
    });

    // 2. Create Transaction audit record
    await tx.transaction.create({
      data: {
        orderId: order.id,
        gatewayRef: gatewayRef || null,
        bankCode: bankCode || null,
        transferContent: transferContent || null,
        amount,
        rawWebhookData: rawWebhookData || null,
      },
    });

    // 3. Activate Enrollment for every enrolled course
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

    // 4. Increment coupon usage count if coupon was attached
    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }
  });

  // Asynchronous transactional confirmation email
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
      console.error("[Payment Webhook] Failed to send invoice email:", err);
    });
  }

  return {
    success: true,
    message: `Order #${cleanOrderCode} successfully completed and enrolled.`,
    orderId: order.id,
    orderCode: order.orderCode,
    status: 200,
  };
}
