import { describe, expect, it, vi } from 'vitest';

import { authorizeCredentials } from '../credentials';
import { clearLoginAttempts } from '../loginRateLimit';
import { hashPassword } from '../password';

describe('authorizeCredentials', () => {
  it('returns a user for valid credentials', async () => {
    const passwordHash = await hashPassword('password123');
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'user@example.com',
          passwordHash,
          emailVerified: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
          displayName: 'User',
        }),
      },
    };

    const result = await authorizeCredentials({
      prisma,
      credentials: { email: 'user@example.com', password: 'password123' },
      rateLimitKey: 'user@example.com',
    });

    expect(result).toMatchObject({
      id: 'u1',
      email: 'user@example.com',
    });
  });

  it('rejects invalid password', async () => {
    const passwordHash = await hashPassword('password123');
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'user@example.com',
          passwordHash,
          emailVerified: new Date('2026-01-01T00:00:00.000Z'),
          deletedAt: null,
          displayName: null,
        }),
      },
    };

    const result = await authorizeCredentials({
      prisma,
      credentials: { email: 'user@example.com', password: 'badpass' },
      rateLimitKey: 'user@example.com',
    });

    expect(result).toBeNull();
  });

  it('rejects unverified accounts', async () => {
    clearLoginAttempts('user@example.com');

    const passwordHash = await hashPassword('password123');
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'user@example.com',
          passwordHash,
          emailVerified: null,
          deletedAt: null,
          displayName: null,
        }),
      },
    };

    await expect(
      authorizeCredentials({
        prisma,
        credentials: { email: 'user@example.com', password: 'password123' },
        rateLimitKey: 'user@example.com',
      }),
    ).rejects.toThrow('EMAIL_NOT_VERIFIED');
  });
});
