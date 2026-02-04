import { describe, expect, it, vi } from 'vitest';

import { buildCsv, listExportHabits, listExportUsers } from '../exports';

describe('admin exports', () => {
  it('builds CSV with escaped values', () => {
    const csv = buildCsv(['Email', 'Name'], [['user@example.com', 'Last, "First"']]);

    expect(csv.split('\n')[0]).toBe('Email,Name');
    expect(csv.split('\n')[1]).toBe('user@example.com,"Last, ""First"""');
  });

  it('maps user export rows', async () => {
    const prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            email: 'user@example.com',
            displayName: 'User',
            emailVerified: null,
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            deletedAt: null,
          },
        ]),
      },
    };

    const rows = await listExportUsers(prisma);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('user@example.com');
  });

  it('maps habit export rows with schedule summary', async () => {
    const prisma = {
      habit: {
        findMany: vi.fn().mockResolvedValue([
          {
            title: 'Read',
            description: null,
            archivedAt: null,
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            schedule: [{ weekday: 1 }, { weekday: 3 }],
            user: { email: 'user@example.com', displayName: 'User' },
          },
        ]),
      },
    };

    const rows = await listExportHabits(prisma);
    expect(rows[0].scheduleSummary).toBe('Mon, Wed');
    expect(rows[0].ownerEmail).toBe('user@example.com');
  });
});
