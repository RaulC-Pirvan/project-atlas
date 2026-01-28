import Link from 'next/link';

import { getWeekdayLabel, getWeekdayOrder, type WeekStart } from '../habits/weekdays';

export type CalendarDayView = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasHabits: boolean;
  label: string;
  href: string;
};

export type CalendarWeekView = CalendarDayView[];

type CalendarMonthProps = {
  monthLabel: string;
  weekStart: WeekStart;
  weeks: CalendarWeekView[];
  prevHref: string;
  nextHref: string;
};

const navButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

export function CalendarMonth({
  monthLabel,
  weekStart,
  weeks,
  prevHref,
  nextHref,
}: CalendarMonthProps) {
  const weekdayOrder = getWeekdayOrder(weekStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">Month</p>
          <h2 className="text-2xl font-semibold tracking-tight">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href={prevHref} className={navButtonClasses} aria-label="Previous month">
            Prev
          </Link>
          <Link href={nextHref} className={navButtonClasses} aria-label="Next month">
            Next
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10">
        <div className="grid grid-cols-7 gap-px bg-black/10">
          {weekdayOrder.map((weekday) => (
            <div
              key={weekday}
              className="bg-white px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-black/60"
            >
              {getWeekdayLabel(weekday)}
            </div>
          ))}

          {weeks.map((week) =>
            week.map((day) => {
              const baseCellClasses =
                'group flex min-h-[86px] flex-col justify-between bg-white px-3 py-2 text-left text-sm transition';
              const mutedClasses = day.inMonth ? 'text-black' : 'text-black/30';
              const hoverClasses = day.inMonth ? 'hover:bg-black/5 focus-visible:bg-black/5' : '';
              const todayClasses = day.isToday ? 'ring-1 ring-black ring-inset' : '';
              const selectedClasses = day.isSelected
                ? 'ring-2 ring-black ring-inset bg-black/5'
                : '';
              const cellClasses = [
                baseCellClasses,
                mutedClasses,
                hoverClasses,
                todayClasses,
                selectedClasses,
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-black/20',
              ]
                .filter(Boolean)
                .join(' ');

              const content = (
                <>
                  <span className="text-lg font-semibold">{day.day}</span>
                  <div className="flex items-center">
                    {day.hasHabits ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-black" aria-hidden="true" />
                    ) : (
                      <span className="h-1.5 w-1.5" aria-hidden="true" />
                    )}
                  </div>
                </>
              );

              if (!day.inMonth) {
                return (
                  <div key={day.key} className={cellClasses} aria-hidden="true">
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={day.key}
                  href={day.href}
                  className={cellClasses}
                  aria-label={`Open daily view for ${day.label}`}
                >
                  {content}
                </Link>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
