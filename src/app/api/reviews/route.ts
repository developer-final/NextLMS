import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, reviewRateLimiter } from "@/lib/rate-limit";
import { validateReviewInput } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    const whereClause = {
      courseId,
      isApproved: true,
    };

    const [totalReviews, reviews, allApprovedReviews] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.review.findMany({
        where: whereClause,
        select: { rating: true },
      }),
    ]);

    // Calculate rating statistics
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;

    for (const r of allApprovedReviews) {
      totalScore += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating as keyof typeof ratingCounts] += 1;
      }
    }

    const averageRating =
      allApprovedReviews.length > 0
        ? Number((totalScore / allApprovedReviews.length).toFixed(1))
        : 5.0;

    const totalPages = Math.max(1, Math.ceil(totalReviews / pageSize));

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        ratingCounts,
      },
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalReviews,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Reviews GET Error:", error);
    return NextResponse.json({ error: "Error loading reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate Limiting
    const clientIp = getClientIp(req);
    const rateCheck = reviewRateLimiter.check(userId || clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `You are submitting reviews too quickly. Please wait ${waitSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { "Retry-After": waitSeconds.toString() },
        }
      );
    }

    const body = await req.json();
    const validation = validateReviewInput(body);
    if (!validation.isValid || !validation.sanitized) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { courseId, rating, comment } = validation.sanitized;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Verify user is enrolled with ACTIVE status
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

    if (!isStaff && (!enrollment || enrollment.status !== "ACTIVE")) {
      return NextResponse.json(
        { error: "Only enrolled students can submit a review for this course" },
        { status: 403 }
      );
    }

    // Check if user already reviewed this course (Upsert pattern to prevent duplicate reviews)
    const existingReview = await prisma.review.findFirst({
      where: { userId, courseId },
    });

    let review;
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment,
          isApproved: true,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          courseId,
          rating,
          comment,
          isApproved: true,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Reviews POST Error:", error);
    return NextResponse.json({ error: "Error submitting review" }, { status: 500 });
  }
}
