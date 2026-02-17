import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDatabaseSession } from '../../../../lib/auth/databaseSession';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../lib/auth/stepUpChallenges';
import { verifyTwoFactorMethod } from '../../../../lib/auth/twoFactorVerification';

const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/databaseSession', () => ({ createDatabaseSession: vi.fn() }));
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
    getRateLimitKey: () => 'auth:sign-in:2fa:verify:test',
  };
});

const mockedCreateDatabaseSession = vi.mocked(createDatabaseSession);
const mockedGetStepUpChallengeByToken = vi.mocked(getStepUpChallengeByToken);
const mockedIsStepUpChallengeConsumable = vi.mocked(isStepUpChallengeConsumable);
const mockedRecordFailedStepUpAttempt = vi.mocked(recordFailedStepUpAttempt);
const mockedConsumeStepUpChallenge = vi.mocked(consumeStepUpChallenge);
const mockedVerifyTwoFactorMethod = vi.mocked(verifyTwoFactorMethod);

describe('/api/auth/sign-in/2fa/verify', () => {
  beforeEach(() => {
    consumeRateLimitMock.mockReset();
    mockedCreateDatabaseSession.mockReset();
    mockedGetStepUpChallengeByToken.mockReset();
    mockedIsStepUpChallengeConsumable.mockReset();
    mockedRecordFailedStepUpAttempt.mockReset();
    mockedConsumeStepUpChallenge.mockReset();
    mockedVerifyTwoFactorMethod.mockReset();

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

  it('returns 429 when verification endpoint is rate limited', async () => {
    consumeRateLimitMock.mockReturnValueOnce({
      limited: true,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 600_000,
      retryAfterSeconds: 600,
    });

    const { POST } = await import('../sign-in/2fa/verify/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'totp',
          code: '123456',
        }),
      }),
    );

    expect(response.status).toBe(429);
  });

  it('records failed attempts for invalid codes', async () => {
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'sign_in',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    mockedIsStepUpChallengeConsumable.mockReturnValue({ ok: true });
    mockedVerifyTwoFactorMethod.mockResolvedValue({ valid: false });

    const { POST } = await import('../sign-in/2fa/verify/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'totp',
          code: '123456',
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mockedRecordFailedStepUpAttempt).toHaveBeenCalledTimes(1);
  });

  it('creates session for valid codes', async () => {
    mockedGetStepUpChallengeByToken.mockResolvedValue({
      id: 'challenge-1',
      userId: 'user-1',
      action: 'sign_in',
      challengeTokenHash: 'hash',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
      consumedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    mockedIsStepUpChallengeConsumable.mockReturnValue({ ok: true });
    mockedVerifyTwoFactorMethod.mockResolvedValue({ valid: true });
    mockedCreateDatabaseSession.mockResolvedValue({
      sessionToken: 'db-session-token',
      expires: new Date('2026-03-19T10:00:00.000Z'),
    });

    const { POST } = await import('../sign-in/2fa/verify/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in/2fa/verify', {
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
    expect(mockedConsumeStepUpChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'challenge-1',
        method: 'totp',
      }),
    );
    expect(response.headers.get('set-cookie')).toContain(
      'next-auth.session-token=db-session-token',
    );
  });
});
