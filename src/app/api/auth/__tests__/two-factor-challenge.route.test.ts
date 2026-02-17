import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStepUpChallenge } from '../../../../lib/auth/stepUpChallenges';
import { getUserTwoFactorState } from '../../../../lib/auth/twoFactor';
import { POST } from '../2fa/challenge/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/stepUpChallenges', () => ({ createStepUpChallenge: vi.fn() }));
vi.mock('../../../../lib/auth/twoFactor', () => ({ getUserTwoFactorState: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedCreateStepUpChallenge = vi.mocked(createStepUpChallenge);
const mockedGetUserTwoFactorState = vi.mocked(getUserTwoFactorState);

describe('/api/auth/2fa/challenge', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedCreateStepUpChallenge.mockReset();
    mockedGetUserTwoFactorState.mockReset();
  });

  it('returns unauthorized when no session exists', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account_delete' }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('blocks challenge creation when 2FA is not enabled', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetUserTwoFactorState.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'user',
      twoFactorEnabled: false,
      hasTotpSecret: false,
    });

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account_delete' }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it('creates a challenge for eligible users', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetUserTwoFactorState.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'user',
      twoFactorEnabled: true,
      hasTotpSecret: true,
    });
    mockedCreateStepUpChallenge.mockResolvedValue({
      challengeId: 'challenge-1',
      challengeToken: 'challenge-token',
      expiresAt: new Date('2026-02-17T13:00:00.000Z'),
    });

    const response = await POST(
      new Request('http://localhost:3000/api/auth/2fa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account_delete' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.challengeToken).toBe('challenge-token');
  });
});
