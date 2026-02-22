import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireFreshStepUpProof } from '../../../../lib/auth/stepUpProof';
import { prisma } from '../../../../lib/db/prisma';
import { POST } from '../delete-request/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/auth/stepUpProof', () => ({ requireFreshStepUpProof: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireFreshStepUpProof = vi.mocked(requireFreshStepUpProof);
const mockedFindUser = vi.mocked(prisma.user.findUnique);
const mockedDeleteUser = vi.mocked(prisma.user.delete);

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/account/delete-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/account/delete-request', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedRequireFreshStepUpProof.mockReset();
    mockedFindUser.mockReset();
    mockedDeleteUser.mockReset();
  });

  it('returns unauthorized when no active session exists', async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await POST(buildRequest({ stepUpChallengeToken: 'step-up-token' }));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('unauthorized');
  });

  it('deletes user after step-up verification', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUser.mockResolvedValue({ id: 'user-1' } as never);
    mockedRequireFreshStepUpProof.mockResolvedValue({} as never);
    mockedDeleteUser.mockResolvedValue({ id: 'user-1' } as never);

    const response = await POST(buildRequest({ stepUpChallengeToken: 'step-up-token' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(mockedDeleteUser).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });
});
