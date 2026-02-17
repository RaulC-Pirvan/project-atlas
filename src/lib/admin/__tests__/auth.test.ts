import { afterEach, describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../auth';

vi.mock('../../db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('requireAdminSession', () => {
  it('throws when session is missing', async () => {
    await expect(requireAdminSession(null)).rejects.toThrow('Not authenticated');
  });

  it('allows admin role when 2FA is already enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const result = await requireAdminSession(
      {
        user: { id: 'u1', email: 'user@example.com', isAdmin: true },
      },
      {
        prisma: {
          user: {
            findUnique: async () => ({
              id: 'u1',
              email: 'user@example.com',
              role: 'admin',
              twoFactorEnabled: true,
            }),
          },
        },
      },
    );

    expect(result.userId).toBe('u1');
  });

  it('allows allowlisted email', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_EMAIL_ALLOWLIST', 'admin@example.com');

    const result = await requireAdminSession(
      {
        user: { id: 'u1', email: 'admin@example.com', isAdmin: false },
      },
      {
        prisma: {
          user: {
            findUnique: async () => ({
              id: 'u1',
              email: 'admin@example.com',
              role: 'user',
              twoFactorEnabled: true,
            }),
          },
        },
      },
    );

    expect(result.userId).toBe('u1');
  });

  it('rejects non-admin, non-allowlisted users', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_EMAIL_ALLOWLIST', 'admin@example.com');

    await expect(
      requireAdminSession(
        { user: { id: 'u2', email: 'user@example.com', isAdmin: false } },
        {
          prisma: {
            user: {
              findUnique: async () => ({
                id: 'u2',
                email: 'user@example.com',
                role: 'user',
                twoFactorEnabled: false,
              }),
            },
          },
        },
      ),
    ).rejects.toThrow('Admin access is restricted');
  });

  it('enforces admin 2FA when policy is active', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_ADMIN_2FA_ENFORCEMENT', 'true');

    await expect(
      requireAdminSession(
        { user: { id: 'u1', email: 'admin@example.com', isAdmin: true } },
        {
          prisma: {
            user: {
              findUnique: async () => ({
                id: 'u1',
                email: 'admin@example.com',
                role: 'admin',
                twoFactorEnabled: false,
              }),
            },
          },
        },
      ),
    ).rejects.toThrow('Admin 2FA enrollment is required');
  });
});
