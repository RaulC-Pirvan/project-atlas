import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_EXPORT_RATE_LIMIT,
  getAccountExportRateLimitKey,
  shouldBypassAccountExportRateLimit,
} from '../rateLimit';

describe('account export rate limit', () => {
  it('defines the sprint baseline policy', () => {
    expect(ACCOUNT_EXPORT_RATE_LIMIT).toEqual({
      windowMs: 1000 * 60 * 15,
      max: 3,
      blockMs: 1000 * 60 * 15,
    });
  });

  it('builds a user-scoped rate limit key', () => {
    expect(getAccountExportRateLimitKey('user-123')).toBe('account:exports:self:user-123');
  });

  it('does not bypass in normal runtime by default', () => {
    expect(shouldBypassAccountExportRateLimit()).toBe(false);
  });
});
