import { afterEach, describe, expect, it } from 'vitest';

import { requireAdminSession } from '../auth';

const ORIGINAL_ALLOWLIST = process.env.ADMIN_EMAIL_ALLOWLIST;

function restoreEnv() {
  if (ORIGINAL_ALLOWLIST === undefined) {
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
  } else {
    process.env.ADMIN_EMAIL_ALLOWLIST = ORIGINAL_ALLOWLIST;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('requireAdminSession', () => {
  it('throws when session is missing', () => {
    expect(() => requireAdminSession(null)).toThrow('Not authenticated');
  });

  it('allows admin role', () => {
    const result = requireAdminSession({
      user: { id: 'u1', email: 'user@example.com', isAdmin: true },
    });
    expect(result.userId).toBe('u1');
  });

  it('allows allowlisted email', () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'admin@example.com';
    const result = requireAdminSession({
      user: { id: 'u1', email: 'admin@example.com', isAdmin: false },
    });
    expect(result.userId).toBe('u1');
  });

  it('rejects non-admin, non-allowlisted users', () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'admin@example.com';
    expect(() =>
      requireAdminSession({ user: { id: 'u2', email: 'user@example.com', isAdmin: false } }),
    ).toThrow('Admin access is restricted');
  });
});
