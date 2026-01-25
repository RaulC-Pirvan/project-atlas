import { describe, expect, it, vi } from 'vitest';

import { signupUser } from '../../../../lib/api/auth/signup';
import { ApiError } from '../../../../lib/api/errors';
import { hashToken } from '../../../../lib/auth/tokens';

describe('signupUser', () => {
  it('creates a user and verification token', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com' }),
      },
      emailVerificationToken: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 't1' }),
      },
    };

    const result = await signupUser({
      prisma,
      email: 'User@Example.com',
      password: 'password123',
      now: new Date('2026-01-01T00:00:00.000Z'),
      generateRawToken: () => 'raw-token',
      sendEmail: vi.fn(),
    });

    expect(result).toEqual({ userId: 'u1' });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: hashToken('raw-token'),
        }),
      }),
    );
  });

  it('rejects duplicate email', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'u1' }),
        create: vi.fn(),
      },
      emailVerificationToken: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };

    await expect(
      signupUser({
        prisma,
        email: 'user@example.com',
        password: 'password123',
        sendEmail: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
