import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { evaluateRbacAccess } from "@/lib/rbac";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = (() => {
    const s = process.env.NEXTAUTH_SECRET;
    if (!s && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET environment variable must be set in production");
    }
    return s || "default_super_secret_for_dev_jwt_key_2026";
  })();
  const token = await getToken({ req, secret });

  // Admin route access control (full RBAC evaluation)
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute) {
    const decision = evaluateRbacAccess(pathname, token, req.url);

    if (!decision.allowed) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: decision.error }, { status: decision.status });
      }
      if (decision.redirectUrl) {
        return NextResponse.redirect(new URL(decision.redirectUrl));
      }
    }

    return NextResponse.next();
  }

  // Non-admin authenticated API routes: block BLOCKED users
  if (token && token.status === "BLOCKED") {
    return NextResponse.json(
      { error: "Your account has been suspended. Please contact support." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/orders/:path*",
    "/api/progress/:path*",
    "/api/comments/:path*",
    "/api/upload/:path*",
    "/api/user/:path*",
    "/api/coupons/:path*",
    "/api/attachments/:path*",
  ],
};

