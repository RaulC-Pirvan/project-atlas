import { describe, expect, it, vi } from 'vitest';

import { listAdminHabits } from '../habits';

describe('listAdminHabits', () => {
  it('returns habit summaries with schedule labels', async () => {
    const prisma = {
      habit: {
        count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'h1',
            title: 'Read',
            description: null,
            archivedAt: null,
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            user: { email: 'user@example.com', displayName: 'User' },
            schedule: [{ weekday: 3 }, { weekday: 1 }],
          },
        ]),
      },
    };

    const result = await listAdminHabits({ prisma, status: 'active', take: 1 });

    expect(result.counts).toEqual({ total: 3, active: 2, archived: 1 });
    expect(result.habits[0].scheduleSummary).toBe('Mon, Wed');
    expect(result.habits[0].weekdays).toEqual([1, 3]);
  });
});
