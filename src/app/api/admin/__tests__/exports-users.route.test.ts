import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listExportUsers } from '../../../../lib/admin/exports';
import { GET } from '../exports/users/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/exports', () => ({
  listExportUsers: vi.fn(),
  buildCsv: (headers: string[], rows: Array<Array<string | number | Date | null>>) =>
    `${headers.join(',')}\n${rows.map((row) => row.join(',')).join('\n')}`,
}));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedListExportUsers = vi.mocked(listExportUsers);

describe('GET /api/admin/exports/users', () => {
  it('returns csv export response', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedListExportUsers.mockResolvedValue([
      {
        email: 'user@example.com',
        displayName: 'User',
        emailVerifiedAt: null,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        deletedAt: null,
      },
    ]);

    const response = await GET(new Request('https://example.com/api/admin/exports/users'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');

    const body = await response.text();
    expect(body).toContain('Email,Display name');
    expect(body).toContain('user@example.com');

    expect(mockedRequireAdminSession).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
