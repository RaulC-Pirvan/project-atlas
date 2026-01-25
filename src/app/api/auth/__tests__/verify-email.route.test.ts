import { describe, expect, it, vi } from 'vitest';

import { verifyEmail } from '../../../../lib/api/auth/verifyEmail';
import { ApiError } from '../../../../lib/api/errors';
import { hashToken } from '../../../../lib/auth/tokens';

describe('verifyEmail', () => {
  it('returns error for invalid token', async () => {
    const prisma = {
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    };

    await expect(verifyEmail(prisma, 'bad-token')).rejects.toBeInstanceOf(ApiError);
  });

  it('verifies a valid token', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const tokenHash = hashToken('raw-token');
    const prisma = {
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 't1',
          userId: 'u1',
          tokenHash,
          expiresAt: new Date('2026-01-01T00:10:00.000Z'),
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'u1' }),
      },
    };

    const result = await verifyEmail(prisma, 'raw-token', now);
    expect(result).toEqual({ userId: 'u1' });
  });
});
