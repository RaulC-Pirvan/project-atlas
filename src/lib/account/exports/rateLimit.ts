import type { RateLimitOptions } from '../../http/rateLimit';

export const ACCOUNT_EXPORT_RATE_LIMIT: RateLimitOptions = {
  windowMs: 1000 * 60 * 15,
  max: 3,
  blockMs: 1000 * 60 * 15,
};

export function getAccountExportRateLimitKey(userId: string): string {
  return `account:exports:self:${userId}`;
}

export function shouldBypassAccountExportRateLimit(): boolean {
  return process.env.ENABLE_TEST_ENDPOINTS === 'true';
}
