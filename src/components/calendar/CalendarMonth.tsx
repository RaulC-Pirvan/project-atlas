import Link from 'next/link';

import { getWeekdayLabel, getWeekdayOrder, type WeekStart } from '../habits/weekdays';

export type CalendarDayView = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasHabits: boolean;
  completedCount: number;
  totalCount: number;
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
  'inline-flex items-center justify-center rounded-full border border-black/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:px-4 sm:text-xs';

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

      <div className="overflow-hidden border border-black/10">
        <div className="grid grid-cols-7 gap-px bg-black/10">
          {weekdayOrder.map((weekday) => (
            <div
              key={weekday}
              className="bg-white px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-black/60 sm:px-3 sm:text-xs"
            >
              {getWeekdayLabel(weekday)}
            </div>
          ))}

          {weeks.map((week) =>
            week.map((day) => {
              const isComplete = day.totalCount > 0 && day.completedCount >= day.totalCount;
              const progressPercent =
                day.totalCount > 0 ? Math.min(100, (day.completedCount / day.totalCount) * 100) : 0;
              const baseCellClasses =
                'group flex min-h-[64px] touch-manipulation flex-col justify-between px-2 py-2 text-left text-xs motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none sm:min-h-[86px] sm:px-3 sm:text-sm';
              const mutedClasses = day.inMonth ? 'text-black' : 'text-black/30';
              const backgroundClasses = isComplete ? 'bg-[#FAB95B] text-white' : 'bg-white';
              const hoverClasses = day.inMonth
                ? isComplete
                  ? 'hover:bg-[#E9A543] focus-visible:bg-[#E9A543]'
                  : 'hover:bg-black/5 focus-visible:bg-black/5'
                : '';
              const todayClasses = day.isToday ? 'ring-1 ring-black ring-inset' : '';
              const selectedClasses = day.isSelected
                ? isComplete
                  ? 'ring-2 ring-black ring-inset'
                  : 'ring-2 ring-black ring-inset bg-black/5'
                : '';
              const focusClasses =
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';
              const cellClasses = [
                baseCellClasses,
                mutedClasses,
                backgroundClasses,
                hoverClasses,
                todayClasses,
                selectedClasses,
                focusClasses,
              ]
                .filter(Boolean)
                .join(' ');

              const content = (
                <>
                  <span className="text-base font-semibold sm:text-lg">{day.day}</span>
                  <div className="space-y-2">
                    {day.totalCount > 0 ? (
                      <>
                        <span className="sr-only">
                          {day.completedCount} of {day.totalCount} habits completed
                        </span>
                        <div
                          className={`h-1 w-full rounded-full ${
                            isComplete ? 'bg-white/30' : 'bg-black/10'
                          }`}
                          aria-hidden="true"
                        >
                          <div
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-white' : 'bg-black'
                            } motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-1 w-full" aria-hidden="true" />
                    )}
                    <div className="flex items-center">
                      {day.hasHabits ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isComplete ? 'bg-white' : 'bg-black'
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-1.5 w-1.5" aria-hidden="true" />
                      )}
                    </div>
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
