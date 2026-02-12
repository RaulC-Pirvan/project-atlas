'use client';
import Link from 'next/link';
import type { KeyboardEvent } from 'react';
import { useId } from 'react';

import { useOfflineCompletionSnapshot } from '../../lib/habits/offlineQueueClient';
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
  'inline-flex items-center justify-center rounded-full border border-black/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:px-4 sm:text-xs dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30';

export function CalendarMonth({
  monthLabel,
  weekStart,
  weeks,
  prevHref,
  nextHref,
}: CalendarMonthProps) {
  const weekdayOrder = getWeekdayOrder(weekStart);
  const keyboardHintId = useId();
  const gridSize = weeks.length * 7;
  const offlineSnapshot = useOfflineCompletionSnapshot();

  const focusByIndex = (grid: HTMLElement, index: number) => {
    const target = grid.querySelector<HTMLElement>(
      `[data-grid-index="${index}"][data-focusable="true"]`,
    );
    if (target) {
      target.focus();
      return true;
    }
    return false;
  };

  const focusEdge = (grid: HTMLElement, direction: 'start' | 'end') => {
    const maxIndex = gridSize - 1;
    const start = direction === 'start' ? 0 : maxIndex;
    const end = direction === 'start' ? maxIndex : 0;
    const step = direction === 'start' ? 1 : -1;

    for (let index = start; direction === 'start' ? index <= end : index >= end; index += step) {
      if (focusByIndex(grid, index)) return;
    }
  };

  const focusAdjacent = (grid: HTMLElement, currentIndex: number, delta: number) => {
    const maxIndex = gridSize - 1;
    let nextIndex = currentIndex + delta;

    while (nextIndex >= 0 && nextIndex <= maxIndex) {
      if (focusByIndex(grid, nextIndex)) return;
      nextIndex += delta;
    }
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    const { key } = event;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }

    const grid = event.currentTarget.closest<HTMLElement>('[data-calendar-grid]');
    if (!grid) return;

    const rawIndex = event.currentTarget.getAttribute('data-grid-index');
    const currentIndex = rawIndex ? Number(rawIndex) : Number.NaN;
    if (!Number.isFinite(currentIndex)) return;

    event.preventDefault();

    if (key === 'Home') {
      focusEdge(grid, 'start');
      return;
    }

    if (key === 'End') {
      focusEdge(grid, 'end');
      return;
    }

    const delta = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : key === 'ArrowUp' ? -7 : 7;
    focusAdjacent(grid, currentIndex, delta);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Month
          </p>
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

      <p id={keyboardHintId} className="sr-only">
        Use arrow keys to move between days in the calendar.
      </p>
      <div className="overflow-hidden border border-black/10 dark:border-white/10">
        <div
          className="grid grid-cols-7 gap-px bg-black/10 dark:bg-white/10"
          data-testid="calendar-grid"
          data-calendar-grid
          data-grid-size={gridSize}
          aria-describedby={keyboardHintId}
        >
          {weekdayOrder.map((weekday) => (
            <div
              key={weekday}
              className="flex items-center justify-center bg-white px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/60 sm:px-3 sm:text-xs dark:bg-black dark:text-white/60"
            >
              {getWeekdayLabel(weekday)}
            </div>
          ))}

          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const isComplete = day.totalCount > 0 && day.completedCount >= day.totalCount;
              const progressPercent =
                day.totalCount > 0 ? Math.min(100, (day.completedCount / day.totalCount) * 100) : 0;
              const gridIndex = weekIndex * 7 + dayIndex;
              const pendingSet = offlineSnapshot.pendingByDate.get(day.key);
              const pendingCount = pendingSet?.size ?? 0;
              const hasPending = pendingCount > 0;
              const baseCellClasses =
                'group flex min-h-[64px] touch-manipulation flex-col justify-between px-2 py-2 text-left text-xs motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none sm:min-h-[86px] sm:px-3 sm:text-sm';
              const mutedClasses = day.inMonth
                ? 'text-black dark:text-white'
                : 'text-black/30 dark:text-white/30';
              const backgroundClasses = isComplete
                ? 'bg-[#FAB95B] text-black'
                : 'bg-white dark:bg-black';
              const hoverClasses = day.inMonth
                ? isComplete
                  ? 'hover:bg-[#E9A543] focus-visible:bg-[#E9A543] active:bg-[#D99638] active:scale-[0.98]'
                  : 'hover:bg-black/5 focus-visible:bg-black/5 active:bg-black/10 active:scale-[0.98] dark:hover:bg-white/10 dark:focus-visible:bg-white/10 dark:active:bg-white/20'
                : '';
              const todayClasses = day.isToday
                ? 'ring-1 ring-black ring-inset dark:ring-white/60'
                : '';
              const selectedClasses = day.isSelected
                ? isComplete
                  ? 'ring-2 ring-black ring-inset dark:ring-white'
                  : 'ring-2 ring-black ring-inset bg-black/5 dark:ring-white dark:bg-white/10'
                : '';
              const focusClasses =
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30';
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
                          className={`relative h-1 w-full rounded-full ${
                            isComplete
                              ? 'bg-black/20 dark:bg-white/20'
                              : 'bg-black/10 dark:bg-white/10'
                          }`}
                          aria-hidden="true"
                        >
                          <div
                            className={`h-full rounded-full ${
                              isComplete ? 'bg-black' : 'bg-black dark:bg-white'
                            } motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none`}
                            style={{ width: `${progressPercent}%` }}
                          />
                          {hasPending ? (
                            <div
                              className={`absolute inset-0 rounded-full border border-dashed ${
                                isComplete
                                  ? 'border-black/60 dark:border-white/60'
                                  : 'border-black/40 dark:border-white/40'
                              }`}
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                        {hasPending ? <span className="sr-only">Pending sync</span> : null}
                      </>
                    ) : (
                      <div className="h-1 w-full" aria-hidden="true" />
                    )}
                    <div className="flex items-center gap-2">
                      {day.hasHabits ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isComplete ? 'bg-black' : 'bg-black dark:bg-white'
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-1.5 w-1.5" aria-hidden="true" />
                      )}
                      {hasPending ? (
                        <span
                          className={`h-2 w-2 rounded-full border border-dashed motion-safe:animate-spin motion-reduce:animate-none ${
                            isComplete
                              ? 'border-black/70 dark:border-white/70'
                              : 'border-black/40 dark:border-white/40'
                          }`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  </div>
                </>
              );

              if (!day.inMonth) {
                return (
                  <div
                    key={day.key}
                    className={cellClasses}
                    aria-hidden="true"
                    data-grid-index={gridIndex}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={day.key}
                  href={day.href}
                  data-date-key={day.key}
                  data-grid-index={gridIndex}
                  data-focusable="true"
                  scroll={false}
                  className={cellClasses}
                  aria-label={`Open daily view for ${day.label}`}
                  aria-current={day.isToday ? 'date' : undefined}
                  aria-selected={day.isSelected || undefined}
                  onKeyDown={handleDayKeyDown}
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
