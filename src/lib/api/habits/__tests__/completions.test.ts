import { describe, expect, it, vi } from 'vitest';

import { utcDate } from '../../../habits/__tests__/fixtures';
import { ApiError } from '../../errors';
import { listCompletionsForDate, toggleCompletion } from '../completions';

const schedule = (weekday: number) => [{ weekday }];

describe('completion api services', () => {
  it('creates a completion when missing', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'h1',
          archivedAt: null,
          schedule: schedule(1),
        }),
      },
      habitCompletion: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'c1' }),
        delete: vi.fn(),
      },
    };

    const date = utcDate(2026, 1, 5);
    const result = await toggleCompletion({
      prisma,
      userId: 'u1',
      habitId: 'h1',
      date,
      completed: true,
      timeZone: 'UTC',
      now: date,
    });

    expect(result.status).toBe('created');
    expect(prisma.habitCompletion.create).toHaveBeenCalled();
  });

  it('returns noop when already complete', async () => {
    const date = utcDate(2026, 1, 5);
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'h1',
          archivedAt: null,
          schedule: schedule(1),
        }),
      },
      habitCompletion: {
        findFirst: vi.fn().mockResolvedValue({ id: 'c1', habitId: 'h1', date }),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    const result = await toggleCompletion({
      prisma,
      userId: 'u1',
      habitId: 'h1',
      date,
      completed: true,
      timeZone: 'UTC',
      now: date,
    });

    expect(result.status).toBe('noop');
    expect(prisma.habitCompletion.create).not.toHaveBeenCalled();
  });

  it('deletes a completion when unchecking', async () => {
    const date = utcDate(2026, 1, 5);
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'h1',
          archivedAt: null,
          schedule: schedule(1),
        }),
      },
      habitCompletion: {
        findFirst: vi.fn().mockResolvedValue({ id: 'c1', habitId: 'h1', date }),
        create: vi.fn(),
        delete: vi.fn().mockResolvedValue({ id: 'c1' }),
      },
    };

    const result = await toggleCompletion({
      prisma,
      userId: 'u1',
      habitId: 'h1',
      date,
      completed: false,
      timeZone: 'UTC',
      now: date,
    });

    expect(result.status).toBe('deleted');
    expect(prisma.habitCompletion.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('rejects when habit is missing', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      habitCompletion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    await expect(
      toggleCompletion({
        prisma,
        userId: 'u1',
        habitId: 'missing',
        date: utcDate(2026, 1, 5),
        completed: true,
        timeZone: 'UTC',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects when habit is inactive on the date', async () => {
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'h1',
          archivedAt: null,
          schedule: schedule(2),
        }),
      },
      habitCompletion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    await expect(
      toggleCompletion({
        prisma,
        userId: 'u1',
        habitId: 'h1',
        date: utcDate(2026, 1, 5),
        completed: true,
        timeZone: 'UTC',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects future completions', async () => {
    const date = utcDate(2026, 1, 10);
    const prisma = {
      habit: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'h1',
          archivedAt: null,
          schedule: schedule(5),
        }),
      },
      habitCompletion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    await expect(
      toggleCompletion({
        prisma,
        userId: 'u1',
        habitId: 'h1',
        date,
        completed: true,
        timeZone: 'UTC',
        now: utcDate(2026, 1, 5),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('lists completions for a date', async () => {
    const date = utcDate(2026, 1, 5);
    const prisma = {
      habitCompletion: {
        findMany: vi.fn().mockResolvedValue([
          { habitId: 'h1', date },
          { habitId: 'h2', date },
        ]),
      },
    };

    const result = await listCompletionsForDate({ prisma, userId: 'u1', date });

    expect(result).toEqual([
      { habitId: 'h1', date: '2026-01-05' },
      { habitId: 'h2', date: '2026-01-05' },
    ]);
  });
});
