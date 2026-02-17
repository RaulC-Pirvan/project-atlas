import { getServerSession } from 'next-auth/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyPassword } from '../../../../lib/auth/password';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../lib/auth/stepUpChallenges';
import { verifyTwoFactorMethod } from '../../../../lib/auth/twoFactorVerification';
import { prisma } from '../../../../lib/db/prisma';
import { POST } from '../step-up/verify/route';

const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/auth/password', () => ({ verifyPassword: vi.fn() }));
vi.mock('../../../../lib/auth/stepUpChallenges', () => ({
  getStepUpChallengeByToken: vi.fn(),
  isStepUpChallengeConsumable: vi.fn(),
  recordFailedStepUpAttempt: vi.fn(),
  consumeStepUpChallenge: vi.fn(),
}));
vi.mock('../../../../lib/auth/twoFactorVerification', () => ({ verifyTwoFactorMethod: vi.fn() }));
vi.mock('../../../../lib/auth/twoFactorRateLimit', () => ({
  TWO_FACTOR_CHALLENGE_RATE_LIMIT: {
    windowMs: 300_000,
    max: 5,
    blockMs: 600_000,
  },
  shouldBypassTwoFactorRateLimit: () => false,
}));
vi.mock('../../../../lib/http/rateLimit', async () => {
  const actual = await vi.importActual<typeof import('../../../../lib/http/rateLimit')>(
    '../../../../lib/http/rateLimit',
  );

  return {
    ...actual,
    consumeRateLimit: (...args: unknown[]) => consumeRateLimitMock(...args),
    getRateLimitKey: () => 'account:step-up:verify:test',
  };
});
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedVerifyPassword = vi.mocked(verifyPassword);
const mockedGetStepUpChallengeByToken = vi.mocked(getStepUpChallengeByToken);
const mockedIsStepUpChallengeConsumable = vi.mocked(isStepUpChallengeConsumable);
const mockedRecordFailedStepUpAttempt = vi.mocked(recordFailedStepUpAttempt);
const mockedConsumeStepUpChallenge = vi.mocked(consumeStepUpChallenge);
const mockedVerifyTwoFactorMethod = vi.mocked(verifyTwoFactorMethod);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

describe('/api/account/step-up/verify', () => {
  beforeEach(() => {
    consumeRateLimitMock.mockReset();
    mockedGetServerSession.mockReset();
    mockedVerifyPassword.mockReset();
    mockedGetStepUpChallengeByToken.mockReset();
    mockedIsStepUpChallengeConsumable.mockReset();
    mockedRecordFailedStepUpAttempt.mockReset();
    mockedConsumeStepUpChallenge.mockReset();
    mockedVerifyTwoFactorMethod.mockReset();
    mockedFindUnique.mockReset();

    consumeRateLimitMock.mockReturnValue({
      limited: false,
      limit: 5,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('verifies password-based step-up for non-2FA users', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'account_delete',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    mockedIsStepUpChallengeConsumable.mockReturnValue({ ok: true });
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: false,
      passwordHash: 'hash-value',
      passwordSetAt: new Date('2026-02-10T10:00:00.000Z'),
    } as never);
    mockedVerifyPassword.mockResolvedValue(true);

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'password',
          code: 'my-current-password',
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.stepUpChallengeToken).toBe('challenge-token');
    expect(mockedConsumeStepUpChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'challenge-1',
        method: 'password',
      }),
    );
  });

  it('records failed attempts for invalid passwords', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'account_email_change',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    mockedIsStepUpChallengeConsumable.mockReturnValue({ ok: true });
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: false,
      passwordHash: 'hash-value',
      passwordSetAt: new Date('2026-02-10T10:00:00.000Z'),
    } as never);
    mockedVerifyPassword.mockResolvedValue(false);

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'password',
          code: 'wrong-password',
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockedRecordFailedStepUpAttempt).toHaveBeenCalledTimes(1);
  });

  it('uses TOTP/recovery verification for users with 2FA enabled', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'account_password_change',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    mockedIsStepUpChallengeConsumable.mockReturnValue({ ok: true });
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: true,
      passwordHash: 'hash-value',
      passwordSetAt: new Date('2026-02-10T10:00:00.000Z'),
    } as never);
    mockedVerifyTwoFactorMethod.mockResolvedValue({ valid: true });

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'totp',
          code: '123456',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedVerifyTwoFactorMethod).toHaveBeenCalledTimes(1);
    expect(mockedVerifyPassword).not.toHaveBeenCalled();
  });

  it('denies challenges outside account step-up action scope', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'admin_access',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'password',
          code: 'password123!',
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });
});
