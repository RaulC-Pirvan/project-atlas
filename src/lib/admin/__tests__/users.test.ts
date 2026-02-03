import { describe, expect, it, vi } from 'vitest';

import { listAdminUsers } from '../users';

describe('listAdminUsers', () => {
  it('returns counts and paginated users', async () => {
    const prisma = {
      user: {
        count: vi.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'u3',
            email: 'third@example.com',
            displayName: 'Third',
            emailVerified: new Date('2026-01-01T00:00:00.000Z'),
            createdAt: new Date('2026-02-03T00:00:00.000Z'),
            deletedAt: null,
          },
          {
            id: 'u2',
            email: 'second@example.com',
            displayName: 'Second',
            emailVerified: null,
            createdAt: new Date('2026-02-02T00:00:00.000Z'),
            deletedAt: null,
          },
          {
            id: 'u1',
            email: 'first@example.com',
            displayName: 'First',
            emailVerified: null,
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            deletedAt: null,
          },
        ]),
      },
    };

    const result = await listAdminUsers({
      prisma,
      search: 'example',
      take: 2,
    });

    expect(result.counts).toEqual({ total: 3, verified: 2, unverified: 1 });
    expect(result.users).toHaveLength(2);
    expect(result.nextCursor).toBe('u2');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });
});
