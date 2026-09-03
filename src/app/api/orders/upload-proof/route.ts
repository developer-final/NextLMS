import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSafeUrl } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const userId = session.user?.id;
    const userRole = session.user?.role;
    const { orderCode, proofImageUrl } = await req.json();

    if (!orderCode) {
      return NextResponse.json({ error: "Missing order code" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check 1: Only the order owner or ADMIN/SUPER_ADMIN can upload proof
    if (order.userId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update proof for this order" },
        { status: 403 }
      );
    }

    // Security check 2: Prevent updating cancelled orders
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order has been cancelled and cannot accept payment proof" },
        { status: 400 }
      );
    }

    if (!proofImageUrl?.trim()) {
      return NextResponse.json(
        { error: "Please provide transfer receipt image" },
        { status: 400 }
      );
    }

    const trimmedProofUrl = proofImageUrl.trim();

    // Security check 3: Validate against XSS / JavaScript URI injections
    if (!isValidSafeUrl(trimmedProofUrl)) {
      return NextResponse.json(
        { error: "Invalid or unsafe receipt image URL" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { orderCode },
      data: {
        proofImageUrl: trimmedProofUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment receipt submitted successfully! Admin will review shortly.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Upload Proof Error:", error);
    return NextResponse.json({ error: "Error updating payment receipt" }, { status: 500 });
  }
}
