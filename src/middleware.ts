import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { evaluateRbacAccess } from "@/lib/rbac";
import {
  COOKIE_LOCALE_KEY,
  getCountryFromRequest,
  detectLanguageFromCountry,
} from "@/lib/i18n";
import {
  COOKIE_NICHE_KEY,
  COOKIE_BRAND_KEY,
  COOKIE_TEACHER_KEY,
  HEADER_NICHE_KEY,
  HEADER_BRAND_KEY,
  HEADER_TEACHER_KEY,
} from "@/lib/niches";

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
    "/api/affiliate",
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

    // Non-admin authenticated API routes
    if (isProtectedApiRoute && !isAdminRoute) {
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized: Please log in" },
          { status: 401 }
        );
      }
    }

    // Block BLOCKED users from all protected routes
    if (token && token.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }
  }

  // 2. Demo Niche Dynamic Parameters & GeoIP Detection
  // Do not modify auth callback endpoints or internal API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);

  const safeHeaderEncode = (val: string) => encodeURIComponent(val);

  // Handle Dynamic Demo Niche query params: ?niche=... &brand=... &teacher=...
  const nicheParam = req.nextUrl.searchParams.get("niche");
  const brandParam = req.nextUrl.searchParams.get("brand");
  const teacherParam = req.nextUrl.searchParams.get("teacher");

  const existingNicheCookie = req.cookies.get(COOKIE_NICHE_KEY)?.value;
  const existingBrandCookie = req.cookies.get(COOKIE_BRAND_KEY)?.value;
  const existingTeacherCookie = req.cookies.get(COOKIE_TEACHER_KEY)?.value;

  if (existingNicheCookie) requestHeaders.set(HEADER_NICHE_KEY, safeHeaderEncode(existingNicheCookie));
  if (existingBrandCookie) requestHeaders.set(HEADER_BRAND_KEY, safeHeaderEncode(existingBrandCookie));
  if (existingTeacherCookie) requestHeaders.set(HEADER_TEACHER_KEY, safeHeaderEncode(existingTeacherCookie));

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (nicheParam !== null) {
    const cleanNiche = nicheParam.trim().toLowerCase();
    if (cleanNiche === "reset" || cleanNiche === "default") {
      res.cookies.delete(COOKIE_NICHE_KEY);
      res.cookies.delete(COOKIE_BRAND_KEY);
      res.cookies.delete(COOKIE_TEACHER_KEY);
      requestHeaders.delete(HEADER_NICHE_KEY);
      requestHeaders.delete(HEADER_BRAND_KEY);
      requestHeaders.delete(HEADER_TEACHER_KEY);
    } else if (cleanNiche) {
      // If switching to a DIFFERENT niche without explicit brand/teacher, wipe the previous niche's overrides
      if (existingNicheCookie && existingNicheCookie !== cleanNiche) {
        if (brandParam === null) {
          res.cookies.delete(COOKIE_BRAND_KEY);
          requestHeaders.delete(HEADER_BRAND_KEY);
        }
        if (teacherParam === null) {
          res.cookies.delete(COOKIE_TEACHER_KEY);
          requestHeaders.delete(HEADER_TEACHER_KEY);
        }
      }

      res.cookies.set({
        name: COOKIE_NICHE_KEY,
        value: cleanNiche,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });
      requestHeaders.set(HEADER_NICHE_KEY, safeHeaderEncode(cleanNiche));
    }
  }

  if (brandParam !== null) {
    const cleanBrand = brandParam.trim();
    if (cleanBrand === "reset" || cleanBrand === "") {
      res.cookies.delete(COOKIE_BRAND_KEY);
      requestHeaders.delete(HEADER_BRAND_KEY);
    } else {
      res.cookies.set({
        name: COOKIE_BRAND_KEY,
        value: cleanBrand,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
      requestHeaders.set(HEADER_BRAND_KEY, safeHeaderEncode(cleanBrand));
    }
  }

  if (teacherParam !== null) {
    const cleanTeacher = teacherParam.trim();
    if (cleanTeacher === "reset" || cleanTeacher === "") {
      res.cookies.delete(COOKIE_TEACHER_KEY);
      requestHeaders.delete(HEADER_TEACHER_KEY);
    } else {
      res.cookies.set({
        name: COOKIE_TEACHER_KEY,
        value: cleanTeacher,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
      requestHeaders.set(HEADER_TEACHER_KEY, safeHeaderEncode(cleanTeacher));
    }
  }

  // If visitor does not have a locale cookie yet, detect and set it
  const existingLocaleCookie = req.cookies.get(COOKIE_LOCALE_KEY)?.value;
  if (!existingLocaleCookie) {
    const { country, source } = getCountryFromRequest(req);
    const detectedLocale = detectLanguageFromCountry(country);

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
  }

  // Affiliate / Referral tracking: check ?ref=CODE or ?aff=CODE
  const refParam = req.nextUrl.searchParams.get("ref") || req.nextUrl.searchParams.get("aff");
  if (refParam) {
    const cleanRef = refParam.trim().toUpperCase();
    if (cleanRef.length >= 3 && cleanRef.length <= 32 && /^[A-Z0-9_-]+$/.test(cleanRef)) {
      res.cookies.set({
        name: "wtl_ref",
        value: cleanRef,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days attribution window
        sameSite: "lax",
      });
    }
  }

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

