export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN" | string;
export type UserStatus = "ACTIVE" | "BLOCKED" | string;

export interface AuthTokenPayload {
  id?: string;
  role?: UserRole;
  status?: UserStatus;
  [key: string]: any;
}

export type RbacDecision =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; redirectUrl?: string; error: string };

/**
 * Checks if the user role is an administrator (ADMIN or SUPER_ADMIN)
 */
export function isSuperAdminOrAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Checks if the user role has administrative or teaching privileges
 */
export function hasInstructorOrAdminAccess(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "INSTRUCTOR";
}

/**
 * Checks if a user is allowed to edit/manage a specific course
 */
export function canManageCourse(
  user: { id: string; role: string },
  course: { instructorId: string }
): boolean {
  if (isSuperAdminOrAdmin(user.role)) return true;
  if (user.role === "INSTRUCTOR" && course.instructorId === user.id) return true;
  return false;
}

/**
 * Evaluates route access permissions based on user token and requested pathname
 */
export function evaluateRbacAccess(
  pathname: string,
  token: AuthTokenPayload | null | undefined,
  origin: string = "http://localhost:3000"
): RbacDecision {
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");

  // If not accessing admin routes, let request pass
  if (!isApiAdmin && !isAdminPage) {
    return { allowed: true };
  }

  // 1. Check Authentication
  if (!token) {
    if (isApiAdmin) {
      return { allowed: false, status: 401, error: "Unauthorized" };
    }
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return {
      allowed: false,
      status: 401,
      redirectUrl: loginUrl.toString(),
      error: "Unauthorized",
    };
  }

  // 2. Check Account Status (BLOCKED users)
  if (token.status === "BLOCKED") {
    if (isApiAdmin) {
      return {
        allowed: false,
        status: 403,
        error: "Your account has been suspended. Please contact support.",
      };
    }
    const blockedUrl = new URL("/auth/login", origin);
    blockedUrl.searchParams.set("error", "BlockedAccount");
    return {
      allowed: false,
      status: 403,
      redirectUrl: blockedUrl.toString(),
      error: "Your account has been suspended. Please contact support.",
    };
  }

  const role = token.role;
  const isAllowedAdminRole = hasInstructorOrAdminAccess(role);

  // 3. Reject Regular Students or Unknown Roles
  if (!isAllowedAdminRole) {
    if (isApiAdmin) {
      return { allowed: false, status: 403, error: "Forbidden" };
    }
    return {
      allowed: false,
      status: 403,
      redirectUrl: new URL("/", origin).toString(),
      error: "Forbidden",
    };
  }

  // 4. Sub-path restrictions for INSTRUCTOR role
  if (role === "INSTRUCTOR") {
    const restrictedApiPrefixes = [
      "/api/admin/orders",
      "/api/admin/settings",
      "/api/admin/coupons",
      "/api/admin/categories",
      "/api/admin/enrollments",
    ];
    if (
      isApiAdmin &&
      restrictedApiPrefixes.some((prefix) => pathname.startsWith(prefix))
    ) {
      return {
        allowed: false,
        status: 403,
        error: "Forbidden: Instructors do not have permission to access this resource.",
      };
    }

    const restrictedPages = [
      "/admin/orders",
      "/admin/settings",
      "/admin/coupons",
      "/admin/categories",
      "/admin/students",
    ];
    if (
      isAdminPage &&
      restrictedPages.some((prefix) => pathname.startsWith(prefix))
    ) {
      return {
        allowed: false,
        status: 403,
        redirectUrl: new URL("/admin/courses", origin).toString(),
        error: "Forbidden: Instructors do not have permission to access this resource.",
      };
    }
  }

  return { allowed: true };
}
