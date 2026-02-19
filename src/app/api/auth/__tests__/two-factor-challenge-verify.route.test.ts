import { getServerSession } from 'next-auth/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { consumeRecoveryCode } from '../../../../lib/auth/recoveryCodes';
import {
  consumeStepUpChallenge,
  getStepUpChallengeByToken,
  isStepUpChallengeConsumable,
  recordFailedStepUpAttempt,
} from '../../../../lib/auth/stepUpChallenges';
import { verifyUserTotpCode } from '../../../../lib/auth/twoFactor';
import { POST } from '../2fa/challenge/verify/route';

const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/recoveryCodes', () => ({ consumeRecoveryCode: vi.fn() }));
vi.mock('../../../../lib/auth/stepUpChallenges', () => ({
  getStepUpChallengeByToken: vi.fn(),
  isStepUpChallengeConsumable: vi.fn(),
  recordFailedStepUpAttempt: vi.fn(),
  consumeStepUpChallenge: vi.fn(),
}));
vi.mock('../../../../lib/auth/twoFactor', () => ({ verifyUserTotpCode: vi.fn() }));
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
    getRateLimitKey: () => 'auth:2fa:challenge:verify:test',
  };
});

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetStepUpChallengeByToken = vi.mocked(getStepUpChallengeByToken);
const mockedIsStepUpChallengeConsumable = vi.mocked(isStepUpChallengeConsumable);
const mockedRecordFailedStepUpAttempt = vi.mocked(recordFailedStepUpAttempt);
const mockedConsumeStepUpChallenge = vi.mocked(consumeStepUpChallenge);
const mockedVerifyUserTotpCode = vi.mocked(verifyUserTotpCode);
const mockedConsumeRecoveryCode = vi.mocked(consumeRecoveryCode);

describe('/api/auth/2fa/challenge/verify', () => {
  beforeEach(() => {
    consumeRateLimitMock.mockReset();
    mockedGetServerSession.mockReset();
    mockedGetStepUpChallengeByToken.mockReset();
    mockedIsStepUpChallengeConsumable.mockReset();
    mockedRecordFailedStepUpAttempt.mockReset();
    mockedConsumeStepUpChallenge.mockReset();
    mockedVerifyUserTotpCode.mockReset();
    mockedConsumeRecoveryCode.mockReset();

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

  it('returns unauthorized when session is missing', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge/verify', {
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
    const body = await response.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('returns 429 when challenge verify endpoint is rate limited', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    consumeRateLimitMock.mockReturnValueOnce({
      limited: true,
      limit: 5,
      remaining: 0,
      resetAt: Date.now() + 600_000,
      retryAfterSeconds: 600,
    });

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge/verify', {
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
    expect(response.headers.get('Retry-After')).toBe('600');
  });

  it('records failed attempts for invalid totp codes', async () => {
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
    mockedVerifyUserTotpCode.mockResolvedValue({ valid: false });

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge/verify', {
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

  it('consumes challenge for valid totp codes', async () => {
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
    mockedVerifyUserTotpCode.mockResolvedValue({ valid: true, stepOffset: 0 });

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge/verify', {
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
    const body = await response.json();
    expect(body.data.verified).toBe(true);
    expect(mockedConsumeStepUpChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId: 'challenge-1',
        method: 'totp',
      }),
    );
  });
});
