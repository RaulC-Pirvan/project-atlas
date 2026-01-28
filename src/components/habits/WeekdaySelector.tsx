'use client';

import { Button } from '../ui/Button';
import { getWeekdayLabel, getWeekdayOrder, normalizeWeekdays, type WeekStart } from './weekdays';

type WeekdaySelectorProps = {
  value: number[];
  weekStart: WeekStart;
  onChange: (weekdays: number[]) => void;
  disabled?: boolean;
};

export function WeekdaySelector({
  value,
  weekStart,
  onChange,
  disabled = false,
}: WeekdaySelectorProps) {
  const normalized = normalizeWeekdays(value);
  const selected = new Set(normalized);

  const toggleDay = (weekday: number) => {
    const next = selected.has(weekday)
      ? normalized.filter((day) => day !== weekday)
      : normalizeWeekdays([...normalized, weekday]);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {getWeekdayOrder(weekStart).map((weekday) => {
        const isActive = selected.has(weekday);
        return (
          <Button
            key={weekday}
            type="button"
            size="sm"
            variant={isActive ? 'primary' : 'outline'}
            className="min-w-[60px]"
            onClick={() => toggleDay(weekday)}
            disabled={disabled}
            aria-pressed={isActive}
          >
            {getWeekdayLabel(weekday)}
          </Button>
        );
      })}
    </div>
  );
}
