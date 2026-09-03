import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFileFromStorage } from "@/lib/s3";

export async function GET(req: Request) {
  return handleCleanupCron(req);
}

export async function POST(req: Request) {
  return handleCleanupCron(req);
}

/**
 * Scheduled cleanup worker:
 * 1. Cancels stale PENDING orders older than 24 hours.
 * 2. Deletes expired verification and password reset tokens.
 * 3. Removes orphaned attachments unlinked for more than 24 hours and purges physical files.
 * 4. Permanently purges soft-deleted blog posts older than 90 days.
 */
async function handleCleanupCron(req: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET?.trim();

    // Security check: Verify Bearer token or secret query parameter
    const querySecret = searchParams.get("secret") || searchParams.get("key");
    const bearerSecret = authHeader?.replace(/^Bearer\s+/i, "");
    const providedSecret = bearerSecret || querySecret;

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Cancel stale PENDING orders older than 24 hours
    const cancelledOrdersResult = await prisma.order.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
      data: {
        status: "CANCELLED",
        adminNote: "Auto-cancelled by scheduled cleanup: Order expired after 24 hours without payment.",
      },
    });

    // 2. Delete expired authentication & verification tokens
    const deletedTokensResult = await prisma.verificationToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // 3. Find and purge orphaned attachments (uploaded but never linked to any entity after 24h)
    const orphanedAttachments = await prisma.attachment.findMany({
      where: {
        courseId: null,
        lessonId: null,
        postId: null,
        createdAt: { lt: twentyFourHoursAgo },
      },
      take: 50, // Safe batch limit per execution
    });

    let cleanedAttachmentsCount = 0;
    for (const attachment of orphanedAttachments) {
      try {
        if (attachment.fileKey) {
          await deleteFileFromStorage(attachment.fileKey);
        }
        await prisma.attachment.delete({
          where: { id: attachment.id },
        });
        cleanedAttachmentsCount++;
      } catch (fileErr) {
        console.error(
          `[Cron Cleanup] Failed to cleanup orphaned attachment ${attachment.id}:`,
          fileErr
        );
      }
    }

    // 4. Permanently purge soft-deleted blog posts older than 90 days
    const purgedPostsResult = await prisma.blogPost.deleteMany({
      where: {
        deletedAt: { lt: ninetyDaysAgo },
      },
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      durationMs,
      summary: {
        cancelledOrders: cancelledOrdersResult.count,
        deletedTokens: deletedTokensResult.count,
        cleanedAttachments: cleanedAttachmentsCount,
        purgedSoftDeletedPosts: purgedPostsResult.count,
      },
      message: `Cleanup completed in ${durationMs}ms. Cancelled ${cancelledOrdersResult.count} orders, deleted ${deletedTokensResult.count} expired tokens, cleaned ${cleanedAttachmentsCount} orphaned files, purged ${purgedPostsResult.count} old posts.`,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error("[Cron Cleanup Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal cleanup job failure",
        durationMs,
      },
      { status: 500 }
    );
  }
}
