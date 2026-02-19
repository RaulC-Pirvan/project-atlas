import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createStepUpChallenge } from '../../../../lib/auth/stepUpChallenges';
import { prisma } from '../../../../lib/db/prisma';
import { POST } from '../step-up/challenge/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/auth/stepUpChallenges', () => ({ createStepUpChallenge: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedCreateStepUpChallenge = vi.mocked(createStepUpChallenge);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

describe('/api/account/step-up/challenge', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedCreateStepUpChallenge.mockReset();
    mockedFindUnique.mockReset();
  });

  it('returns password method for users without 2FA', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: false,
      passwordSetAt: new Date('2026-02-17T10:00:00.000Z'),
    } as never);
    mockedCreateStepUpChallenge.mockResolvedValue({
      challengeId: 'challenge-1',
      challengeToken: 'challenge-token',
      expiresAt: new Date('2026-02-17T11:00:00.000Z'),
    });

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account_email_change' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.methods).toEqual(['password']);
  });

  it('blocks challenge when user cannot perform step-up', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({
      id: 'user-1',
      twoFactorEnabled: false,
      passwordSetAt: null,
    } as never);

    const response = await POST(
      new Request('http://localhost:3000/api/account/step-up/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account_delete' }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
