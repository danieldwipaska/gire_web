import { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;

declare global {
  var __gireRateLimits: Map<string, Bucket> | undefined;
}

function getStore(): Map<string, Bucket> {
  if (!global.__gireRateLimits) {
    global.__gireRateLimits = new Map<string, Bucket>();
  }
  return global.__gireRateLimits;
}

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const { key, limit, windowMs } = params;
  const store = getStore();
  const now = Date.now();

  // Opportunistic cleanup to prevent unbounded memory growth
  if (store.size >= MAX_BUCKETS) {
    for (const [k, b] of store.entries()) {
      if (b.resetAt <= now) {
        store.delete(k);
      }
      if (store.size < MAX_BUCKETS * 0.8) break;
    }
    if (store.size >= MAX_BUCKETS) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }
  }

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      remaining: Math.max(0, limit - 1),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000),
  );

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds,
    remaining: Math.max(0, limit - existing.count),
  };
}

