import { afterEach, describe, expect, it } from 'vitest';

import { getAdminAllowlist, isAdminApiPath, isAdminEmail, isAdminPath } from '../access';

const ORIGINAL_OWNER = process.env.ADMIN_OWNER_EMAIL;
const ORIGINAL_ALLOWLIST = process.env.ADMIN_EMAIL_ALLOWLIST;

function restoreEnv() {
  if (ORIGINAL_OWNER === undefined) {
    delete process.env.ADMIN_OWNER_EMAIL;
  } else {
    process.env.ADMIN_OWNER_EMAIL = ORIGINAL_OWNER;
  }

  if (ORIGINAL_ALLOWLIST === undefined) {
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
  } else {
    process.env.ADMIN_EMAIL_ALLOWLIST = ORIGINAL_ALLOWLIST;
  }
}

afterEach(() => {
  restoreEnv();
});

describe('admin access allowlist', () => {
  it('returns an empty allowlist when no env is set', () => {
    delete process.env.ADMIN_OWNER_EMAIL;
    delete process.env.ADMIN_EMAIL_ALLOWLIST;

    expect(getAdminAllowlist()).toEqual([]);
  });

  it('normalizes and deduplicates owner and allowlist entries', () => {
    process.env.ADMIN_OWNER_EMAIL = 'Owner@Example.com';
    process.env.ADMIN_EMAIL_ALLOWLIST = 'owner@example.com, secondary@example.com,  ,';

    expect(getAdminAllowlist()).toEqual(['owner@example.com', 'secondary@example.com']);
  });

  it('denies access when allowlist is empty', () => {
    delete process.env.ADMIN_OWNER_EMAIL;
    delete process.env.ADMIN_EMAIL_ALLOWLIST;

    expect(isAdminEmail('owner@example.com')).toBe(false);
  });

  it('allows normalized matches against the allowlist', () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = 'admin@example.com';

    expect(isAdminEmail(' ADMIN@EXAMPLE.COM ')).toBe(true);
  });

  it('detects admin and admin API paths', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/users')).toBe(true);
    expect(isAdminPath('/calendar')).toBe(false);
    expect(isAdminApiPath('/api/admin')).toBe(true);
    expect(isAdminApiPath('/api/admin/users')).toBe(true);
    expect(isAdminApiPath('/api/health')).toBe(false);
  });
});
