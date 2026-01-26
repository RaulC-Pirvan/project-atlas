import { describe, expect, it, vi } from 'vitest';

import { resendVerification } from '../../../../lib/api/auth/resendVerification';
import { ApiError } from '../../../../lib/api/errors';

describe('resendVerification', () => {
  it('noops when user is missing', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      emailVerificationToken: {
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };

    const result = await resendVerification({
      prisma,
      email: 'missing@example.com',
      sendEmail: vi.fn(),
    });

    expect(result).toEqual({ status: 'noop' });
  });

  it('rate limits rapid resend attempts', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'user@example.com',
          emailVerified: null,
        }),
      },
      emailVerificationToken: {
        findFirst: vi.fn().mockResolvedValue({
          createdAt: new Date('2025-12-31T23:58:30.000Z'),
        }),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };

    await expect(
      resendVerification({
        prisma,
        email: 'user@example.com',
        now,
        sendEmail: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
