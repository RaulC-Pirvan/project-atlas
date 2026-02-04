import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listAdminHabits } from '../../../../lib/admin/habits';
import { GET } from '../habits/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/habits', () => ({ listAdminHabits: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedListAdminHabits = vi.mocked(listAdminHabits);

describe('GET /api/admin/habits', () => {
  it('returns habit list payload', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedListAdminHabits.mockResolvedValue({
      habits: [
        {
          title: 'Read',
          description: null,
          archivedAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          scheduleSummary: 'Mon, Wed',
          weekdays: [1, 3],
          user: { email: 'user@example.com', displayName: 'User' },
        },
      ],
      counts: { total: 1, active: 1, archived: 0 },
      nextCursor: null,
    });

    const response = await GET(new Request('https://example.com/api/admin/habits'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.counts.active).toBe(1);
    expect(body.data.habits).toHaveLength(1);

    expect(mockedRequireAdminSession).toHaveBeenCalled();
    expect(mockedListAdminHabits).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
