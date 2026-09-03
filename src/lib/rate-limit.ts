/**
 * Lightweight, in-memory sliding window rate limiter for Next.js API routes.
 * Tracks requests per identifier (IP or User ID) within a time window.
 */

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max allowed requests within window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Epoch timestamp in ms when window resets
}

export class MemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Checks if the identifier is within the allowed rate limit
   */
  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = this.requests.get(identifier) || [];
    // Filter out timestamps outside the active window
    const validTimestamps = timestamps.filter((time) => time > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const resetTime = oldestValid + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    // Periodic cleanup of stale entries if map gets large
    if (this.requests.size > 2000) {
      this.cleanup(now);
    }

    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length,
      resetTime: now + this.windowMs,
    };
  }

  /**
   * Cleans up expired identifiers
   */
  public cleanup(now = Date.now()): void {
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((time) => time > windowStart);
      if (active.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, active);
      }
    }
  }

  /**
   * Resets rate limits for testing or administrative purposes
   */
  public reset(): void {
    this.requests.clear();
  }
}

/**
 * Extracts client IP address from Next.js Request headers
 */
export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

// Pre-configured rate limiters for core API routes
export const registerRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // max 5 account registrations per 15 mins per IP
});

export const orderRateLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 10, // max 10 order creations per 10 mins per IP/User
});

export const commentRateLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // max 20 comments per 10 mins per IP/User
});

export const forgotPasswordRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // max 5 reset/verification requests per 15 mins per IP
});

export const loginRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // max 10 login attempts per 15 mins per IP
});
