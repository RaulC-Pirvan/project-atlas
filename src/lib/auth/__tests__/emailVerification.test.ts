import { describe, expect, it, vi } from 'vitest';

import type { PrismaLike } from '../emailVerification';
import { EmailVerificationError, verifyEmailToken } from '../emailVerification';
import { hashToken } from '../tokens';

describe('email verification', () => {
  it('updates user.emailVerified and deletes tokens when valid', async () => {
    const now = new Date('2026-01-25T10:00:00.000Z');
    const raw = 'raw-token-abc';
    const tokenHash = hashToken(raw);

    const prisma: PrismaLike = {
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 't1',
          userId: 'u1',
          tokenHash,
          expiresAt: new Date('2026-01-25T10:05:00.000Z'),
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        update: vi.fn().mockResolvedValue({ id: 'u1' }),
      },
    };

    const result = await verifyEmailToken(prisma, raw, now);

    expect(result).toEqual({ userId: 'u1' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerified: now },
    });

    expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
  });

  it('rejects invalid token', async () => {
    const prisma: PrismaLike = {
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        update: vi.fn(),
      },
    };

    await expect(verifyEmailToken(prisma, 'nope')).rejects.toBeInstanceOf(EmailVerificationError);
    await expect(verifyEmailToken(prisma, 'nope')).rejects.toThrow('Invalid verification token.');
  });

  it('rejects expired token', async () => {
    const now = new Date('2026-01-25T10:00:00.000Z');
    const raw = 'raw-token-expired';
    const tokenHash = hashToken(raw);

    const prisma: PrismaLike = {
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: 't1',
          userId: 'u1',
          tokenHash,
          expiresAt: new Date('2026-01-25T09:59:59.000Z'),
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        update: vi.fn(),
      },
    };

    await expect(verifyEmailToken(prisma, raw, now)).rejects.toThrow('Verification token expired.');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
