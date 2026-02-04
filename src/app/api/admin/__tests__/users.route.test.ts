import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listAdminUsers } from '../../../../lib/admin/users';
import { GET } from '../users/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/users', () => ({ listAdminUsers: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedListAdminUsers = vi.mocked(listAdminUsers);

describe('GET /api/admin/users', () => {
  it('returns user list payload', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedListAdminUsers.mockResolvedValue({
      users: [
        {
          email: 'user@example.com',
          displayName: 'User',
          emailVerifiedAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          deletedAt: null,
        },
      ],
      counts: { total: 1, verified: 0, unverified: 1 },
      nextCursor: null,
    });

    const response = await GET(new Request('https://example.com/api/admin/users'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.counts.total).toBe(1);
    expect(body.data.users).toHaveLength(1);

    expect(mockedRequireAdminSession).toHaveBeenCalled();
    expect(mockedListAdminUsers).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
