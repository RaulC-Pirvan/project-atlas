import { describe, expect, it } from 'vitest';

import {
  isAdminTwoFactorEnrollmentRequiredCookie,
  isLegacyJwtSessionToken,
  readSessionTokenFromCookieHeader,
} from '../sessionConfig';

describe('sessionConfig helpers', () => {
  it('detects legacy JWT-looking session tokens', () => {
    expect(isLegacyJwtSessionToken('a.b.c')).toBe(true);
    expect(isLegacyJwtSessionToken('not-a-jwt')).toBe(false);
  });

  it('reads session token from cookie header', () => {
    const token = readSessionTokenFromCookieHeader(
      'foo=bar; next-auth.session-token=session-123; another=value',
    );

    expect(token).toBe('session-123');
  });

  it('detects admin enrollment gating cookie values', () => {
    expect(isAdminTwoFactorEnrollmentRequiredCookie('required')).toBe(true);
    expect(isAdminTwoFactorEnrollmentRequiredCookie('')).toBe(false);
    expect(isAdminTwoFactorEnrollmentRequiredCookie(null)).toBe(false);
  });
});
