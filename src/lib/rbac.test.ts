import { describe, it, expect } from "vitest";
import {
  evaluateRbacAccess,
  isSuperAdminOrAdmin,
  hasInstructorOrAdminAccess,
  canManageCourse,
  type AuthTokenPayload,
} from "./rbac";

describe("Role-Based Access Control - RBAC (TC-AUTH-03)", () => {
  const adminToken: AuthTokenPayload = {
    id: "user-admin",
    role: "ADMIN",
    status: "ACTIVE",
  };

  const superAdminToken: AuthTokenPayload = {
    id: "user-superadmin",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
  };

  const instructorToken: AuthTokenPayload = {
    id: "user-instructor-1",
    role: "INSTRUCTOR",
    status: "ACTIVE",
  };

  const studentToken: AuthTokenPayload = {
    id: "user-student",
    role: "STUDENT",
    status: "ACTIVE",
  };

  const blockedToken: AuthTokenPayload = {
    id: "user-blocked",
    role: "ADMIN",
    status: "BLOCKED",
  };

  describe("Public Routes", () => {
    it("should allow unauthenticated access to public pages and public APIs", () => {
      expect(evaluateRbacAccess("/", null).allowed).toBe(true);
      expect(evaluateRbacAccess("/courses", null).allowed).toBe(true);
      expect(evaluateRbacAccess("/courses/forex-basics", null).allowed).toBe(true);
      expect(evaluateRbacAccess("/about", null).allowed).toBe(true);
      expect(evaluateRbacAccess("/api/settings/public", null).allowed).toBe(true);
    });
  });

  describe("Unauthenticated Access to Protected Routes", () => {
    it("should redirect unauthenticated users visiting admin pages to login with callbackUrl", () => {
      const decision = evaluateRbacAccess("/admin/courses", null);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(401);
        expect(decision.redirectUrl).toContain("/auth/login");
        expect(decision.redirectUrl).toContain("callbackUrl=%2Fadmin%2Fcourses");
      }
    });

    it("should return 401 Unauthorized for unauthenticated access to admin APIs", () => {
      const decision = evaluateRbacAccess("/api/admin/courses", null);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(401);
        expect(decision.error).toBe("Unauthorized");
      }
    });
  });

  describe("Blocked Users", () => {
    it("should reject blocked users on admin pages and redirect to login with error", () => {
      const decision = evaluateRbacAccess("/admin", blockedToken);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(403);
        expect(decision.redirectUrl).toContain("error=BlockedAccount");
      }
    });

    it("should return 403 Forbidden for blocked users calling admin APIs", () => {
      const decision = evaluateRbacAccess("/api/admin/settings", blockedToken);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(403);
        expect(decision.error).toContain("suspended");
      }
    });
  });

  describe("Student Role Restrictions", () => {
    it("should reject students accessing admin pages and redirect them to homepage", () => {
      const decision = evaluateRbacAccess("/admin", studentToken);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(403);
        expect(decision.redirectUrl).toBe("http://localhost:3000/");
      }
    });

    it("should reject students accessing admin APIs with 403 Forbidden", () => {
      const decision = evaluateRbacAccess("/api/admin/orders", studentToken);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(403);
        expect(decision.error).toBe("Forbidden");
      }
    });
  });

  describe("Instructor Role Restrictions", () => {
    it("should allow instructors to access course management pages and APIs", () => {
      expect(evaluateRbacAccess("/admin/courses", instructorToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/api/admin/courses", instructorToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/admin/courses/new", instructorToken).allowed).toBe(true);
    });

    it("should redirect instructors from restricted financial/system pages to /admin/courses", () => {
      const ordersDecision = evaluateRbacAccess("/admin/orders", instructorToken);
      expect(ordersDecision.allowed).toBe(false);
      if (!ordersDecision.allowed) {
        expect(ordersDecision.redirectUrl).toBe("http://localhost:3000/admin/courses");
      }

      const settingsDecision = evaluateRbacAccess("/admin/settings", instructorToken);
      expect(settingsDecision.allowed).toBe(false);

      const couponsDecision = evaluateRbacAccess("/admin/coupons", instructorToken);
      expect(couponsDecision.allowed).toBe(false);
    });

    it("should return 403 Forbidden when instructors call restricted administrative APIs", () => {
      const decision = evaluateRbacAccess("/api/admin/orders/approve", instructorToken);
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) {
        expect(decision.status).toBe(403);
        expect(decision.error).toContain("Instructors do not have permission");
      }
    });
  });

  describe("Admin & Super Admin Roles", () => {
    it("should allow ADMIN full access to all admin pages and APIs", () => {
      expect(evaluateRbacAccess("/admin", adminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/admin/orders", adminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/admin/settings", adminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/api/admin/orders", adminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/api/admin/settings", adminToken).allowed).toBe(true);
    });

    it("should allow SUPER_ADMIN full access to all admin pages and APIs", () => {
      expect(evaluateRbacAccess("/admin", superAdminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/admin/orders", superAdminToken).allowed).toBe(true);
      expect(evaluateRbacAccess("/api/admin/settings", superAdminToken).allowed).toBe(true);
    });
  });

  describe("RBAC Helper Functions", () => {
    it("isSuperAdminOrAdmin should return true only for ADMIN and SUPER_ADMIN", () => {
      expect(isSuperAdminOrAdmin("ADMIN")).toBe(true);
      expect(isSuperAdminOrAdmin("SUPER_ADMIN")).toBe(true);
      expect(isSuperAdminOrAdmin("INSTRUCTOR")).toBe(false);
      expect(isSuperAdminOrAdmin("STUDENT")).toBe(false);
      expect(isSuperAdminOrAdmin(null)).toBe(false);
    });

    it("hasInstructorOrAdminAccess should return true for ADMIN, SUPER_ADMIN, and INSTRUCTOR", () => {
      expect(hasInstructorOrAdminAccess("ADMIN")).toBe(true);
      expect(hasInstructorOrAdminAccess("SUPER_ADMIN")).toBe(true);
      expect(hasInstructorOrAdminAccess("INSTRUCTOR")).toBe(true);
      expect(hasInstructorOrAdminAccess("STUDENT")).toBe(false);
    });

    it("canManageCourse should allow admin to manage any course", () => {
      const course = { instructorId: "other-instructor" };
      expect(canManageCourse({ id: "admin-1", role: "ADMIN" }, course)).toBe(true);
      expect(canManageCourse({ id: "super-1", role: "SUPER_ADMIN" }, course)).toBe(true);
    });

    it("canManageCourse should allow instructor to manage only their own course", () => {
      const myCourse = { instructorId: "instructor-1" };
      const otherCourse = { instructorId: "instructor-2" };

      expect(canManageCourse({ id: "instructor-1", role: "INSTRUCTOR" }, myCourse)).toBe(true);
      expect(canManageCourse({ id: "instructor-1", role: "INSTRUCTOR" }, otherCourse)).toBe(false);
    });

    it("canManageCourse should deny students from managing any course", () => {
      const course = { instructorId: "student-1" };
      expect(canManageCourse({ id: "student-1", role: "STUDENT" }, course)).toBe(false);
    });
  });
});
