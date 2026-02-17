import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listActiveUserSessions, revokeAllUserSessions } from '../../../../lib/auth/sessionManagement';
import { DELETE, GET } from '../sessions/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/sessionManagement', () => ({
  listActiveUserSessions: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedListActiveUserSessions = vi.mocked(listActiveUserSessions);
const mockedRevokeAllUserSessions = vi.mocked(revokeAllUserSessions);

describe('/api/account/sessions', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedListActiveUserSessions.mockReset();
    mockedRevokeAllUserSessions.mockReset();
  });

  it('lists active sessions and labels the current one', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedListActiveUserSessions.mockResolvedValue([
      {
        id: 'session-1',
        sessionToken: 'token-1',
        expires: new Date('2026-02-18T10:00:00.000Z'),
        lastActiveAt: new Date('2026-02-17T10:00:00.000Z'),
        createdAt: new Date('2026-02-16T10:00:00.000Z'),
        ipAddress: '203.0.113.10',
        userAgent: 'Browser A',
      },
      {
        id: 'session-2',
        sessionToken: 'token-2',
        expires: new Date('2026-02-18T09:00:00.000Z'),
        lastActiveAt: new Date('2026-02-17T09:00:00.000Z'),
        createdAt: new Date('2026-02-16T09:00:00.000Z'),
        ipAddress: '203.0.113.11',
        userAgent: 'Browser B',
      },
    ]);

    const response = await GET(
      new Request('http://localhost:3000/api/account/sessions', {
        method: 'GET',
        headers: { cookie: 'next-auth.session-token=token-2' },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.sessions).toHaveLength(2);
    expect(body.data.sessions[0].isCurrent).toBe(false);
    expect(body.data.sessions[1].isCurrent).toBe(true);
  });

  it('revokes all sessions and clears cookies when scope is all', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedRevokeAllUserSessions.mockResolvedValue({ revokedCount: 3 });

    const response = await DELETE(
      new Request('http://localhost:3000/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'all' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.revokedCount).toBe(3);
    expect(body.data.signedOutCurrent).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('next-auth.session-token=');
  });

  it('requires current session token for scope others', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await DELETE(
      new Request('http://localhost:3000/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'others' }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('unauthorized');
  });
});
