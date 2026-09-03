import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRateLimiter, getClientIp } from "./rate-limit";

describe("MemoryRateLimiter", () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter({
      windowMs: 1000, // 1 second
      maxRequests: 3,
    });
  });

  it("should allow requests under the limit", () => {
    const res1 = limiter.check("ip-1");
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check("ip-1");
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check("ip-1");
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests that exceed the limit", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    const blockedRes = limiter.check("ip-1");
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetTime).toBeGreaterThan(Date.now());
  });

  it("should track distinct identifiers independently", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");
    expect(limiter.check("ip-1").allowed).toBe(false);

    // ip-2 should still be allowed
    const resIp2 = limiter.check("ip-2");
    expect(resIp2.allowed).toBe(true);
    expect(resIp2.remaining).toBe(2);
  });

  it("should reset properly", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");
    expect(limiter.check("ip-1").allowed).toBe(false);

    limiter.reset();
    expect(limiter.check("ip-1").allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("should extract client IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost:3000", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.195");
  });

  it("should extract client IP from x-real-ip header", () => {
    const req = new Request("http://localhost:3000", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(getClientIp(req)).toBe("198.51.100.2");
  });

  it("should extract client IP from cf-connecting-ip header", () => {
    const req = new Request("http://localhost:3000", {
      headers: {
        "cf-connecting-ip": "104.28.19.45",
        "x-forwarded-for": "198.51.100.99",
      },
    });
    expect(getClientIp(req)).toBe("104.28.19.45");
  });

  it("should fallback to 127.0.0.1 if no headers present", () => {
    const req = new Request("http://localhost:3000");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
