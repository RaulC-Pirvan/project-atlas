import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../errors';
import { archiveHabit, createHabit, listHabits, updateHabit } from '../habits';

describe('habit api services', () => {
  it('creates a habit with normalized fields', async () => {
    const prisma = {
      habit: {
        create: vi.fn().mockResolvedValue({
          id: 'h1',
          title: 'Read',
          description: 'Desc',
          archivedAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          schedule: [{ weekday: 1 }, { weekday: 3 }],
        }),
      },
    };

    const habit = await createHabit({
      prisma,
      userId: 'u1',
      title: '  Read  ',
      description: ' Desc ',
      weekdays: [3, 1, 1],
    });

    expect(habit.weekdays).toEqual([1, 3]);
    expect(prisma.habit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Read',
          description: 'Desc',
          schedule: { create: [{ weekday: 1 }, { weekday: 3 }] },
        }),
      }),
    );
  });

  it('lists habits with sorted weekdays', async () => {
    const prisma = {
      habit: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'h1',
            title: 'Read',
            description: null,
            archivedAt: null,
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            schedule: [{ weekday: 5 }, { weekday: 1 }],
          },
        ]),
      },
    };

    const habits = await listHabits({ prisma, userId: 'u1' });

    expect(habits[0].weekdays).toEqual([1, 5]);
  });

  it('updates a habit schedule atomically', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({ id: 'h1' }),
        update: vi.fn().mockResolvedValue({
          id: 'h1',
          title: 'Updated',
          description: null,
          archivedAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          schedule: [{ weekday: 2 }],
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'h1',
          title: 'Updated',
          description: null,
          archivedAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          schedule: [{ weekday: 2 }],
        }),
      },
    };

    const habit = await updateHabit({
      prisma,
      userId: 'u1',
      habitId: 'h1',
      title: ' Updated ',
      weekdays: [2],
    });

    expect(habit.title).toBe('Updated');
    expect(prisma.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Updated',
          schedule: {
            deleteMany: {},
            create: [{ weekday: 2 }],
          },
        }),
      }),
    );
  });

  it('archives a habit', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({ id: 'h1' }),
        update: vi.fn().mockResolvedValue({ id: 'h1' }),
      },
    };

    const result = await archiveHabit({ prisma, userId: 'u1', habitId: 'h1' });

    expect(result).toEqual({ habitId: 'h1' });
    expect(prisma.habit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });

  it('throws when habit is missing', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    await expect(
      updateHabit({ prisma, userId: 'u1', habitId: 'missing', title: 'Title' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
