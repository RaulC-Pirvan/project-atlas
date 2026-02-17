import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  findUserSessionById,
  revokeUserSessionById,
} from '../../../../lib/auth/sessionManagement';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/sessionManagement', () => ({
  findUserSessionById: vi.fn(),
  revokeUserSessionById: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedFindUserSessionById = vi.mocked(findUserSessionById);
const mockedRevokeUserSessionById = vi.mocked(revokeUserSessionById);

describe('/api/account/sessions/[sessionId]', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedFindUserSessionById.mockReset();
    mockedRevokeUserSessionById.mockReset();
  });

  it('revokes a non-current session', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUserSessionById.mockResolvedValue({
      id: 'session-2',
      sessionToken: 'token-2',
    });
    mockedRevokeUserSessionById.mockResolvedValue({ revokedCount: 1 });

    const { DELETE } = await import('../sessions/[sessionId]/route');
    const response = await DELETE(
      new Request('http://localhost:3000/api/account/sessions/session-2', {
        method: 'DELETE',
        headers: { cookie: 'next-auth.session-token=token-current' },
      }),
      { params: Promise.resolve({ sessionId: 'session-2' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.revoked).toBe(true);
    expect(body.data.signedOutCurrent).toBe(false);
  });

  it('clears cookies when revoking current session', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUserSessionById.mockResolvedValue({
      id: 'session-1',
      sessionToken: 'token-current',
    });
    mockedRevokeUserSessionById.mockResolvedValue({ revokedCount: 1 });

    const { DELETE } = await import('../sessions/[sessionId]/route');
    const response = await DELETE(
      new Request('http://localhost:3000/api/account/sessions/session-1', {
        method: 'DELETE',
        headers: { cookie: 'next-auth.session-token=token-current' },
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.signedOutCurrent).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('next-auth.session-token=');
  });
});
