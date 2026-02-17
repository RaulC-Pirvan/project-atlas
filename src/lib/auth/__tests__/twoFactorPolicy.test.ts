import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAdminPrincipal, shouldEnforceAdminTwoFactor } from '../twoFactorPolicy';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('twoFactorPolicy', () => {
  it('detects admin principals by role or allowlist', () => {
    vi.stubEnv('ADMIN_EMAIL_ALLOWLIST', 'admin@example.com');

    expect(isAdminPrincipal({ role: 'admin', email: 'user@example.com' })).toBe(true);
    expect(isAdminPrincipal({ role: 'user', email: 'admin@example.com' })).toBe(true);
    expect(isAdminPrincipal({ role: 'user', email: 'user@example.com' })).toBe(false);
  });

  it('enforces in non-production by default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DISABLE_ADMIN_2FA_ENFORCEMENT', '');

    expect(shouldEnforceAdminTwoFactor(new Date('2026-02-17T00:00:00.000Z'))).toBe(true);
  });

  it('supports staged production enforcement with ADMIN_2FA_ENFORCE_FROM', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_ADMIN_2FA_ENFORCEMENT', '');
    vi.stubEnv('DISABLE_ADMIN_2FA_ENFORCEMENT', '');
    vi.stubEnv('ADMIN_2FA_ENFORCE_FROM', '2026-03-01T00:00:00.000Z');

    expect(shouldEnforceAdminTwoFactor(new Date('2026-02-28T00:00:00.000Z'))).toBe(false);
    expect(shouldEnforceAdminTwoFactor(new Date('2026-03-02T00:00:00.000Z'))).toBe(true);
  });
});
