import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listExportHabits } from '../../../../lib/admin/exports';
import { GET } from '../exports/habits/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/exports', () => ({
  listExportHabits: vi.fn(),
  buildCsv: (headers: string[], rows: Array<Array<string | number | Date | null>>) =>
    `${headers.join(',')}\n${rows.map((row) => row.join(',')).join('\n')}`,
}));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedListExportHabits = vi.mocked(listExportHabits);

describe('GET /api/admin/exports/habits', () => {
  it('returns csv export response', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedListExportHabits.mockResolvedValue([
      {
        title: 'Read',
        description: null,
        scheduleSummary: 'Mon, Wed',
        archivedAt: null,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        ownerEmail: 'user@example.com',
        ownerName: 'User',
      },
    ]);

    const response = await GET(new Request('https://example.com/api/admin/exports/habits'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');

    const body = await response.text();
    expect(body).toContain('Title,Description,Schedule');
    expect(body).toContain('Read');

    expect(mockedRequireAdminSession).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
