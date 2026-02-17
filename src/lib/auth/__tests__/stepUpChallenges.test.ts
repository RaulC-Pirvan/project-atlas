import { describe, expect, it, vi } from 'vitest';

import {
  createStepUpChallenge,
  getStepUpChallengeTtlSeconds,
  getStepUpLockAfterAttempts,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../stepUpChallenges';

describe('stepUpChallenges', () => {
  it('creates challenge with hashed token and expiry', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'challenge-1',
      expiresAt: new Date('2026-02-17T12:10:00.000Z'),
    });

    const now = new Date('2026-02-17T12:00:00.000Z');
    const result = await createStepUpChallenge({
      prisma: {
        authStepUpChallenge: {
          create,
          findUnique: vi.fn(),
          update: vi.fn(),
        },
      },
      userId: 'user-1',
      action: 'account_delete',
      now,
    });

    expect(result.challengeToken).toMatch(/^[a-f0-9]+$/);
    expect(result.challengeToken.length).toBeGreaterThan(40);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'account_delete',
          challengeTokenHash: expect.any(String),
        }),
      }),
    );
  });

  it('marks challenges non-consumable when expired or consumed', () => {
    const now = new Date('2026-02-17T12:00:00.000Z');
    const expired = isStepUpChallengeConsumable(
      {
        id: 'challenge-1',
        userId: 'user-1',
        action: 'account_delete',
        challengeTokenHash: 'hash',
        expiresAt: new Date('2026-02-17T11:59:59.000Z'),
        consumedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
      now,
    );
    expect(expired.ok).toBe(false);

    const consumed = isStepUpChallengeConsumable(
      {
        id: 'challenge-1',
        userId: 'user-1',
        action: 'account_delete',
        challengeTokenHash: 'hash',
        expiresAt: new Date('2026-02-17T12:10:00.000Z'),
        consumedAt: new Date('2026-02-17T12:01:00.000Z'),
        failedAttempts: 0,
        lockedUntil: null,
      },
      now,
    );
    expect(consumed.ok).toBe(false);
  });

  it('applies lockout once failed attempts reach threshold', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'challenge-1' });
    const now = new Date('2026-02-17T12:00:00.000Z');
    const failedAttempts = getStepUpLockAfterAttempts() - 1;

    const result = await recordFailedStepUpAttempt({
      prisma: {
        authStepUpChallenge: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update,
        },
      },
      challenge: {
        id: 'challenge-1',
        failedAttempts,
      },
      now,
    });

    expect(result.failedAttempts).toBe(getStepUpLockAfterAttempts());
    expect(result.lockedUntil).toBeTruthy();
    expect(update).toHaveBeenCalled();
  });

  it('uses 10 minute default challenge ttl', () => {
    expect(getStepUpChallengeTtlSeconds()).toBe(600);
  });
});
