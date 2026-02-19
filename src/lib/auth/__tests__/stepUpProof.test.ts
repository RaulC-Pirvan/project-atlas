import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api/errors';
import { consumeStepUpProof, requireFreshStepUpProof } from '../stepUpProof';

describe('stepUpProof', () => {
  it('requires a valid verified challenge token', async () => {
    const prisma = {
      authStepUpChallenge: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'challenge-1',
          userId: 'user-1',
          action: 'account_delete',
          challengeTokenHash: 'hash',
          expiresAt: new Date('2026-02-17T12:10:00.000Z'),
          consumedAt: new Date('2026-02-17T12:01:00.000Z'),
          verifiedAt: new Date('2026-02-17T12:01:00.000Z'),
          verifiedMethod: 'password',
          failedAttempts: 0,
          lockedUntil: null,
        }),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    const result = await requireFreshStepUpProof({
      prisma,
      userId: 'user-1',
      action: 'account_delete',
      stepUpChallengeToken: 'challenge-token',
      now: new Date('2026-02-17T12:05:00.000Z'),
    });

    expect(result.id).toBe('challenge-1');
  });

  it('throws when proof is missing', async () => {
    await expect(
      requireFreshStepUpProof({
        prisma: {
          authStepUpChallenge: {
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
          },
        },
        userId: 'user-1',
        action: 'account_delete',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('consumes proof by deleting challenge row', async () => {
    const deleteMock = vi.fn().mockResolvedValue({ id: 'challenge-1' });

    await consumeStepUpProof({
      prisma: {
        authStepUpChallenge: {
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
          delete: deleteMock,
        },
      },
      challengeId: 'challenge-1',
    });

    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: 'challenge-1' },
    });
  });
});
