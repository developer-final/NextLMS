import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateProfileUpdate, isValidSafeUrl } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile
 * Retrieves full profile details and learning statistics for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem thông tin cá nhân" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true,
        headline: true,
        bio: true,
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin người dùng" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        headline: user.headline,
        bio: user.bio,
        emailVerified: user.emailVerified,
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt,
        stats: {
          enrolledCourses: user._count.enrollments,
          certificates: user._count.certificates,
          reviews: user._count.reviews,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải thông tin cá nhân" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Updates basic profile attributes (name, headline, bio, avatarUrl)
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để cập nhật thông tin" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, headline, bio, avatarUrl } = body;

    const validation = validateProfileUpdate({ name, headline, bio });
    if (!validation.isValid || !validation.sanitized) {
      return NextResponse.json(
        { error: validation.error || "Dữ liệu cập nhật không hợp lệ", field: validation.field },
        { status: 400 }
      );
    }

    const updateData: {
      name: string;
      headline: string | null;
      bio: string | null;
      avatarUrl?: string | null;
    } = {
      name: validation.sanitized.name,
      headline: validation.sanitized.headline,
      bio: validation.sanitized.bio,
    };

    // If avatarUrl is explicitly passed (e.g., reset or change)
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === "") {
        // Fallback to DiceBear avatar based on sanitized name
        updateData.avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          validation.sanitized.name
        )}`;
      } else if (isValidSafeUrl(avatarUrl)) {
        updateData.avatarUrl = avatarUrl;
      } else {
        return NextResponse.json(
          { error: "Đường dẫn ảnh đại diện không hợp lệ" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin hồ sơ thành công",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi cập nhật thông tin" },
      { status: 500 }
    );
  }
}
