import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { evaluateRbacAccess } from "@/lib/rbac";
import {
  COOKIE_LOCALE_KEY,
  getCountryFromRequest,
  detectLanguageFromCountry,
} from "@/lib/i18n";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. RBAC & Authenticated route protection
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isProtectedApiRoute = [
    "/api/orders",
    "/api/progress",
    "/api/comments",
    "/api/upload",
    "/api/user",
    "/api/coupons",
    "/api/attachments",
  ].some((prefix) => pathname.startsWith(prefix));

  if (isAdminRoute || isProtectedApiRoute) {
    const secret = (() => {
      const s = process.env.NEXTAUTH_SECRET;
      if (!s && process.env.NODE_ENV === "production") {
        throw new Error("NEXTAUTH_SECRET environment variable must be set in production");
      }
      return s || "default_super_secret_for_dev_jwt_key_2026";
    })();
    const token = await getToken({ req, secret });

    // Admin route access control (full RBAC evaluation)
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
    }

    // Non-admin authenticated API routes: block BLOCKED users
    if (token && token.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }
  }

  // 2. GeoIP & Internationalization detection for visitors
  // Do not modify auth callback endpoints or internal API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const existingLocaleCookie = req.cookies.get(COOKIE_LOCALE_KEY)?.value;
  const res = NextResponse.next();

  // If visitor already has a locale cookie (previously selected or detected), preserve it
  if (existingLocaleCookie) {
    return res;
  }

  // Detect country from Vercel edge headers, proxy headers, or dev query param
  const { country, source } = getCountryFromRequest(req);
  const detectedLocale = detectLanguageFromCountry(country);

  // Set the NEXT_LOCALE cookie for seamless UX across page loads
  res.cookies.set({
    name: COOKIE_LOCALE_KEY,
    value: detectedLocale,
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
  });

  res.headers.set("x-detected-country", country || "UNKNOWN");
  res.headers.set("x-detected-locale", detectedLocale);
  res.headers.set("x-geo-source", source);

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

