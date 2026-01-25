const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 5;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_MS = 1000 * 60 * 10;

type RateLimitEntry = {
  count: number;
  windowStart: number;
  blockedUntil?: number;
};

const attempts = new Map<string, RateLimitEntry>();

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

/**
 * In-memory rate limit. This is per-process and resets on deploy/restart.
 */
export function isLoginRateLimited(key: string, now: number = Date.now()): boolean {
  const normalized = normalizeKey(key);
  const entry = attempts.get(normalized);
  if (!entry) return false;

  if (entry.blockedUntil && entry.blockedUntil > now) return true;

  if (entry.windowStart + RATE_LIMIT_WINDOW_MS < now) {
    attempts.delete(normalized);
    return false;
  }

  return entry.count >= RATE_LIMIT_MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string, now: number = Date.now()): void {
  const normalized = normalizeKey(key);
  const entry = attempts.get(normalized);

  if (!entry || entry.windowStart + RATE_LIMIT_WINDOW_MS < now) {
    attempts.set(normalized, { count: 1, windowStart: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK_MS;
  }
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(normalizeKey(key));
}
