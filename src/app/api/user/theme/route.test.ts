import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("API Route: /api/user/theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/theme", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const res = await GET();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return user's saved theme when authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-123", email: "test@example.com" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        theme: "ocean",
      } as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.theme).toBe("ocean");
    });

    it("should fallback to emerald if user has no theme set in DB", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        theme: null,
      } as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.theme).toBe("emerald");
    });
  });

  describe("PATCH /api/user/theme", () => {
    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = new Request("http://localhost/api/user/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: "ocean" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it("should return 400 if theme identifier is invalid", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      const req = new Request("http://localhost/api/user/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: "invalid-theme-xyz" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid theme identifier");
    });

    it("should successfully update user theme in database", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: "user-123" },
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: "user-123",
        theme: "purple",
      } as any);

      const req = new Request("http://localhost/api/user/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: "purple" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.theme).toBe("purple");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { theme: "purple" },
        select: { id: true, theme: true },
      });
    });
  });
});
