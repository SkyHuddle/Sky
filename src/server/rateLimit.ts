import { AppError } from "./errors";

/**
 * Fixed-window, in-memory rate limiter. Adequate for a single server process; a multi-instance
 * deployment should move this to Redis (same interface).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) {
    const secs = Math.ceil((b.resetAt - now) / 1000);
    throw new AppError("RATE_LIMITED", `Too many attempts. Try again in ${secs}s.`, { retryAfter: secs });
  }
}
