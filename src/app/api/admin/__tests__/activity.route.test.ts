import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { getAdminLogSnapshot } from '../../../../lib/observability/adminLogStore';
import { GET } from '../activity/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/observability/adminLogStore', () => ({
  getAdminLogSnapshot: vi.fn(),
  recordAdminLog: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetAdminLogSnapshot = vi.mocked(getAdminLogSnapshot);

describe('GET /api/admin/activity', () => {
  it('returns recent log entries', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedGetAdminLogSnapshot.mockReturnValue([
      {
        id: 'log-1',
        timestamp: '2026-02-03T00:00:00.000Z',
        level: 'info',
        message: 'api.request',
      },
    ]);

    const response = await GET(new Request('https://example.com/api/admin/activity'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.entries).toHaveLength(1);

    expect(mockedRequireAdminSession).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
