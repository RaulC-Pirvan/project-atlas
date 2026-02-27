import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildQueueItem, getOfflineCompletionQueue } from '../../../lib/habits/offlineQueue';
import { CalendarMonth, type CalendarWeekView } from '../CalendarMonth';

function makeDay(
  day: number,
  hasHabits: boolean,
  counts: { completedCount?: number; totalCount?: number } = {},
) {
  const padded = String(day).padStart(2, '0');
  return {
    key: `2026-02-${padded}`,
    day,
    inMonth: true,
    isToday: false,
    isSelected: false,
    hasHabits,
    completedCount: counts.completedCount ?? 0,
    totalCount: counts.totalCount ?? 0,
    label: `February ${day}, 2026`,
    href: `/calendar?month=2026-02&date=2026-02-${padded}`,
  };
}

describe('CalendarMonth', () => {
  beforeEach(async () => {
    const queue = getOfflineCompletionQueue();
    await queue.hydrate();
    await queue.replaceAll([]);
  });

  it('renders a habit indicator for days with active habits', () => {
    const week: CalendarWeekView = [
      makeDay(1, false),
      makeDay(2, false),
      makeDay(3, false),
      makeDay(4, false),
      makeDay(5, true),
      makeDay(6, false),
      makeDay(7, false),
    ];

    render(
      <CalendarMonth
        monthLabel="February 2026"
        weekStart="mon"
        weeks={[week]}
        prevHref="/calendar?month=2026-01"
        nextHref="/calendar?month=2026-03"
      />,
    );

    const habitDay = screen.getByRole('link', {
      name: /open daily view for February 5, 2026/i,
    });
    const nonHabitDay = screen.getByRole('link', {
      name: /open daily view for February 4, 2026/i,
    });

    expect(habitDay.querySelector('span.bg-black')).not.toBeNull();
    expect(nonHabitDay.querySelector('span.bg-black')).toBeNull();
  });

  it('marks fully completed days as filled tiles', () => {
    const week: CalendarWeekView = [
      makeDay(5, true, { completedCount: 2, totalCount: 2 }),
      makeDay(6, true, { completedCount: 1, totalCount: 2 }),
    ];

    render(
      <CalendarMonth
        monthLabel="February 2026"
        weekStart="mon"
        weeks={[week]}
        prevHref="/calendar?month=2026-01"
        nextHref="/calendar?month=2026-03"
      />,
    );

    const completedDay = screen.getByRole('link', {
      name: /open daily view for February 5, 2026/i,
    });
    const partialDay = screen.getByRole('link', {
      name: /open daily view for February 6, 2026/i,
    });

    expect(completedDay).toHaveAttribute('data-complete', 'true');
    expect(completedDay.className).not.toMatch(/(^|\s)text-white(\s|$)/);
    expect(partialDay.className).not.toMatch(/(^|\s)text-white(\s|$)/);
    expect(screen.getByText(/2 of 2 habits completed/i)).toBeInTheDocument();
  });

  it('uses semantic accent tokens for completed-day styling', () => {
    const week: CalendarWeekView = [makeDay(5, true, { completedCount: 1, totalCount: 1 })];

    render(
      <CalendarMonth
        monthLabel="February 2026"
        weekStart="mon"
        weeks={[week]}
        prevHref="/calendar?month=2026-01"
        nextHref="/calendar?month=2026-03"
      />,
    );

    const completedDay = screen.getByRole('link', {
      name: /open daily view for February 5, 2026/i,
    });
    expect(completedDay.className).toContain('bg-[var(--color-accent-solid)]');
    expect(completedDay.className).toContain('text-[color:var(--color-text-on-accent)]');
  });

  it('moves focus between days with arrow keys', () => {
    const week: CalendarWeekView = [
      makeDay(1, false),
      makeDay(2, false),
      makeDay(3, false),
      makeDay(4, false),
      makeDay(5, false),
      makeDay(6, false),
      makeDay(7, false),
    ];

    render(
      <CalendarMonth
        monthLabel="February 2026"
        weekStart="mon"
        weeks={[week]}
        prevHref="/calendar?month=2026-01"
        nextHref="/calendar?month=2026-03"
      />,
    );

    const day1 = screen.getByRole('link', { name: /February 1, 2026/i });
    const day2 = screen.getByRole('link', { name: /February 2, 2026/i });
    const day7 = screen.getByRole('link', { name: /February 7, 2026/i });

    day2.focus();
    expect(day2).toHaveFocus();

    fireEvent.keyDown(day2, { key: 'ArrowLeft' });
    expect(day1).toHaveFocus();

    fireEvent.keyDown(day1, { key: 'End' });
    expect(day7).toHaveFocus();
  });

  it('shows pending sync indicator for queued days', async () => {
    const queue = getOfflineCompletionQueue();
    await queue.hydrate();
    await queue.replaceAll([
      buildQueueItem({
        habitId: 'h1',
        dateKey: '2026-02-05',
        completed: true,
        now: new Date('2026-02-05T10:00:00.000Z'),
      }),
    ]);

    const week: CalendarWeekView = [
      makeDay(5, true, { completedCount: 0, totalCount: 1 }),
      makeDay(6, true, { completedCount: 0, totalCount: 1 }),
    ];

    render(
      <CalendarMonth
        monthLabel="February 2026"
        weekStart="mon"
        weeks={[week]}
        prevHref="/calendar?month=2026-01"
        nextHref="/calendar?month=2026-03"
      />,
    );

    const pendingDay = screen.getByRole('link', {
      name: /open daily view for February 5, 2026/i,
    });

    await screen.findByText(/pending sync/i);
    expect(pendingDay).toHaveAttribute('data-pending', 'true');
    expect(within(pendingDay).getByText(/pending sync/i)).toBeInTheDocument();
  });
});
