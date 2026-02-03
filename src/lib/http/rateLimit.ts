export type RateLimitOptions = {
  windowMs: number;
  max: number;
  blockMs: number;
};

type RateLimitEntry = {
  count: number;
  windowStart: number;
  blockedUntil?: number;
};

export type RateLimitDecision = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
};

const store = new Map<string, RateLimitEntry>();

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return 'unknown';
}

export function getRateLimitKey(route: string, request: Request): string {
  return `${route}:${getClientIp(request)}`;
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now(),
): RateLimitDecision {
  const normalized = normalizeKey(key || 'unknown');
  const existing = store.get(normalized);

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      limited: true,
      limit: options.max,
      remaining: 0,
      resetAt: existing.blockedUntil,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
  }

  let entry = existing;
  if (!entry || entry.windowStart + options.windowMs < now) {
    entry = { count: 0, windowStart: now };
    store.set(normalized, entry);
  }

  entry.count += 1;

  if (entry.count > options.max) {
    entry.blockedUntil = now + options.blockMs;
    return {
      limited: true,
      limit: options.max,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfterSeconds: Math.ceil(options.blockMs / 1000),
    };
  }

  return {
    limited: false,
    limit: options.max,
    remaining: Math.max(options.max - entry.count, 0),
    resetAt: entry.windowStart + options.windowMs,
  };
}

export function applyRateLimitHeaders(headers: Headers, decision: RateLimitDecision) {
  headers.set('X-RateLimit-Limit', String(decision.limit));
  headers.set('X-RateLimit-Remaining', String(decision.remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(decision.resetAt / 1000)));

  if (decision.limited && decision.retryAfterSeconds !== undefined) {
    headers.set('Retry-After', String(decision.retryAfterSeconds));
  }
}
