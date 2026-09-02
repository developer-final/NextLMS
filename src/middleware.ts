import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET || "default_super_secret_for_dev_jwt_key_2026";
  const token = await getToken({ req, secret });

  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");

  // If not accessing admin routes, let request pass
  if (!isApiAdmin && !isAdminPage) {
    return NextResponse.next();
  }

  // 1. Check Authentication
  if (!token) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Check Account Status (BLOCKED users)
  if (token.status === "BLOCKED") {
    if (isApiAdmin) {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa." },
        { status: 403 }
      );
    }
    const blockedUrl = new URL("/auth/login", req.url);
    blockedUrl.searchParams.set("error", "BlockedAccount");
    return NextResponse.redirect(blockedUrl);
  }

  const role = token.role as string;
  const isAllowedAdminRole =
    role === "ADMIN" || role === "SUPER_ADMIN" || role === "INSTRUCTOR";

  // 3. Reject Regular Students or Unknown Roles
  if (!isAllowedAdminRole) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Sub-path restrictions for INSTRUCTOR role
  if (role === "INSTRUCTOR") {
    // Instructor should not access financial / system management APIs
    const restrictedApiPrefixes = [
      "/api/admin/orders",
      "/api/admin/settings",
      "/api/admin/coupons",
      "/api/admin/categories",
      "/api/admin/enrollments",
    ];
    if (isApiAdmin && restrictedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.json(
        { error: "Forbidden: Giảng viên không có quyền truy cập chức năng này." },
        { status: 403 }
      );
    }

    // Instructor should not access financial / system management Pages
    const restrictedPages = [
      "/admin/orders",
      "/admin/settings",
      "/admin/coupons",
      "/admin/categories",
      "/admin/students",
    ];
    if (isAdminPage && restrictedPages.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/admin/courses", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
