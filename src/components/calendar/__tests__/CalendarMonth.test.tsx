import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CalendarMonth, type CalendarWeekView } from '../CalendarMonth';

function makeDay(day: number, hasHabits: boolean) {
  const padded = String(day).padStart(2, '0');
  return {
    key: `2026-02-${padded}`,
    day,
    inMonth: true,
    isToday: false,
    hasHabits,
    label: `February ${day}, 2026`,
  };
}

describe('CalendarMonth', () => {
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
});
